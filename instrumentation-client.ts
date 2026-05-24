// Browser SDK 초기화. Next가 client bundle에 자동 포함.
// process.env 직접 사용: 빌드 시점에 lib/env가 아직 로드되지 않음.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // VERCEL_ENV === "production"에서만 송출.
  // NODE_ENV 가드는 Vercel preview에서도 "production"이라 5k 한도 빠르게 소진됨.
  enabled: process.env.VERCEL_ENV === "production",
  environment: process.env.VERCEL_ENV ?? "development",
  tracesSampleRate: 0,
});
