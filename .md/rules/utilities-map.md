# 공통 유틸 맵

| 파일 | 용도 | 사용처 |
|------|------|--------|
| `src/lib/auth-client.ts` | `getToken()`, `authHeaders()` — 클라이언트 인증 | 프론트 API 호출 필수 (18개 파일) |
| `src/lib/api-helpers.ts` | `getOwnedRecord()`, `updateOwnedRecord()`, `deleteOwnedRecord()` | API route CRUD (11곳) |
| `src/lib/pagination.ts` | `parsePagination()`, `paginatedResponse()` | keywords, contents, admin/users |
| `src/hooks/useAsyncAction.ts` | `run()`, `showToast()`, `clearToast()` | 16개 페이지 |
| `src/hooks/useBusinessProfile.ts` | 비즈니스 프로필 Context | SetupRequired, dashboard, keywords, draft-info, settings/BusinessProfileTab |
| `src/lib/constants.ts` | 상수 단일 출처 — 채널/톤/상태/옵션/색상 | 전역 (CHANNEL_LABEL_MAP, CHANNEL_COLOR_MAP) |
| `src/lib/validations.ts` | Zod 스키마 | API route, 프론트 |
| `src/lib/errors.ts` | `handleApiError()` | 모든 API route |
| `src/lib/rate-limit.ts` | `generateRateLimit`, `checkRateLimitOrRespond()` | generate/* (9개) |
| `src/lib/sanitize.ts` | `sanitizeInput()`, `sanitizePromptInput()` | generate/* |
| `src/lib/usage.ts` | `logUsage()`, `checkUsageLimit()` | generate/* |
| `src/lib/prompts/pipeline.ts` | `buildTitlePrompt()`, `buildDraftPrompt()`, `buildChannelPrompt()` | generate/* (9개) |
| `src/components/FlowGuard.tsx` | 파이프라인 단계 가드 | create/* 4개 페이지 |
| `src/components/SetupRequired.tsx` | 마이페이지 설정 필수 가드 | draft-info 페이지 |
