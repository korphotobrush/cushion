"use client";

import { useState } from "react";

const RELATIONS = ["상사/클라이언트", "동료", "친구/후배", "공식 문서"];
const RELATION_DESC = ["격식체 + 쿠션어 최대", "적당한 완충", "편하게 직접적으로", "문어체 정제"];
const LANGUAGES = ["영어", "일본어", "중국어 (간체)", "스페인어", "프랑스어", "기타"];
const LANG_CULTURE: Record<string, string> = {
  "영어": "영어권(특히 미국/영국)에서는 지나친 쿠션어를 오히려 불명확하고 자신감 없는 표현으로 받아들이는 경향이 있어요. 직접적이고 명확한 표현이 선호됩니다.",
  "일본어": "일본어는 세계에서 쿠션어 문화가 가장 발달한 언어 중 하나예요. 'よろしくお願いします', '恐れ入りますが' 등 다양한 완충 표현이 일상적으로 쓰입니다.",
  "중국어 (간체)": "중국어(표준어)는 비즈니스 상황에서 비교적 직접적인 표현을 선호해요. 다만 '请', '麻烦您' 같은 정중한 표현은 자주 사용됩니다.",
  "스페인어": "스페인어권은 관계 중심 문화로, 대화 시작 시 안부를 묻는 것이 중요해요.",
  "프랑스어": "프랑스어는 격식체(vous)와 비격식체(tu) 구분이 명확하고, 'Je me permets de...' 같은 표현이 쿠션어 역할을 해요.",
  "기타": "언어마다 쿠션어 문화가 달라요. 번역 결과와 함께 해당 언어권의 맥락을 참고해보세요.",
};
const STRENGTH_LABEL = ["", "퉁명스럽게 😐", "약하게", "기본", "정중하게", "극존칭 😰"];

function useTheme() {
  const [dark, setDark] = useState(false);
  const toggle = () => setDark(d => !d);
  return { dark, toggle };
}

