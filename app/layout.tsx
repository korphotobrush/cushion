import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "쿠션어 번역기 — 개떡같이 말해도 찰떡같이",
  description: "직장 상사, 동료, 클라이언트에게 보내는 메시지를 쿠션어로 자동 변환해드려요. 쿠션어 번역기, 직장인 필수 앱.",
  keywords: "쿠션어, 쿠션어 번역기, 직장인, 상사 메시지, 공손한 말투, 말투 변환",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5549051245996079"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}