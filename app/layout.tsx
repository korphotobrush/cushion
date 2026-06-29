import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "쿠션어 번역기 — 개떡같이 말해도 찰떡같이",
  description: "직장 상사, 동료, 클라이언트에게 보내는 메시지를 쿠션어로 자동 변환해드려요. 쿠션어 번역기, 직장인 필수 앱.",
  keywords: "쿠션어, 쿠션어 번역기, 직장인, 상사 메시지, 공손한 말투, 말투 변환",
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: "쿠션어 번역기 — 개떡같이 말해도 찰떡같이",
    description: "직장 상사, 동료, 클라이언트에게 보내는 메시지를 쿠션어로 자동 변환해드려요.",
    url: "https://cushion-nu.vercel.app",
    siteName: "쿠션어 번역기",
    locale: "ko_KR",
    type: "website",
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="naver-site-verification" content="a9ad2311e84f4aa6b69655799bac5422d55f4174" /> 
        <meta name="google-site-verification" content="h5iXLENwifm0LeGa8DqNpKmW6Y0y81brKpxfxplEjpE" />

        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5549051245996079"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Analytics />
        <script
          async
          type="text/javascript"
          src="https://t1.kakaocdn.net/kas/static/ba.min.js"
        />
      </body>
      </html>
  );
}