export default function Home() {
  const { dark, toggle } = useTheme();

  const bg = dark ? "#1a1a1a" : "#f5f5f3";
  const surface = dark ? "#242424" : "#ffffff";
  const surface2 = dark ? "#2e2e2e" : "#f0efeb";
  const border = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const txt = dark ? "#e8e8e6" : "#1a1a18";
  const txt2 = dark ? "#888884" : "#777772";
  const accent = "#7f77dd";
  const accentBg = dark ? "#2a2850" : "#eeedfe";
  const accentTxt = dark ? "#afa9ec" : "#534ab7";

  const [input, setInput] = useState("");
  const [relation, setRelation] = useState(0);
  const [strength, setStrength] = useState(3);
  const [model, setModel] = useState("auto");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [selectedLang, setSelectedLang] = useState("");
  const [customLang, setCustomLang] = useState("");
  const [translation, setTranslation] = useState<any>(null);
  const [translating, setTranslating] = useState(false);
  const [copiedTrans, setCopiedTrans] = useState(false);
  const [isFallback, setIsFallback] = useState(false); // 추가

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setShowTranslate(false);
    setTranslation(null);
    setIsFallback(false); // 초기화
    try {
      const res = await fetch("/api/cushion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, relation: RELATIONS[relation], strength, model }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 429 rate limit 전용 메시지
        if (res.status === 429) {
          setError("요청이 너무 많아요. 잠시 후 다시 시도해주세요. 🙏");
        } else {
          setError(data.error || "오류가 발생했어요.");
        }
      } else {
        setResult(data);
        setIsFallback(!!data.isFallback); // 폴백 여부 반영
      }
    } catch { setError("네트워크 오류가 발생했어요."); }
    setLoading(false);
  };

  const translate = async () => {
    if (!result?.result) return;
    const lang = selectedLang === "기타" ? customLang : selectedLang;
    if (!lang) return;
    setTranslating(true);
    setTranslation(null);
    try {
      const res = await fetch("/api/cushion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: result.result, relation: RELATIONS[relation], mode: "translate", targetLang: lang }),
      });
      const data = await res.json();
      if (res.ok) setTranslation(data);
    } catch {}
    setTranslating(false);
  };

  const diagColor = (d: string) => {
    if (d === "쿠션어 과다") return { bg: dark ? "#2a1f1a" : "#faece7", txt: dark ? "#f0997b" : "#993c1d" };
    if (d === "쿠션어 부족") return { bg: dark ? "#1a2030" : "#e6f1fb", txt: dark ? "#85b7eb" : "#185fa5" };
    return { bg: dark ? "#1a2a1f" : "#eaf3de", txt: dark ? "#97c459" : "#3b6d11" };
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: txt, fontFamily: "sans-serif", transition: "background 0.3s" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem 4rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: txt }}>개떡같이 말해도 찰떡같이</h1>
            <p style={{ fontSize: 13, color: txt2, margin: "4px 0 0" }}>거지같이 말해도 상황에 맞게 자동 조정해드려요</p>
          </div>
          <button onClick={toggle} style={{
            background: surface2, border: `0.5px solid ${border}`, borderRadius: 20,
            padding: "6px 14px", fontSize: 13, color: txt2, cursor: "pointer"
          }}>
            {dark ? "🌙 다크" : "☀️ 라이트"}
          </button>
        </div>

        {/* 상대방 선택 */}
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: 13, color: txt2, marginBottom: 8 }}>상대방</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {RELATIONS.map((r, i) => (
              <button key={r} onClick={() => setRelation(i)} style={{
                background: relation === i ? accentBg : surface,
                border: `0.5px solid ${relation === i ? accent : border}`,
                borderRadius: 10, padding: "10px 14px", textAlign: "left",
                cursor: "pointer", transition: "all 0.15s"
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: relation === i ? accentTxt : txt }}>{r}</div>
                <div style={{ fontSize: 11, color: relation === i ? accentTxt : txt2, marginTop: 2, opacity: 0.8 }}>{RELATION_DESC[i]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 강도 슬라이더 */}
        <div style={{ background: surface, border: `0.5px solid ${border}`, borderRadius: 10, padding: "14px 16px", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 13, color: txt2, margin: 0 }}>쿠션어 강도</p>
            <span style={{ fontSize: 12, fontWeight: 500, color: accentTxt, background: accentBg, padding: "3px 10px", borderRadius: 20 }}>
              {strength}단계 · {STRENGTH_LABEL[strength]}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: txt2 }}>약함</span>
            <input type="range" min={1} max={5} step={1} value={strength}
              onChange={e => setStrength(Number(e.target.value))}
              style={{ flex: 1, accentColor: accent }} />
            <span style={{ fontSize: 11, color: txt2 }}>강함</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "0 1px" }}>
            {[1,2,3,4,5].map(n => (
              <span key={n} style={{ fontSize: 10, color: strength === n ? accentTxt : txt2, fontWeight: strength === n ? 500 : 400, width: 20, textAlign: "center" }}>{n}</span>
            ))}
          </div>
        </div>

        {/* 모델 선택 */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
          {[
            { key: "auto", label: "🤖 자동" },
            { key: "groq-70b", label: "⚡ Groq 70B" },
            { key: "groq-8b", label: "⚡ Groq 8B" },
          ].map(m => (
            <button key={m.key} onClick={() => setModel(m.key)} style={{
              background: model === m.key ? accentBg : surface2,
              border: `0.5px solid ${model === m.key ? accent : border}`,
              borderRadius: 20, padding: "5px 12px", fontSize: 12,
              color: model === m.key ? accentTxt : txt2, cursor: "pointer"
            }}>{m.label}</button>
          ))}
        </div>

        {/* 원문 입력 */}
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: 13, color: txt2, marginBottom: 8 }}>원문 메시지</p>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 500))}
            placeholder="평소 말투로 그냥 써주세요. 예) 내일까지 보내줘. 확인 좀 해봐."
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box",
              background: surface, border: `0.5px solid ${border}`,
              borderRadius: 10, padding: "12px 14px",
              fontSize: 15, color: txt, resize: "vertical",
              fontFamily: "inherit", outline: "none",
            }}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: input.length > 450 ? "#e24b4a" : txt2, marginTop: 4 }}>
            {input.length} / 500
          </div>
        </div>

        {/* 주의 문구 */}
        <div style={{
          background: "#fffbe6", border: "0.5px solid #f0d060",
          borderRadius: 8, padding: "8px 14px", marginBottom: "1rem",
          fontSize: 12, color: "#888860"
        }}>
          ⚠️ 주의 : 해당 개떡찰떡웹은 완벽하지 않으니 알아서 처신 잘하십쇼
        </div>

        {/* 버튼 */}
        <button onClick={analyze} disabled={loading || input.trim().length < 5} style={{
          width: "100%", padding: "13px",
          background: loading || input.trim().length < 5 ? surface2 : accent,
          color: loading || input.trim().length < 5 ? txt2 : "#fff",
          border: "none", borderRadius: 10, fontSize: 15,
          fontWeight: 500, cursor: loading || input.trim().length < 5 ? "not-allowed" : "pointer",
          transition: "all 0.2s"
        }}>
          {loading ? "조정 중…" : "쿠션어 조정하기"}
        </button>

        {/* 에러 */}
        {error && (
          <div style={{
            marginTop: "1.5rem", background: dark ? "#2a1a1a" : "#fcebeb",
            border: `0.5px solid ${dark ? "#a32d2d" : "#f09595"}`,
            borderRadius: 10, padding: "1.5rem",
            color: dark ? "#f09595" : "#a32d2d", fontSize: 15,
            whiteSpace: "pre-line", textAlign: "center", lineHeight: 1.8
          }}>
            {error}
          </div>
        )}

        {/* 결과 */}
        {result && !error && (() => {
          const dc = diagColor(result.diagnosis);
          return (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "inline-block", background: dc.bg, color: dc.txt, fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20, marginBottom: 12 }}>
                {result.diagnosis} — {result.reason}
              </div>
              <div style={{ background: surface, border: `0.5px solid ${border}`, borderRadius: 10, padding: "1rem 1.25rem", marginBottom: 12 }}>
                <p style={{ fontSize: 15, color: txt, margin: 0, lineHeight: 1.7 }}>
                  {result.result.length > 2000 ? result.result.slice(0, 2000) + "…" : result.result}
                </p>
              </div>

              {/* 폴백 안내 - 추가 */}
              {isFallback && (
                <p style={{ fontSize: 12, color: txt2, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                  ⚡ 현재 응답 속도가 평소보다 느릴 수 있어요.
                </p>
              )}

              {result.changes?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {result.changes.map((c: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, color: txt2, padding: "4px 0", display: "flex", gap: 8 }}>
                      <span style={{ color: accent, flexShrink: 0 }}>·</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <button onClick={() => { navigator.clipboard.writeText(result.result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
                  background: surface2, border: `0.5px solid ${border}`, borderRadius: 8, padding: "8px 16px", fontSize: 13, color: copied ? accentTxt : txt2, cursor: "pointer"
                }}>{copied ? "복사됨 ✓" : "결과 복사"}</button>
                <span style={{ fontSize: 12, color: txt2 }}>{result.provider} 로 처리됨</span>
              </div>

              {/* 번역 버튼 */}
              <button onClick={() => { setShowTranslate(!showTranslate); setTranslation(null); setSelectedLang(""); setCustomLang(""); }} style={{
                background: showTranslate ? accentBg : surface2,
                border: `0.5px solid ${showTranslate ? accent : border}`,
                borderRadius: 8, padding: "8px 16px", fontSize: 13,
                color: showTranslate ? accentTxt : txt2, cursor: "pointer"
              }}>🌐 외국어로 번역하기</button>

              {/* 번역 패널 */}
              {showTranslate && (
                <div style={{ marginTop: 12, background: surface, border: `0.5px solid ${border}`, borderRadius: 12, padding: "1.25rem" }}>
                  <p style={{ fontSize: 13, color: txt2, margin: "0 0 10px" }}>번역할 언어 선택</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {LANGUAGES.map(l => (
                      <button key={l} onClick={() => { setSelectedLang(l); setTranslation(null); }} style={{
                        background: selectedLang === l ? accentBg : surface2,
                        border: `0.5px solid ${selectedLang === l ? accent : border}`,
                        borderRadius: 20, padding: "6px 14px", fontSize: 13,
                        color: selectedLang === l ? accentTxt : txt2, cursor: "pointer"
                      }}>{l}</button>
                    ))}
                  </div>
                  {selectedLang === "기타" && (
                    <input value={customLang} onChange={e => setCustomLang(e.target.value)}
                      placeholder="언어 입력 (예: 베트남어, 아랍어)"
                      style={{ width: "100%", boxSizing: "border-box", background: surface2, border: `0.5px solid ${border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, color: txt, marginBottom: 12, outline: "none" }} />
                  )}
                  {selectedLang && (
                    <button onClick={translate} disabled={translating || (selectedLang === "기타" && !customLang)} style={{
                      background: translating ? surface2 : accent, color: translating ? txt2 : "#fff",
                      border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14,
                      cursor: translating ? "not-allowed" : "pointer", marginBottom: 12
                    }}>{translating ? "번역 중…" : "번역하기"}</button>
                  )}
                  {translation && (
                    <div>
                      <div style={{ background: surface2, borderRadius: 10, padding: "1rem", marginBottom: 12 }}>
                        <p style={{ fontSize: 13, color: txt2, margin: "0 0 6px" }}>{selectedLang === "기타" ? customLang : selectedLang} 번역</p>
                        <p style={{ fontSize: 15, color: txt, margin: 0, lineHeight: 1.7 }}>{translation.result}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(translation.result); setCopiedTrans(true); setTimeout(() => setCopiedTrans(false), 2000); }} style={{
                        background: surface2, border: `0.5px solid ${border}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, color: copiedTrans ? accentTxt : txt2, cursor: "pointer", marginBottom: 16
                      }}>{copiedTrans ? "복사됨 ✓" : "번역 복사"}</button>
                      <div style={{ background: accentBg, borderRadius: 10, padding: "1rem", borderLeft: `3px solid ${accent}` }}>
                        <p style={{ fontSize: 12, color: accentTxt, margin: "0 0 6px", fontWeight: 500 }}>
                          💬 {selectedLang === "기타" ? customLang : selectedLang}권의 쿠션어 문화
                        </p>
                        <p style={{ fontSize: 13, color: accentTxt, margin: 0, lineHeight: 1.7, opacity: 0.9 }}>
                          {LANG_CULTURE[selectedLang] || LANG_CULTURE["기타"]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* 하단 광고 */}
        <div style={{ border: `0.5px solid ${border}`, borderRadius: 10, height: 90, marginTop: "2rem" }} />

        {/* 푸터 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="https://instagram.com/photobrush_kor" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: txt2, textDecoration: "none" }}>
              @photobrush_kor
            </a>
            {/* 개인정보처리방침 링크 추가 */}
            <a href="/privacy"
              style={{ fontSize: 12, color: txt2, textDecoration: "none", opacity: 0.6 }}>
              개인정보처리방침
            </a>
          </div>
          <a href="https://danhobax.vercel.app" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: txt2, textDecoration: "none" }}>
            싫은소리못하는사람의마음의소리로 이동
          </a>
        </div>

      </div>
    </div>
  );
}
