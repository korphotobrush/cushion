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
const STRENGTH_LABEL = ["", "버릇없게 😤", "약하게", "기본", "정중하게", "극존칭 😰"];

const XL = {
  bg: "#ffffff",
  gridBg: "#f2f2f2",
  headerBg: "#217346",
  headerTxt: "#ffffff",
  rowBg: "#ffffff",
  rowAlt: "#f8f8f8",
  border: "#d0d0d0",
  borderDark: "#a0a0a0",
  cellSelect: "#e8f4e8",
  cellSelectBorder: "#217346",
  txt: "#1a1a1a",
  txt2: "#666666",
  toolbarBg: "#f3f3f3",
  toolbarBorder: "#d0d0d0",
  accent: "#217346",
  accentLight: "#e8f4e8",
  btnBg: "#ffffff",
  btnHover: "#e8e8e8",
  red: "#c00000",
  blue: "#1f5c99",
};

function useTheme() {
  const [dark, setDark] = useState(false);
  const toggle = () => setDark(d => !d);
  return { dark, toggle };
}

export default function Home() {
  const { dark, toggle } = useTheme();
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

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setShowTranslate(false);
    setTranslation(null);
    try {
      const res = await fetch("/api/cushion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, relation: RELATIONS[relation], strength, model }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "오류가 발생했어요.");
      else setResult(data);
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

  const cell = (content: React.ReactNode, w?: string, bg?: string, bold?: boolean, center?: boolean) => (
    <td style={{
      border: `1px solid ${XL.border}`, padding: "4px 8px",
      width: w, background: bg || XL.rowBg,
      fontWeight: bold ? 600 : 400,
      textAlign: center ? "center" : "left",
      fontSize: 13, color: XL.txt, whiteSpace: "nowrap",
    }}>{content}</td>
  );

  const diagColor = (d: string) => {
    if (d === "쿠션어 과다") return XL.red;
    if (d === "쿠션어 부족") return XL.blue;
    return XL.accent;
  };

  return (
    <div style={{ minHeight: "100vh", background: XL.bg, fontFamily: "'Malgun Gothic', '맑은 고딕', sans-serif", fontSize: 13 }}>

      {/* 상단 타이틀 바 */}
      <div style={{ background: XL.headerBg, padding: "6px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: XL.headerTxt, fontSize: 14, fontWeight: 700 }}>📊 개떡같이 말해도 찰떡같이.xlsx</span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>— 저장됨</span>
      </div>

      {/* 툴바 */}
      <div style={{ background: XL.toolbarBg, borderBottom: `1px solid ${XL.toolbarBorder}`, padding: "4px 8px", display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { key: "auto", label: "🤖 자동" },
          { key: "gemini", label: "✦ Gemini" },
          { key: "groq-70b", label: "⚡ 70B" },
          { key: "groq-8b", label: "⚡ 8B" },
        ].map(m => (
          <button key={m.key} onClick={() => setModel(m.key)} style={{
            background: model === m.key ? XL.accentLight : XL.btnBg,
            border: `1px solid ${model === m.key ? XL.accent : XL.borderDark}`,
            padding: "2px 10px", fontSize: 12, cursor: "pointer",
            color: model === m.key ? XL.accent : XL.txt, borderRadius: 2,
            fontWeight: model === m.key ? 600 : 400,
          }}>{m.label}</button>
        ))}
        <div style={{ width: 1, height: 20, background: XL.borderDark, margin: "0 4px" }} />
        <span style={{ fontSize: 11, color: XL.txt2 }}>쿠션어 강도:</span>
        <input type="range" min={1} max={5} step={1} value={strength}
          onChange={e => setStrength(Number(e.target.value))}
          style={{ accentColor: XL.accent, width: 100 }} />
        <span style={{ fontSize: 11, color: XL.accent, fontWeight: 600, minWidth: 80 }}>
          {strength}단계 · {STRENGTH_LABEL[strength]}
        </span>
      </div>

      {/* 수식 입력줄 */}
      <div style={{ background: XL.toolbarBg, borderBottom: `1px solid ${XL.toolbarBorder}`, padding: "3px 8px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: XL.txt2, minWidth: 40 }}>A1</span>
        <div style={{ width: 1, height: 16, background: XL.borderDark }} />
        <span style={{ fontSize: 12, color: XL.txt2 }}>fx</span>
        <span style={{ fontSize: 12, color: XL.txt }}>= CUSHION(원문, 상대방, 강도)</span>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 95px)" }}>

        {/* 행 번호 */}
        <div style={{ minWidth: 40, background: XL.gridBg, borderRight: `1px solid ${XL.border}` }}>
          {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => (
            <div key={n} style={{ height: 24, borderBottom: `1px solid ${XL.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: XL.txt2 }}>{n}</div>
          ))}
        </div>

        {/* 메인 그리드 */}
        <div style={{ flex: 1, overflow: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: XL.gridBg, height: 24 }}>
                {["A (상대방)", "B (원문 메시지)", "C (결과)", "D (진단)", "E (비고)"].map((h, i) => (
                  <th key={i} style={{
                    border: `1px solid ${XL.border}`, padding: "3px 8px",
                    fontSize: 11, color: XL.txt2, fontWeight: 600, textAlign: "center",
                    background: XL.gridBg, width: i === 1 || i === 2 ? "28%" : i === 0 ? "14%" : "15%"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 행 1: 상대방 선택 */}
              <tr style={{ height: 24 }}>
                {cell(<span style={{ color: XL.txt2, fontSize: 11 }}>상대방 선택 ▼</span>, "14%", XL.accentLight, true)}
                <td colSpan={4} style={{ border: `1px solid ${XL.border}`, padding: "2px 8px", background: XL.rowBg }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {RELATIONS.map((r, i) => (
                      <button key={r} onClick={() => setRelation(i)} style={{
                        background: relation === i ? XL.accent : XL.btnBg,
                        border: `1px solid ${relation === i ? XL.accent : XL.borderDark}`,
                        color: relation === i ? "#fff" : XL.txt,
                        padding: "1px 10px", fontSize: 11, cursor: "pointer", borderRadius: 2,
                        fontWeight: relation === i ? 600 : 400,
                      }}>{r}</button>
                    ))}
                  </div>
                </td>
              </tr>

              {/* 행 2: 서브텍스트 */}
              <tr style={{ height: 18 }}>
                {cell("", "14%", XL.rowAlt)}
                <td colSpan={4} style={{ border: `1px solid ${XL.border}`, padding: "1px 8px", background: XL.rowAlt }}>
                  <span style={{ fontSize: 11, color: XL.txt2 }}>{RELATION_DESC[relation]}</span>
                </td>
              </tr>

              {/* 빈 행 */}
              <tr style={{ height: 18 }}>
                {cell("", "14%", XL.rowBg)}
                <td colSpan={4} style={{ border: `1px solid ${XL.border}`, background: XL.rowBg }} />
              </tr>

              {/* 행 4: 원문 입력 */}
              <tr style={{ height: 100 }}>
                {cell("원문 입력", "14%", XL.accentLight, true, true)}
                <td colSpan={4} style={{ border: `2px solid ${XL.cellSelectBorder}`, padding: 4, background: XL.cellSelect }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value.slice(0, 500))}
                    placeholder="평소 말투로 그냥 써주세요..."
                    style={{
                      width: "100%", height: 80, border: "none", outline: "none",
                      background: "transparent", fontSize: 13, fontFamily: "inherit",
                      resize: "none", color: XL.txt,
                    }}
                  />
                  <div style={{ textAlign: "right", fontSize: 10, color: input.length > 450 ? XL.red : XL.txt2 }}>
                    {input.length}/500
                  </div>
                </td>
              </tr>

              {/* 빈 행 */}
              <tr style={{ height: 18 }}>
                {cell("", "14%", XL.rowBg)}
                <td colSpan={4} style={{ border: `1px solid ${XL.border}`, background: XL.rowBg }} />
              </tr>

              {/* 행 6: 실행 버튼 */}
              <tr style={{ height: 28 }}>
                {cell("함수 실행", "14%", XL.gridBg, true, true)}
                <td colSpan={4} style={{ border: `1px solid ${XL.border}`, padding: "3px 8px", background: XL.rowBg }}>
                  <button onClick={analyze} disabled={loading || !input.trim()} style={{
                    background: loading || !input.trim() ? XL.gridBg : XL.accent,
                    color: loading || !input.trim() ? XL.txt2 : "#fff",
                    border: `1px solid ${loading || !input.trim() ? XL.borderDark : XL.accent}`,
                    padding: "3px 20px", fontSize: 12, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    fontWeight: 600, borderRadius: 2,
                  }}>
                    {loading ? "⏳ 처리 중..." : "▶ 실행 (F9)"}
                  </button>
                </td>
              </tr>

              {/* 빈 행 */}
              <tr style={{ height: 18 }}>
                {cell("", "14%", XL.rowBg)}
                <td colSpan={4} style={{ border: `1px solid ${XL.border}`, background: XL.rowBg }} />
              </tr>

              {/* 결과 영역 */}
              {error && (
                <tr style={{ height: 60 }}>
                  {cell("#ERROR!", "14%", "#ffe8e8", true, true)}
                  <td colSpan={4} style={{ border: `1px solid ${XL.red}`, padding: "8px", background: "#fff8f8", color: XL.red, fontSize: 12, whiteSpace: "pre-line" }}>
                    {error}
                  </td>
                </tr>
              )}

              {result && !error && (
                <>
                  <tr style={{ height: 18, background: XL.gridBg }}>
                    {["결과", "원문", "조정 결과", "진단", "처리 모델"].map((h, i) => (
                      <th key={i} style={{ border: `1px solid ${XL.border}`, padding: "2px 8px", fontSize: 11, color: XL.txt2, fontWeight: 600, background: XL.gridBg, textAlign: "center" }}>{h}</th>
                    ))}
                  </tr>

                  <tr style={{ height: 80 }}>
                    {cell("출력값", "14%", XL.accentLight, true, true)}
                    <td style={{ border: `1px solid ${XL.border}`, padding: "6px 8px", background: XL.rowBg, fontSize: 12, color: XL.txt, verticalAlign: "top" }}>
                      {input}
                    </td>
                    <td style={{ border: `2px solid ${XL.cellSelectBorder}`, padding: "6px 8px", background: XL.cellSelect, fontSize: 12, color: XL.txt, verticalAlign: "top" }}>
                      {result.result.length > 2000 ? result.result.slice(0, 2000) + "…" : result.result}
                    </td>
                    <td style={{ border: `1px solid ${XL.border}`, padding: "6px 8px", background: XL.rowBg, verticalAlign: "top" }}>
                      <span style={{ color: diagColor(result.diagnosis), fontWeight: 600, fontSize: 11 }}>
                        {result.diagnosis === "쿠션어 과다" ? "▲ 과다" : result.diagnosis === "쿠션어 부족" ? "▼ 부족" : "● 적절"}
                      </span>
                      <br />
                      <span style={{ fontSize: 10, color: XL.txt2 }}>{result.reason}</span>
                    </td>
                    <td style={{ border: `1px solid ${XL.border}`, padding: "6px 8px", background: XL.rowBg, fontSize: 11, color: XL.txt2, verticalAlign: "top" }}>
                      {result.provider}
                    </td>
                  </tr>

                  {/* 변경사항 */}
                  {result.changes?.map((c: string, i: number) => (
                    <tr key={i} style={{ height: 20 }}>
                      {cell(i === 0 ? "변경사항" : "", "14%", XL.rowAlt, i === 0, true)}
                      <td colSpan={3} style={{ border: `1px solid ${XL.border}`, padding: "2px 8px", fontSize: 11, color: XL.txt2, background: XL.rowAlt }}>
                        · {c}
                      </td>
                      <td style={{ border: `1px solid ${XL.border}`, background: XL.rowAlt }}>
                        {i === 0 && (
                          <button onClick={() => { navigator.clipboard.writeText(result.result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{
                            background: XL.btnBg, border: `1px solid ${XL.borderDark}`,
                            padding: "1px 8px", fontSize: 10, cursor: "pointer", color: copied ? XL.accent : XL.txt,
                          }}>{copied ? "✓ 복사됨" : "📋 복사"}</button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* 번역 */}
                  <tr style={{ height: 18 }}>
                    {cell("", "14%", XL.rowBg)}
                    <td colSpan={4} style={{ border: `1px solid ${XL.border}`, background: XL.rowBg }} />
                  </tr>
                  <tr style={{ height: 28 }}>
                    {cell("번역", "14%", XL.gridBg, true, true)}
                    <td colSpan={4} style={{ border: `1px solid ${XL.border}`, padding: "3px 8px", background: XL.rowBg }}>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <button onClick={() => { setShowTranslate(!showTranslate); setTranslation(null); setSelectedLang(""); }} style={{
                          background: showTranslate ? XL.accent : XL.btnBg,
                          border: `1px solid ${showTranslate ? XL.accent : XL.borderDark}`,
                          color: showTranslate ? "#fff" : XL.txt,
                          padding: "2px 10px", fontSize: 11, cursor: "pointer", borderRadius: 2,
                        }}>🌐 외국어 번역</button>
                        {showTranslate && LANGUAGES.map(l => (
                          <button key={l} onClick={() => { setSelectedLang(l); setTranslation(null); }} style={{
                            background: selectedLang === l ? XL.accentLight : XL.btnBg,
                            border: `1px solid ${selectedLang === l ? XL.accent : XL.borderDark}`,
                            color: selectedLang === l ? XL.accent : XL.txt,
                            padding: "2px 8px", fontSize: 11, cursor: "pointer", borderRadius: 2,
                          }}>{l}</button>
                        ))}
                        {showTranslate && selectedLang === "기타" && (
                          <input value={customLang} onChange={e => setCustomLang(e.target.value)}
                            placeholder="언어 입력" style={{ border: `1px solid ${XL.borderDark}`, padding: "2px 6px", fontSize: 11, width: 80 }} />
                        )}
                        {showTranslate && selectedLang && (
                          <button onClick={translate} disabled={translating} style={{
                            background: XL.accent, color: "#fff", border: "none",
                            padding: "2px 10px", fontSize: 11, cursor: "pointer", borderRadius: 2,
                          }}>{translating ? "번역 중..." : "▶ 번역"}</button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {translation && (
                    <>
                      <tr style={{ height: 60 }}>
                        {cell("번역 결과", "14%", XL.accentLight, true, true)}
                        <td style={{ border: `1px solid ${XL.border}`, padding: "6px 8px", background: XL.rowBg, fontSize: 12, color: XL.txt2 }}>
                          {selectedLang === "기타" ? customLang : selectedLang}
                        </td>
                        <td colSpan={2} style={{ border: `2px solid ${XL.cellSelectBorder}`, padding: "6px 8px", background: XL.cellSelect, fontSize: 12, color: XL.txt }}>
                          {translation.result}
                        </td>
                        <td style={{ border: `1px solid ${XL.border}`, padding: "4px", background: XL.rowBg, textAlign: "center" }}>
                          <button onClick={() => { navigator.clipboard.writeText(translation.result); setCopiedTrans(true); setTimeout(() => setCopiedTrans(false), 2000); }} style={{
                            background: XL.btnBg, border: `1px solid ${XL.borderDark}`,
                            padding: "1px 8px", fontSize: 10, cursor: "pointer", color: copiedTrans ? XL.accent : XL.txt,
                          }}>{copiedTrans ? "✓ 복사됨" : "📋 복사"}</button>
                        </td>
                      </tr>
                      <tr style={{ height: 40 }}>
                        {cell("문화 참고", "14%", XL.gridBg, true, true)}
                        <td colSpan={4} style={{ border: `1px solid ${XL.border}`, padding: "6px 8px", background: "#fffbe6", fontSize: 11, color: XL.txt2, fontStyle: "italic" }}>
                          💬 {LANG_CULTURE[selectedLang] || LANG_CULTURE["기타"]}
                        </td>
                      </tr>
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>

          {/* 하단 광고 */}
          <div style={{ margin: "16px", border: `1px dashed ${XL.borderDark}`, height: 90, background: XL.rowAlt }} />

          {/* 인스타 */}
          <div style={{ textAlign: "center", padding: "8px", fontSize: 11, color: XL.txt2 }}>
            <a href="https://instagram.com/photobrush_kor" target="_blank" rel="noopener noreferrer" style={{ color: XL.txt2, textDecoration: "none" }}>
              @photobrush_kor
            </a>
          </div>
        </div>
      </div>

      {/* 하단 시트 탭 */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: XL.toolbarBg, borderTop: `1px solid ${XL.toolbarBorder}`, display: "flex", alignItems: "center", padding: "2px 8px", gap: 2 }}>
        <div style={{ background: XL.accent, color: "#fff", padding: "3px 16px", fontSize: 11, fontWeight: 600, borderRadius: "2px 2px 0 0" }}>
          쿠션어변환
        </div>
        <div style={{ background: XL.btnBg, border: `1px solid ${XL.borderDark}`, color: XL.txt2, padding: "3px 16px", fontSize: 11, borderRadius: "2px 2px 0 0" }}>
          사용법
        </div>
        <span style={{ marginLeft: "auto", fontSize: 10, color: XL.txt2 }}>준비</span>
      </div>
    </div>
  );
}