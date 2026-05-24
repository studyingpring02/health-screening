# solo-saas-starter

무료티어 기반 웹 SaaS 스타터. **Owner는 의사결정·confirm, 실행은 AI.**

## Owner: v1 배포 시나리오

1. `/warmup` — 외부 CLI 로그인 검증 + 의존성 install·audit
2. `/go-live` — 클라우드 리소스(GitHub·Vercel·Supabase dev/prod·Sentry) 생성 + 첫 배포 + 보안 진단
3. `/probe <아이디어>` — 적응형 인터뷰로 요구사항 도출
4. `/sketch` — shadcn + 레포 디자인 컨벤션 기반 시안
5. TDD 개발 — AI가 Vitest 테스트→구현→커밋 반복
6. `git push` — CI 통과 시 Vercel 자동 배포

> `node_modules/` 부재 → `/warmup` 실행. `.vercel/` 부재 → `/go-live` 실행.

## AI를 위한 도구 (CLI as eyes & hands)

| CLI                                 | 주요 작업                                       | 가역성 클래스                                      |
| ----------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `gh`                                | repo·visibility·secrets·secret scanning·PR·이슈 | 대부분 **자동**, repo 삭제·public 전환은 **확인**  |
| `vercel`                            | env vars·project link·deploy·logs·domains       | **자동**, prod env 삭제·도메인 변경은 **확인**     |
| `npx supabase`                      | projects·migration·db push·gen types·link       | dev **자동**, prod `db push`·`db reset`은 **확인** |
| `sentry-cli`                        | organization·project 조회/생성, sourcemap·release | **자동**           |
| `pnpm`                              | install·add·remove·audit·dlx                    | **자동**, major 업그레이드는 **확인**              |
| `curl + Supabase Management API`    | Auth redirect URL 등 CLI 미커버 항목            | **자동** (PAT은 `/warmup`이 검증)                  |
| `git`                               | 표준                                            | **자동**, force push·hard reset은 **확인**         |

**비가역·고위험 (반드시 Owner confirm)**: prod DB 마이그레이션, prod env 삭제, repo public 전환, `db reset` on prod, force push to main.

**Owner 직접 (CLI 미지원, AI는 안내만)**: 카드 결제, 도메인 DNS 변경, Supabase Personal Access Token 발급, **Sentry Auth Token 발급(대시보드 Settings → Auth Tokens)**.

## 핵심 코드 규칙

- **TDD 우선**: 새 기능은 Vitest 테스트 작성→통과→커밋. 테스트는 `tests/`에 누적.
- **로그 (서버)**: `lib/logger.ts` 사용. 에러는 Sentry, 감사는 Supabase `logs` 테이블로 자동 전송.
- **로그 (클라이언트)**: 에러 → `Sentry.captureException()` (browser SDK 자동). 영속 이벤트 → server action 거쳐 `lib/logger.ts`. 일시 디버그 → `console.log`. `lib/logger.ts` 직접 import 금지 (server-only).
- **env**: 클라이언트·일반 코드는 `import { env } from "@/lib/env"` (NEXT_PUBLIC_ 만). 서버 전용 키(SUPABASE_SECRET_KEY 등) 접근은 `import { env } from "@/lib/env.server"` (server-only 가드). `process.env.X` 직접 접근은 빌드 시점 설정 파일(`next.config.*`, `sentry.{server,edge}.config.ts`, `instrumentation.ts`, `instrumentation-client.ts`, `vercel.json`)에서만 예외 허용.
- **RLS 필수**: 새 Supabase 테이블은 반드시 RLS 정책 동봉 (같은 마이그레이션 파일 안). 미동봉 마이그레이션 거부.
- **secret key**: `lib/supabase/admin.ts`에서만 사용 (`server-only`로 가드). `NEXT_PUBLIC_*` 접두사 절대 금지. **auth 흐름에서 `admin.ts` import 금지** — RLS·세션 우회 위험.
- **Supabase Auth**: `@supabase/ssr` 사용. `@supabase/auth-helpers-nextjs` (deprecated) 금지.
- **환경 분기**: 서버 코드는 `import { env } from "@/lib/env.server"` 후 `env.VERCEL_ENV` 비교 (값: `"production" | "preview" | "development" | undefined`).
- **의존성 정책**: caret range + `pnpm-lock.yaml` 커밋 + CI `--frozen-lockfile`. `.npmrc`의 `minimum-release-age=14d`로 신선한 npm 패키지는 cooldown 후에만 install. 의존성 변경 후 lockfile 같은 커밋에 포함.

