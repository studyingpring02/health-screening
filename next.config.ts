import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry env가 없으면 sourcemap upload만 스킵, 빌드는 통과.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Vercel Cron 추가 시 Sentry Cron Monitor 자동 등록 → 실패 알람 자동화.
  automaticVercelMonitors: true,
});
