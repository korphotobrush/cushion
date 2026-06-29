import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = [
  "llama-3.3-70b-versatile",
  "qwen/qwen3-32b",
  "llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
];

const FALLBACK_THRESHOLD = 1;

const SUSPICIOUS = [
  "다음은", "아래는", "번역:", "결과:", "수정된", "쿠션어로",
  "재작성", "변환", "원문:", "원본:", "참고:", "물론이죠",
  "네, ", "알겠습니다", "안녕하세요",
];

const MAX_INPUT_LENGTH = 500;
const MIN_INPUT_LENGTH = 2;

function safeParseJSON(raw: string): { result?: string; tone?: string; diagnosis?: string; reason?: string; changes?: string[] } {
  try {
    const cleaned = raw.replace(/```json?|```/g, "").trim();
    const json = cleaned.match(/\{[\s\S]*\}/)?.[0] ?? cleaned;
    return JSON.parse(json);
  } catch {
    // JSON 파싱 실패 시 result 값만 정규식으로 직접 추출
    const resultMatch = raw.match(/"result"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (resultMatch) {
      const diagMatch = raw.match(/"diagnosis"\s*:\s*"([^"]+)"/);
      const reasonMatch = raw.match(/"reason"\s*:\s*"([^"]+)"/);
      return {
        result: resultMatch[1].replace(/\\n/g, "\n"),
        diagnosis: diagMatch?.[1],
        reason: reasonMatch?.[1],
        changes: [],
      };
    }
    return {};
  }
}

function buildSystemPrompt(strength: number, target: string): string {
  const strengthDesc: Record<number, string> = {
    1: "매우 직접적이고 간결하게. 존댓말 없이 반말로. 설명 없이 핵심만.",
    2: "약간 직접적으로. 반말 허용.",
    3: "자연스럽고 정중하게. 기본 존댓말.",
    4: "부드럽고 배려 있게. 정중한 존댓말.",
    5: "매우 공손하고 조심스럽게. 격식체 존댓말. 완곡한 표현 최대화, 거부감이 들 정도로 부담스럽고 공손한 쿠션어를 10개 이상사용",
  };
  const targetDesc: Record<string, string> = {
    "상사/클라이언트": "상사 또는 클라이언트에게 보내는 메시지",
    동료: "동료에게 보내는 메시지",
    "친구/후배": "친구나 후배에게 보내는 메시지",
    "공식 문서": "공식 문서 또는 이메일",
  };

  return `당신은 한국어 메시지를 쿠션어로 변환하는 전문가입니다.
대상: ${targetDesc[target] ?? "일반"}
강도: ${strengthDesc[strength] ?? strengthDesc[3]}

규칙:
- JSON 형식으로만 응답: {"result": "변환된 메시지", "tone": "한 단어 톤 설명", "diagnosis": "쿠션어 적절/쿠션어 과다/쿠션어 부족 중 하나", "reason": "한 줄 이유", "changes": ["변경사항1", "변경사항2"]}
- result에는 변환된 메시지만 포함 (설명, 주석, 원문 반복 금지)
- 질문형으로 끝내지 말 것 (strength 1-2의 경우)
- 이모지 사용 금지
- JSON 외 텍스트 절대 금지
- 입력 텍스트와 동일한 언어로만 출력할 것 (한국어 입력 → 한국어 출력, 외국어/한자/영어 혼용 절대 금지)`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message: text, strength = 3, target = "동료", language, mode, targetLang } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "텍스트를 입력해주세요." }, { status: 400 });
    }
    if (text.length < MIN_INPUT_LENGTH) {
      return NextResponse.json({ error: "너무 짧아요. 조금 더 입력해주세요." }, { status: 400 });
    }
    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json({ error: `${MAX_INPUT_LENGTH}자 이하로 입력해주세요.` }, { status: 400 });
    }

    const systemPrompt = mode === "translate"
      ? `주어진 텍스트를 ${targetLang}로 번역해주세요. JSON으로만 응답: {"result": "번역된 텍스트"}`
      : buildSystemPrompt(Number(strength), String(target));

    const userPrompt = mode === "translate"
      ? `번역해주세요:\n\n"${text}"`
      : language && language !== "한국어"
        ? `다음 메시지를 쿠션어로 변환한 후, ${language}로 번역해서 문화적 맥락에 맞게 표현해주세요:\n\n"${text}"`
        : `다음 메시지를 쿠션어로 변환해주세요:\n\n"${text}"`;

    let raw = "";
    let usedModelIndex = -1;
    let provider = "groq-70b";

    for (let i = 0; i < MODELS.length; i++) {
      try {
        const res = await getGroq().chat.completions.create({
          model: MODELS[i],
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 400,
        });
        raw = res.choices[0]?.message?.content ?? "";
        usedModelIndex = i;
        provider = i === 0 ? "groq-70b" : "groq-fallback";
        break;
      } catch (err: unknown) {
        const e = err as { status?: number };
        if (e?.status === 429 || e?.status === 503) continue;
        throw err;
      }
    }

    if (!raw) {
      return NextResponse.json(
        { error: "오늘의 쿠션어는 모두 마감되었어요 🙏\n내일 다시 만나요!" },
        { status: 503 }
      );
    }

    const parsed = safeParseJSON(raw);

    if (
      !parsed.result ||
      parsed.result.length < 3 ||
      SUSPICIOUS.some((s) => parsed.result!.includes(s))
    ) {
      console.warn("SUSPICIOUS hit:", parsed.result?.slice(0, 100));
      return NextResponse.json(
        { error: "잠시 문제가 생겼어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    const isFallback = usedModelIndex > FALLBACK_THRESHOLD;

    return NextResponse.json({
      ...parsed,
      provider,
      isFallback,
      diagnosis: parsed.diagnosis ?? "적절",
      reason: parsed.reason ?? "",
      changes: parsed.changes ?? [],
      ...(process.env.NODE_ENV === "development" && { _model: MODELS[usedModelIndex] }),
    });
  } catch (e) {
    console.error("cushion error:", e);
    return NextResponse.json(
      { error: "잠시 문제가 생겼어요. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}