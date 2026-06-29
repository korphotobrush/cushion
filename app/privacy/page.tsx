export default function PrivacyPage() {
  const lastUpdated = "2026년 6월 29일";
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem", lineHeight: 1.8, color: "var(--foreground)" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>개인정보처리방침</h1>
      <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "2rem" }}>최종 업데이트: {lastUpdated}</p>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>1. 수집하는 정보</h2>
        <p>
          본 서비스(cushion-nu.vercel.app)는 회원가입 없이 이용 가능하며,
          별도의 개인정보를 수집하지 않습니다. 다만 서비스 품질 개선을 위해
          아래 정보가 자동으로 수집될 수 있습니다.
        </p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li>접속 IP 주소 (과도한 요청 방지 목적, 서버 로그에 일시 저장)</li>
          <li>브라우저 종류 및 운영체제 정보</li>
          <li>방문 시간 및 페이지 조회 정보 (Vercel Analytics)</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>2. 입력 텍스트의 처리</h2>
        <p>
          사용자가 입력한 텍스트는 AI 변환 처리를 위해 Groq API 서버로 전송됩니다.
          입력 내용은 본 서비스의 데이터베이스에 저장되지 않으며,
          처리 완료 후 즉시 폐기됩니다. Groq의 데이터 처리 정책은
          <a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline", marginLeft: "0.25rem" }}>
            groq.com/privacy-policy
          </a>에서 확인하실 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>3. 광고 서비스</h2>
        <p>
          본 서비스는 Google AdSense를 사용합니다. Google은 쿠키를 사용하여
          사용자의 관심사에 맞는 광고를 표시할 수 있습니다. Google의 광고
          데이터 사용 방식은
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline", marginLeft: "0.25rem" }}>
            policies.google.com/technologies/ads
          </a>에서 확인하실 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>4. 쿠키 사용</h2>
        <p>
          본 서비스는 테마(라이트/다크 모드) 설정 저장을 위해 로컬 스토리지를 사용합니다.
          Google AdSense 광고 표시를 위한 서드파티 쿠키가 사용될 수 있습니다.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>5. 제3자 제공</h2>
        <p>
          수집된 정보는 법령에 의한 경우를 제외하고 제3자에게 제공하지 않습니다.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>6. 문의</h2>
        <p>
          개인정보 처리에 관한 문의는 Instagram{" "}
          <a href="https://www.instagram.com/photobrush_kor/" target="_blank" rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}>
            @photobrush_kor
          </a>으로 연락해주세요.
        </p>
      </section>
    </main>
  );
}
