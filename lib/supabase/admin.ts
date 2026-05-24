import "server-only"; // 클라이언트 import 차단
// secret 키 사용. RLS 우회. 서버 전용.
// 일반 사용자 데이터 접근은 server.ts(publishable + 세션) 사용.
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env.server";

export function createSupabaseAdmin() {
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY missing — admin client unavailable");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
