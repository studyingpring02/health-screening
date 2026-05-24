# 환경 분리 매트릭스 (dev / prod)

이 템플릿은 dev와 prod를 **다른 Supabase 프로젝트**로 완전히 격리한다. Owner가 로컬에서 작업한 결과가 실 서비스에 영향을 주지 않도록.

## 매트릭스

| 자원 | dev | prod | 분리 방식 |
|---|---|---|---|
| Next.js 실행 | `pnpm dev` (localhost:3000) + Vercel preview (feature 브랜치) | Vercel production (main 푸시) | 같은 코드, `VERCEL_ENV`로 분기 |
| Supabase DB | `<repo>-dev` 프로젝트 | `<repo>-prod` 프로젝트 | 별개의 URL/key |
| Supabase Auth | dev project · redirect URLs `localhost:3000`, `*.vercel.app` | prod project · prod 도메인 redirect | 사용자 계정도 별개 |
| Sentry | 1 프로젝트, `environment=development` 태그 | 같은 프로젝트, `environment=production` 태그 | env 태그 + 송출 가드 |
| Sentry 송출 | `enabled: false` (VERCEL_ENV !== "production") | `enabled: true` | 5k/월 한도 보호 — preview에서도 송출 X |
| Vercel Cron | preview/dev에서 실행 X (`VERCEL_ENV === "production"` 가드) | 정상 실행 | 코드 분기 |
| env vars 소스 | `vercel env pull --environment=development` → `.env.local` | Vercel "Production" 슬롯 (자동 주입) | gitignored |
| GitHub Actions CI | PR/main 동일 GH Secrets로 컴파일·테스트만 수행 (실행 X) | 동일 | 빌드는 어느 Supabase URL이든 컴파일만 — runtime 분기는 Vercel env가 담당 |
| Supabase 마이그레이션 | AI 자동: `--project-ref <dev>` | AI가 Owner confirm 받고: `--project-ref <prod>` | Owner 결정점 |
| VERCEL_ENV 값 | `development` (로컬) / `preview` (Vercel preview) | `production` | Vercel 빌드 시 주입 |

## 일상 흐름

```
[Local dev]
$ pnpm dev → localhost:3000
  ↓ uses .env.local (dev 슬롯 값)
  → Supabase DEV   ← 마음껏 깨도 OK
  → Sentry 송출 OFF

[Feature branch]
$ git push origin feature-x
  → GHA CI (typecheck/lint/test/build, dev env)
  → 통과 시 Vercel preview URL 생성
  → Supabase DEV
  → Sentry env=development

[Production]
$ git push origin main
  → GHA CI (prod env)
  → 통과 시 Vercel Deployment Checks 통과
  → Vercel production 자동 promote
  → Supabase PROD  ← 실 사용자
  → Sentry env=production (이벤트 송출)
```

## 코드에서 환경 분기 패턴

```ts
// 서버 코드 — env.server (server-only 가드, VERCEL_ENV 포함)
import { env } from "@/lib/env.server";

if (env.VERCEL_ENV === "production") {
  // 결제 처리, 외부 알림 등
}

// Vercel Cron route handler 가드
export async function GET(req: Request) {
  if (env.VERCEL_ENV !== "production") {
    return Response.json({ skipped: "non-prod" });
  }
  // 실제 cron 로직
}

// 클라이언트 코드 — NEXT_PUBLIC_ 만
import { env } from "@/lib/env";
const url = env.NEXT_PUBLIC_SUPABASE_URL;
```

```ts
// 예외: 빌드 시점 설정 파일 (sentry.{server,edge}.config.ts, instrumentation*.ts, next.config.ts) — env import 전에 실행되므로 process.env 직접 OK
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.VERCEL_ENV === "production",
  environment: process.env.VERCEL_ENV ?? "development",
  tracesSampleRate: 0,
});
```

## 마이그레이션 워크플로 (AI 주도)

1. AI가 `npx supabase migration new <name>` → 파일 생성
2. AI가 SQL 작성 (**RLS 정책 동봉 필수**)
3. AI가 `npx supabase db push --project-ref $SUPABASE_DEV_REF` → dev 적용 (자동)
4. AI가 dev에서 검증 후 Owner에게:
   > "dev 적용·검증 완료. 변경 요약: ___. prod에도 적용할까요?"
5. Owner confirm
6. AI가 `npx supabase db push --project-ref $SUPABASE_PROD_REF` → prod 적용

`$SUPABASE_DEV_REF`, `$SUPABASE_PROD_REF`는 `/go-live`가 `.env.local` + Vercel env에 저장한다.

## 비용·한도

구체 숫자는 [`LIMITS.md`](LIMITS.md) (SSOT). 본 매트릭스의 핵심: **dev/prod 분리에 Supabase 2슬롯 모두 소비**, Vercel 로그 1시간 너머는 Sentry·Supabase `logs`로 메움, Sentry는 prod만 송출해 한도 보호.

## 다루지 않는 것

- **stage 환경**: dev/prod 2환경으로 충분. 더 필요하면 Vercel preview를 stage로 활용.
- **Supabase 로컬 Docker**: 입문자 진입장벽 회피.
- **CD 자동 prod 마이그레이션**: prod 변경은 항상 Owner confirm. CI에서 자동 실행 안 함.