## 폴더 구조 (FSD-light)

```
app/                       # Next.js 라우트만 (page·layout·route handler)
  ├── sketch/<feature>/    # /sketch 임시 variants — 채택 안만 남기고 정리
  ├── api/cron/<job>/      # cron route handler
  └── <route>/_components/ # 라우트 전용 UI (underscore = private)
features/<feature>/        # 도메인 모듈 (자기완결)
  ├── components/          # 이 기능 전용 UI
  ├── actions.ts           # server actions
  ├── queries.ts           # 데이터 쿼리
  ├── schema.ts            # zod (form·boundary 검증) — DB schema와 정합 유지
  └── index.ts             # public API — 외부 import는 여기만
supabase/migrations/       # ⭐ DB schema SSOT (.sql, RLS 포함)
components/ui/             # shadcn primitives (글로벌 재사용)
lib/                       # cross-cutting 인프라
  ├── supabase/{server,client,admin}.ts
  ├── supabase/types.ts    # DB→TS 자동 생성 (gen types, read-only)
  ├── env.ts               # 클라이언트·일반 코드용 (NEXT_PUBLIC_ 만)
  ├── env.server.ts        # server-only (SUPABASE_SECRET_KEY 등 포함)
  ├── logger.ts utils.ts
sentry.{server,edge}.config.ts  # server/edge SDK init (instrumentation.ts가 register)
instrumentation.ts         # server/edge Sentry register + onRequestError
instrumentation-client.ts  # browser SDK init (Next 자동 picked up)
tests/<feature>/           # Vitest 회귀 (feature 미러)
docs/{ENVIRONMENTS,LIMITS}.md  # SSOT
```

## 폴더 규칙

- **app/은 얇음**: 비즈니스 로직 X. features/ 조합만.
- **의존 단방향**: `app → features → lib`. feature 간은 다른 feature의 `index.ts`만 import (내부 직접 X = 캡슐화). 양방향 의존 발견 시 → 새 feature로 합쳐라.
- **복합 use case = 새 feature**: cart+payment+user 조합하는 checkout은 `features/checkout/`.
- **복합 UI** (Header, Shell — 여러 페이지 공유): `features/layout/components/`.
- **여러 feature 공유 schema** (Money, Address): 임시 `lib/schemas/`. 반복 패턴 명백 시 → `entities/<entity>/` 정식 도입.
- **큰 복합 UI 누적** 시 → `widgets/<widget>/` 정식 도입.
- **schema 3층**: DB(`supabase/migrations/*.sql`) → TS 타입(`lib/supabase/types.ts`, 자동) → zod(`features/<feature>/schema.ts`, form·외부 경계). DB가 SSOT, 변경 시 나머지 두 층 동기화.

## 환경 분리

dev/prod 매트릭스: [`docs/ENVIRONMENTS.md`](docs/ENVIRONMENTS.md).

요약:

- **dev**: `<repo>-dev` Supabase + Sentry `env=development` (송출 OFF) + Vercel preview·localhost
- **prod**: `<repo>-prod` Supabase + Sentry `env=production` + Vercel production

코드 분기 시 서버는 `env.VERCEL_ENV` (`@/lib/env.server`) 사용. 예외: `sentry.{server,edge}.config.ts`·`instrumentation.ts`·`instrumentation-client.ts`·`next.config.ts`는 빌드 시점이라 `process.env` 직접.
