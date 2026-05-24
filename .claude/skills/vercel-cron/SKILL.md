---
name: vercel-cron
description: Rules for adding Vercel Cron jobs in this template. Use when adding scheduled tasks or periodic jobs.
---

# vercel-cron

Vercel Cron 추가 시 분기·로그·테스트 함정들.

Hobby 한도와 부딪힐 주기·부하면 Owner에 먼저 알린다.

- **prod에서만 실행** — `env.VERCEL_ENV !== "production"`이면 no-op. preview에서 dev DB·외부 API 낭비 차단.
- **성공·실패 모두 logger로 기록** — 성공 `audit`, 실패 `error`. Sentry·logs 송출은 자동.
- **테스트 함정**: `env`는 모듈 로드 시 1회만 parse → `vi.stubEnv` 무효. `vi.mock("@/lib/env.server")`로 통째 교체.

그 외(헤더 검증·idempotent·`CRON_SECRET`·`vercel.json`·`env.server.ts` 등)는 Vercel docs와 코드 주석을 따른다.
