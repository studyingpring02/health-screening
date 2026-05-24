---
name: go-live
description: Provision GitHub private repo, Vercel project, Supabase dev/prod, Sentry. Wire env across 3 environments + GitHub Secrets. First deploy and security audit. Use when user runs /go-live after /warmup.
---

# /go-live

dev/prod 클라우드 환경을 뚫어 첫 배포를 진행한다.
최신 외부 서비스 문서를 먼저 탐색하여 올바른 흐름을 이해한다.

## 1. 이름·GitHub repo

이름 결정 — 이후 모든 리소스가 이 이름 기반. private repo 생성. (secret scanning push protection은 private free 미지원 — GitHub Advanced Security 유료 gate. 9-6에서 점검만 skip.)

## 2. Supabase dev + prod

`<name>-dev` + `<name>-prod` 생성. Region·DB password는 Owner와 협의. ref·url·publishable·secret을 Management API로 추출하되, **응답 필드명이 버전마다 달라질 수 있으니 jq로 탐색해 적응한다**.

dev Auth redirect URL은 즉시 설정(`localhost:3000/**` + `https://*.vercel.app/**`). **prod redirect는 7-1로 미룬다** — 실 prod 도메인이 `<name>.vercel.app`이 아닐 수 있다.

## 3. Vercel link + env 주입

`vercel link`. production = prod Supabase + `SUPABASE_PROD_REF`, preview·development = dev + `SUPABASE_DEV_REF`. 끝나면 `vercel env pull`로 `.env.local` 동기화.

## 4. Sentry org·project + env 4종

config 파일은 템플릿에 이미 있다 — env만 채우면 끝(wizard 불요). `sentry-cli`로 org·project 조회/생성. **auth token은 sentry-cli로 발급 불가** — Owner가 대시보드(Settings → Auth Tokens)에서 발급해 전달.

env 4종(`NEXT_PUBLIC_SENTRY_DSN`·`SENTRY_ORG`·`SENTRY_PROJECT`·`SENTRY_AUTH_TOKEN`)을 Vercel 3환경 + GitHub Secrets 모두에 주입한 뒤 `vercel env pull`로 로컬 동기화.

## 5. `logs` 테이블 마이그레이션

감사 로그용. `service_role`만 insert 정책 + RLS 동봉. dev 자동 → **Owner confirm → prod 적용**.

## 6. GitHub Secrets

CI 빌드용. `.env.local`에서 읽어 `gh secret set`. **publishable + URL + Sentry 4종만** — secret key·DB ref는 CI 컴파일에 불필요(보안 표면 최소화).

## 7. 첫 푸시·배포

main에 push → CI + Vercel 배포 동시 트리거.

## 7-1. prod Auth redirect URL 갱신

배포 후 실 production 도메인을 Vercel CLI/API로 확인하고, prod Supabase `site_url`·`uri_allow_list`를 갱신한다.

## 8. Owner 직접 (Hobby 한도)

- **CI Required check**: Vercel Deployment Checks API는 Pro 전용 → Hobby에선 GitHub repo Settings → Branches → branch protection rule에 CI workflow를 Required status check로 지정 (CI 통과 전 main merge 차단).
- **Preview Deployment Protection**: Vercel 대시보드에서 Preview에 Vercel Authentication ON → preview URL 크롤러 차단. (Hobby Standard 가능, external user 1명 제한.)

## 9. 보안 진단

| # | 검사 | 실패 시 |
|---|---|---|
| 1 | `.env*` gitignored | `.gitignore` 패치 |
| 2 | secret key가 `app/`·`components/`에 노출 (grep) | **critical** |
| 3 | `NEXT_PUBLIC_` 접두사가 secret·service·token에 | **critical** |
| 4 | repo visibility = PRIVATE | confirm 후 전환 |
| 5 | 8단계 대시보드 설정 완료 | Owner에 확인 |
| 6 | secret scanning push protection 활성 | private+free는 미지원(GitHub Advanced Security 유료) — 점검 자체 skip |

## confirm 경계

prod `db push` (5) · public→private 전환 (9-4) — Owner confirm. 그 외 자동.
