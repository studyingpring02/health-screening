import "server-only"; // 클라이언트 컴포넌트 import 시 빌드 에러로 잡힘
import * as Sentry from "@sentry/nextjs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env.server";

type Level = "info" | "warn" | "error" | "audit";

async function write(level: Level, message: string, context?: Record<string, unknown>) {
  const entry = { level, message, context, ts: new Date().toISOString() };
  if (level === "error") console.error(entry); else console.log(entry);

  if (level === "error") {
    Sentry.captureException(new Error(message), { extra: context });
  }

  // RLS 정책이 service_role만 insert 허용하므로 admin 클라이언트.
  if (env.SUPABASE_SECRET_KEY) {
    try {
      const admin = createSupabaseAdmin();
      await admin.from("logs").insert({ level, message, context });
    } catch {
      /* logs 테이블 미존재·연결 실패는 무시 */
    }
  }
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => write("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => write("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => write("error", msg, ctx),
  audit: (msg: string, ctx?: Record<string, unknown>) => write("audit", msg, ctx),
};
