import "server-only"; // 클라이언트 bundle 침투 시 빌드 에러로 차단
import { z } from "zod";
import { env as clientEnv } from "@/lib/env";

const ServerSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  // secret key 부재 시 admin 클라이언트 생성이 throw. parsing은 통과 (CI test 통과 위해 optional).
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_DEV_REF: z.string().optional(),
  SUPABASE_PROD_REF: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  // CRON_SECRET, RESEND_API_KEY 등은 vercel-cron / email 스킬이 트리거될 때 추가.
});

const serverOnly = ServerSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_DEV_REF: process.env.SUPABASE_DEV_REF,
  SUPABASE_PROD_REF: process.env.SUPABASE_PROD_REF,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  SENTRY_ORG: process.env.SENTRY_ORG,
  SENTRY_PROJECT: process.env.SENTRY_PROJECT,
});

// client 필드도 같이 묶어 server 코드는 이 하나로 모든 env 접근.
export const env = { ...clientEnv, ...serverOnly };
