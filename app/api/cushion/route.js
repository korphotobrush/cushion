import { NextResponse } from "next/server";

const RELATIONS = {
  "상사/클라이언트": "격식체를 사용하고 상대를 존중하는 표현을 써주세요.",
  "동료": "너무 딱딱하지도 너무 부드럽지도 않게, 업무적이지만 따뜻한 톤으로 조정하세요.",
  "친구/후배": "직접적이고 편하게, 자연스러운 구어체로 유지하세요.",
  "공식 문서": "공무원 문서/공문 스타일로 작성하세요. '~함', '~임', '~할 것', '~바람', '~요망' 등 행정 문어체를 사용하고 감정 표현을 완전히 제거하세요.",
};

const STRENGTH_GUIDE = {
  1: `매우 퉁명스럽고 무뚝뚝한 반말. 쿠션어 0%. 존댓말 절대 금지. 최대한 짧고 차갑게.`,
  2: `반말이지만 1단계보다는 조금 부드럽게. 쿠션어 없음. 존댓말 금지.`,
  3: `존댓말 기본. 쿠션어 1~2개. 바로 쓸 수 있는 자연스러운 수준.`,
  4: `존댓말 + 쿠션어 3~4개. 정중하고 배려 넘치게.`,
  5: `극존칭 + 쿠션어 최대. 한 문장을 5~10줄로 늘려서 쿠션어를 꽉꽉 채울 것. 읽는 사람이 부담스러울 정도로 과하게.`,
};

const SUSPICIOUS = [
  "수정된 문장", "수정 필요", "조정된 문장",
  "조정해야", "변경해야", "사용해야", "표현해야",
  "해야 한다", "해야 합니다", "톤으로 조정",
  "쿠션어를 추가", "제시합니다", "필요할 수 있",
  "다듬어야", "느껴질 수 있", "분석하여", "강도 조절"
];

const GROQ_FALLBACKS = [
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
  "llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
];

async function callGemini(prompt, strength = 3) {
  const systemPrefix = strength === 1
    ? `[CRITICAL INSTRUCTION] You MUST rewrite in RUDE Korean 반말 with swear words (욕설). NO 요/습니다. NO polite words. Be crude and blunt. This is required.\n\n`
    : strength === 2
    ? `[INSTRUCTION] Rewrite in casual Korean 반말 without swear words. NO 요/습니다 endings. Be terse.\n\n`
    : "";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrefix + prompt }] }],
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callGroq(prompt, model) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a Korean cushion language expert. Respond with valid JSON only. No markdown, no explanation. The 'result' field must contain ONLY the final rewritten Korean message, never explanations."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGroqWithFallback(prompt) {
  for (const model of GROQ_FALLBACKS) {
    try {
      const raw = await callGroq(prompt, model);
      return { raw, provider: model };
    } catch {}
  }
  throw new Error("All Groq models failed");
}

function safeParseJSON(raw) {
  let clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);

  try { return JSON.parse(clean); } catch {}
  try { return JSON.parse(clean.replace(/[\r\n\t]/g, " ")); } catch {}

  const extract = (key) => {
    const m = clean.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    return m ? m[1] : "";
  };
  const extractArr = (key) => {
    const m = clean.match(new RegExp(`"${key}"\\s*:\\s*\\[(.*?)\\]`, "s"));
    if (!m) return [];
    return m[1].match(/"((?:[^"\\\\]|\\\\.)*)"/g)?.map(s => s.replace(/^"|"$/g, "")) || [];
  };
  return {
    diagnosis: extract("diagnosis") || "적절함",
    reason: extract("reason") || "",
    result: extract("result") || "",
    changes: extractArr("changes"),
  };
}

export async function POST(req) {
  try {
    const { message, relation, mode, targetLang, strength = 3, model = "auto" } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "입력값이 없어요." }, { status: 400 });
    }

    let prompt = "";

    if (mode === "translate") {
      prompt = `아래 한국어 메시지를 ${targetLang}로 번역해주세요. 원문의 뉘앙스와 격식 수준을 최대한 살려주세요.
원문: "${message}"
JSON만 출력: {"result": "번역 결과"}`;
    } else {
      const guide = RELATIONS[relation] || RELATIONS["동료"];
      const strengthGuide = STRENGTH_GUIDE[strength] || STRENGTH_GUIDE[3];
      const strengthWarning = strength === 1
        ? "\n⚠️ 강도 1단계 필수: 반말+욕설/비속어 포함. 존댓말 절대 금지. 쿠션어 절대 금지. 거칠고 짧게."
        : strength === 2
        ? "\n⚠️ 강도 2단계 필수: 반말. 욕은 없지만 퉁명스럽게. 존댓말 금지."
        : strength === 5
        ? "\n⚠️ 강도 5단계 필수: 원문 한 줄을 최소 5~8줄로 늘릴 것. 쿠션어 문장마다 꽉꽉 채울 것. 극존칭 필수."
        : "";

      prompt = `한국어 쿠션어 조정 작업. 원문을 지침에 맞게 다듬어주세요.

상대방: ${relation} / ${guide}
강도 ${strength}/5: ${strengthGuide}${strengthWarning}
원문: "${message}"

쿠션어 참고: "혹시 괜찮으시다면", "번거로우시겠지만", "바쁘신 중에 죄송하지만", "실례지만", "너무 아쉽지만", "일리가 있습니다만"

규칙:
- 1~2단계: 반말 필수, 존댓말 금지
- 3~5단계: 존댓말, 나→저, 너/당신→직함
- 원문에 없는 영어 추가 금지
- result에는 완성된 실제 메시지만. 설명문 절대 금지
- diagnosis: "쿠션어 과다" 또는 "쿠션어 부족" 또는 "적절함" 중 하나만

JSON만 출력:
{"diagnosis":"쿠션어 부족","reason":"진단 이유","result":"조정된 실제 메시지","changes":["변경사항1","변경사항2"]}`;
    }

    let raw = "";
    let provider = "gemini";

    if (model === "gemini") {
      raw = await callGemini(prompt, strength);
      provider = "gemini";
    } else if (model === "groq-70b") {
      raw = await callGroq(prompt, "llama-3.3-70b-versatile");
      provider = "groq-70b";
    } else if (model === "groq-8b") {
      raw = await callGroq(prompt, "llama-3.1-8b-instant");
      provider = "groq-8b";
    } else {
      // auto: Gemini 먼저, 실패시 Groq 순차 폴백
      try {
        raw = await callGemini(prompt);
        provider = "gemini";
      } catch {
        const result = await callGroqWithFallback(prompt);
        raw = result.raw;
        provider = result.provider;
      }
    }

    const parsed = safeParseJSON(raw);
    console.log("raw:", raw?.slice(0, 200));
    console.log("parsed result:", parsed.result?.slice(0, 100));

    if (!parsed.result || parsed.result.length < 3 || SUSPICIOUS.some(s => parsed.result.includes(s))) {
      console.log("SUSPICIOUS hit:", parsed.result?.slice(0, 100));
      return NextResponse.json({ error: "잠시 문제가 생겼어요. 다시 시도해주세요." }, { status: 500 });
    }

    return NextResponse.json({ ...parsed, provider });

  } catch (e) {
    console.error("cushion error:", e);
    return NextResponse.json({ error: "잠시 문제가 생겼어요. 다시 시도해주세요." }, { status: 500 });
  }
}