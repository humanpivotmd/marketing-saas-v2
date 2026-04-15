# 🔴 위험 파일 — 승인 없이 수정 불가

> 이 파일은 `user-prompt-submit.sh` hook이 첫 bullet 8개를 자동 주입.
> 수정 요청 시 즉시 "🔴 위험 파일입니다" 알림 후 승인 대기.

- `src/types/index.ts` — 69개 API + 전체 페이지 의존
- `src/lib/prompts/pipeline.ts` — 7단계 파이프라인 전체 영향
- `src/lib/auth.ts` — 전체 인증 흐름
- `src/lib/constants.ts` — 전체 페이지 상수 의존
- `src/lib/crypto.ts` — 기존 채널 토큰 복호화 불가 위험
- `supabase/migrations/` — DB 롤백 어려움
- `projects.settings_snapshot` — 기존 프로젝트 데이터 호환성
- `contents` 테이블 컬럼 — 프로덕션 DB 불일치 위험
