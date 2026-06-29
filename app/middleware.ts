import { NextRequest, NextResponse } from "next/server";

// In-memory store (Vercel Serverless: 함수 인스턴스별로 독립적이나 실용적으로 충분)
// 더 엄격하게 하려면 Vercel KV로 교체
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 10;        // 분당 최대 요청 수
const WINDOW_MS = 60_000; // 1분

function getRateLimitHeaders(remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Limit": String(LIMIT),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}

export function middleware(req: NextRequest) {
  // API 경로만 rate limit 적용
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // 새 윈도우 시작
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  entry.count += 1;

  if (entry.count > LIMIT) {
    return NextResponse.json(
      { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요. 🙏" },
      {
        status: 429,
        headers: getRateLimitHeaders(0, entry.resetAt),
      }
    );
  }

  const res = NextResponse.next();
  const headers = getRateLimitHeaders(LIMIT - entry.count, entry.resetAt);
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
