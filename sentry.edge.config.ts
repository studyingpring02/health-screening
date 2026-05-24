import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.VERCEL_ENV === "production",
  environment: process.env.VERCEL_ENV ?? "development",
  tracesSampleRate: 0,
});
