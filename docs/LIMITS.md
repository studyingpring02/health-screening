# 무료 티어 한도 SSOT

> 변동되는 숫자만 이 파일에 모은다. 스킬·문서는 이 파일을 가리키도록.
> 갱신 주기: 분기 1회 또는 Owner 보고 시.
> **공식 docs를 항상 우선** — 본 파일과 차이 나면 docs 따른다.

> 최근 갱신 일시: 2026-05-23

## Supabase Free

- **활성 프로젝트 수**: 2 / organization
- **DB 크기**: 500MB / project
- **inactivity auto-pause**: 7일
- 출처: <https://supabase.com/pricing>

## Vercel Hobby

- **빌드 분**: ~6,000 / 월
- **함수 호출**: ~1,000,000 / 월
- **함수 최대 실행 시간**: 10초 (기본), 60초까지 확장 가능
- **로그 보존**: 1시간
- **Cron**: 개수·주기 제한 (현재는 매우 적음, 최소 1일 1회)
- **Deployment Checks (Wait for Checks)**: Hobby에서 사용 가능
- **Log Drains**: Pro 전용
- 출처: <https://vercel.com/docs/plans/hobby>

## Sentry Developer (Free)

- **에러 이벤트**: ~5,000 / 월
- **보존**: 30일
- **organization·user**: 1
- 출처: <https://sentry.io/pricing/>

## GitHub Free

- **private repo**: 무제한
- **GitHub Actions 분**: ~2,000 / 월 (private repo)
- **secret scanning push protection**: public repo만 free. private repo는 GitHub Advanced Security (유료).
- 출처: <https://github.com/pricing>

## Resend (참고용, 본 템플릿엔 미포함)

- **이메일 발송**: ~3,000 / 월
- 출처: <https://resend.com/pricing>

## 한도 초과 시 대응

| 자원 | 초과 시 |
|---|---|
| Supabase | 프로젝트 비활성화 → Pro $25/mo로 업그레이드 또는 데이터 정리 |
| Vercel | 함수·빌드 정지 → 다음 사이클 대기 또는 Pro $20/mo |
| Sentry | 새 이벤트 drop → 사이클 대기 또는 Team $26/mo |
| GitHub Actions | 차단 → 다음 사이클 대기 또는 분 구입 |
