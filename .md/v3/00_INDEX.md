# MarketingFlow v3 문서 인덱스

| # | 파일명 | 내용 |
|---|--------|------|
| 01 | [01_서비스개요.md](01_서비스개요.md) | 서비스 핵심 가치, 7단계 플로우, v2 대비 변경점 |
| 02 | [02_DB스키마.md](02_DB스키마.md) | 신규 테이블 5개, 기존 테이블 변경, ER 관계도, 인덱스/RLS/트리거 |
| 03 | [03_API목록.md](03_API목록.md) | v3 신규 API 엔드포인트 전체 (Method, Path, 설명, 인증, 요청/응답 예시) |
| 04 | [04_프롬프트설계.md](04_프롬프트설계.md) | B2B/B2C 프롬프트 분기, 16개 템플릿, 커스텀 프롬프트 3모드, PipelineContext |
| 05 | [05_페이지구조.md](05_페이지구조.md) | 라우트 맵, 각 페이지 기능/UI/API 호출, FlowGuard/SetupRequired, Stepper |
| 06 | [06_보안체크리스트.md](06_보안체크리스트.md) | 인증, 소유권 검증, Rate Limit, 입력 검증, 에러 처리 |
| 07 | [07_배포가이드.md](07_배포가이드.md) | Railway 배포, Supabase 마이그레이션, 환경변수, 테스트 계정 |
| 08 | [08_향후계획.md](08_향후계획.md) | 미구현 기능, 개선 예정, 검증팀 미해결 항목 |

## 기준

- 마이그레이션: `supabase/migrations/003_v3_pipeline.sql`
- 타입 정의: `src/types/index.ts`
- AI 모델: `claude-sonnet-4-20250514`
- 프레임워크: Next.js 15 (App Router) + Supabase + Tailwind CSS
- 문서 작성일: 2026-03-25
