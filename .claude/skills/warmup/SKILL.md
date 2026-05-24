---
name: warmup
description: Verify the AI agent's tools and environment (CLI installs, logins) and install/audit dependencies, fixing issues where possible. Use when the Owner runs /warmup, just cloned the template, or before tasks that depend on external CLIs working.
---

# /warmup

AI(CLI agent)가 이 프로젝트에서 작업할 준비가 됐는지 점검한다.
AI의 손·발(도구·자격·환경)과 프로젝트의 실행 환경을 정상화한다.

스스로 바로잡을 수 있는 것은 자율로 설정한다.
Owner의 행동이 필요한 부분은 AskUserQuestion으로 해결한다.

## CLI

- `node` — 현 LTS
- `pnpm` — latest
- `git`
- `gh` — 로그인
- `vercel` — 로그인
- `npx supabase` — 로그인
- `sentry-cli` — 로그인

## 의존성

- `pnpm install`로 설치
- `pnpm audit`으로 점검

세부 정책은 `.npmrc`와 CI 설정을 따른다.