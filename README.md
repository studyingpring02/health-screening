# solo-saas-starter

> 무료티어 기반으로 진짜 운영되는 웹 SaaS를 만드는 스타터 템플릿.
> **Owner는 의사결정만, AI가 CLI·코드 작업 전부.**

## 스택

Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Supabase · Vercel · Sentry · Vitest. 모두 무료 티어 안.

## 빠른 시작

이 디렉토리에서 Claude Code를 열고 차례로 슬래시 명령 입력:

| 단계         | 명령                | AI가 하는 일                                                                 | Owner가 하는 일           |
| ------------ | ------------------- | ---------------------------------------------------------------------------- | ------------------------- |
| 1. 환경 점검 | `/warmup`           | 외부 CLI·로그인 검증, 의존성 install·audit                                   | 부족한 로그인 안내 따르기 |
| 2. 첫 배포   | `/go-live`          | gh repo·Vercel·Supabase dev/prod·Sentry 프로비저닝, env 동기화, 첫 배포, 보안 진단 | 비가역 작업 confirm       |
| 3. 기획      | `/probe <아이디어>` | 회색지대·자유티어 한도 인터뷰 → 요구사항 문서화                              | 질문에 답변               |
| 4. 디자인    | `/sketch`           | shadcn + 레포지토리 디자인 컨벤션 기반 UI                                    | 원하면 DESIGN.md 추가     |
| 5. 개발      | "X 기능 만들어줘"   | TDD로 개발, Vitest 통과까지 반복                                             | 요구사항 명시·검토        |
| 6. 푸시      | `git push`          | (자동) CI → Vercel 자동 배포                                                 | URL 확인                  |

## 사전 준비물

`/warmup`이 친절히 안내하지만, 미리 가입·설치하면 빠릅니다:

- [Node.js](https://nodejs.org/) 현재 LTS
- [pnpm](https://pnpm.io/) 최신
- [GitHub](https://github.com) 계정 + `gh auth login`
- [Vercel](https://vercel.com) 계정 + `vercel login` (GitHub OAuth 권장)
- [Supabase](https://supabase.com) 계정 + `npx supabase login` + [Personal Access Token](https://supabase.com/dashboard/account/tokens) 발급
- [Sentry](https://sentry.io) 계정 + `sentry-cli login`

## 의존성 정책

- 버전: caret range (`^x.y.z`) — 보안 패치 자동, 메이저 고정
- 결정성: `pnpm-lock.yaml` 커밋 + CI `--frozen-lockfile`
- supply-chain 갭: `.npmrc`의 `minimum-release-age=14d` — 신선한 위험 차단
- 알려진 CVE: CI에서 `pnpm audit --prod --audit-level=high` 자동 검사

## 환경 분리

이 템플릿은 **dev/prod 2개의 Supabase 프로젝트**를 사용합니다 → Supabase 무료 슬롯 2개 모두 소비.
자세히 [`docs/ENVIRONMENTS.md`](docs/ENVIRONMENTS.md), 한도는 [`docs/LIMITS.md`](docs/LIMITS.md).

요약:

- 로컬 `pnpm dev` + Vercel preview → **dev DB**
- Vercel production (`main` 브랜치) → **prod DB**

> **Vercel preview**: main이 아닌 브랜치를 push할 때마다 Vercel이 자동 생성하는 임시 URL (예: `<repo>-git-<branch>-<owner>.vercel.app`). 머지 전 실 환경에서 동작 확인용. dev Supabase에 붙어 prod 데이터 영향 X.

## 라이선스

강의 수강생 전용. 본인 프로젝트엔 자유 사용, 제3자 재배포·재판매·강의화 금지. 자세히 [LICENSE](LICENSE).
