# CLAUDE.md — 작업 지침

## 작업 시작 전 필수 (매번)

모든 작업 요청 시 아래 순서를 반드시 따를 것.

### STEP 1 - 체크리스트 확인 (수정 전)
아래 중 해당하는 항목 확인 후 나에게 보고:

UI/문구/버튼/상수 변경:
- [ ] `src/lib/constants.ts` 상수인지 확인 ← 단일 출처. 여기만 수정
- [ ] 같은 문구가 다른 페이지에도 있는지 grep
- [ ] 새 상수 추가 시 기존 하드코딩이 남아있지 않은지 grep 확인
- [ ] 모바일 레이아웃 영향 여부
- [ ] 다국어 처리 필요 여부

페이지 추가/삭제:
- [ ] 네비게이션/사이드바 메뉴 반영
- [ ] 로그인 Guard 설정
- [ ] 에러 페이지 처리
- [ ] 빈 상태 메시지 포함
- [ ] Smoke Test 추가

컴포넌트 변경:
- [ ] 같은 컴포넌트 사용하는 페이지 전부 확인
- [ ] 로딩/에러/빈 상태 포함 여부
- [ ] 모바일 터치 영역 44px 이상

폼/입력 변경:
- [ ] 필수값 검증 (`src/lib/validations.ts` Zod 스키마)
- [ ] 중복 제출 방지 (버튼 비활성화)
- [ ] 성공/실패 toast 메시지
- [ ] 로딩 스피너

API/로직 변경:
- [ ] 중복 로직 다른 파일에 있는지 확인
- [ ] `src/types/index.ts` 요청/응답 타입 업데이트
- [ ] `src/lib/validations.ts` Zod 스키마 수정
- [ ] 프론트엔드 호출부 (해당 page.tsx) 수정
- [ ] token 없을 때 처리 (loading이 true로 남지 않도록)
- [ ] loading 시작/종료 처리
- [ ] API 에러 시 사용자 안내 메시지
- [ ] 프론트 API 호출 시 `src/lib/auth-client.ts` getToken(), authHeaders() 사용
- [ ] API route CRUD 시 `src/lib/api-helpers.ts` 헬퍼 사용
- [ ] 목록 API 시 `src/lib/pagination.ts` 사용
- [ ] 페이지 loading+toast 시 `src/hooks/useAsyncAction.ts` 사용
- [ ] 프롬프트 변경 시 `src/lib/prompts/pipeline.ts` + `.md/서비스가이드/` 문서 확인

DB 변경:
- [ ] `supabase/migrations/` 새 마이그레이션 추가
- [ ] `src/types/index.ts` 타입 업데이트
- [ ] `.md/설계문서/DB스키마.md` 업데이트
- [ ] 프론트 기대 컬럼 vs DB 실제 컬럼 일치 확인
- [ ] 관련 API route 전부 확인
- [ ] 프론트 호출부 전부 확인

스타일/디자인 변경:
- [ ] 다른 페이지와 디자인 일관성
- [ ] PC/모바일 둘 다 확인
- [ ] 공통 컴포넌트 스타일 충돌 여부

### STEP 2 - 보고 형식 (수정 시작 전)
체크리스트 확인 결과를 아래 형식으로 보고:
- 영향 범위: [파일 목록]
- 확인 필요: [체크리스트에서 해당하는 항목]
- 수정 계획: [무엇을 어떤 순서로]

### STEP 3 - 수정 진행
- 3개 파일씩 나눠서 처리
- 완료마다 보고
- 병렬 처리 금지

## 절대 규칙 (위반 금지)

### 범위 제한
- 요청한 파일 외 절대 수정 금지
- 연관되어 보여도 반드시 먼저 나에게 보고 후 진행
- "이 파일도 수정하면 좋을 것 같습니다" → 보고 후 내가 승인해야만 진행

### 공통 파일 수정 시 반드시 사전 보고
아래 파일은 수정 전 반드시 나에게 먼저 보고:
- src/lib/errors.ts
- src/lib/auth-client.ts
- src/lib/api-helpers.ts
- src/lib/pagination.ts
- src/lib/constants.ts
- src/hooks/useAsyncAction.ts
- src/types/index.ts
- src/lib/validations.ts

### 작업 완료 후 필수 확인
모든 작업 완료 후 반드시 실행:
`git diff --name-only HEAD~1`

→ 변경된 파일 목록 나에게 보고
→ 요청하지 않은 파일이 있으면 즉시 알려줄 것
→ 내가 확인 후 되돌릴지 유지할지 결정

### CLAUDE.md 확인 방법
작업 시작 시 반드시:
1. CLAUDE.md 파일을 실제로 읽었음을 확인
2. 읽은 내용 중 이번 작업과 관련된 규칙 나에게 먼저 보고
3. 확인 없이 작업 시작 금지

### STEP 4 - 수정 완료 후 (항상)
- [ ] `npm run build` 성공 확인
- [ ] Smoke Test 실행
  `npx playwright test --project=smoke`
- [ ] 변경 내용 커밋
  `git add -A && git commit -m "fix/feat/refactor: [내용]"`
- [ ] CLAUDE.md 공통 유틸 맵 업데이트 (새 공통 파일 생긴 경우)
- [ ] `.md/작업이력.md` 기록

---

## 프로젝트 개요
- MarketingFlow: Next.js 16 + Supabase + Claude API 마케팅 SaaS
- 문서: `.md/INDEX.md` 참조

## 빌드/실행
```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 (TypeScript 타입 체크 포함)
```

## 코드 원칙
- 상수는 `src/lib/constants.ts`에서만 정의
- 같은 데이터를 2곳 이상에 하드코딩 금지
- 타입은 `src/types/index.ts`에서 관리
- 검증은 `src/lib/validations.ts` Zod 스키마 사용

## 공통 유틸 맵

| 파일 | 용도 | 사용처 |
|------|------|--------|
| `src/lib/auth-client.ts` | `getToken()`, `authHeaders()` — 클라이언트 인증 | 프론트 API 호출 시 필수 |
| `src/lib/api-helpers.ts` | `getOwnedRecord()`, `updateOwnedRecord()`, `deleteOwnedRecord()` — CRUD 헬퍼 | API route에서 소유권 검증+CRUD |
| `src/lib/pagination.ts` | `parsePagination()`, `paginatedResponse()` — 목록 API 페이지네이션 | keywords, contents, admin/users |
| `src/hooks/useAsyncAction.ts` | `run()`, `showToast()`, `clearToast()` — 비동기 액션+토스트 | 16개 페이지 |
| `src/lib/constants.ts` | 상수 단일 출처 — 채널/톤/상태/옵션 등 | 전역 |
| `src/lib/validations.ts` | Zod 스키마 — 폼 검증 | API route, 프론트 |
| `src/lib/errors.ts` | `handleApiError()` — API 에러 응답 통일 | 모든 API route |
| `src/lib/rate-limit.ts` | `generateRateLimit`, `checkRateLimitOrRespond()` | generate/* API |
| `src/lib/sanitize.ts` | `sanitizeInput()`, `sanitizePromptInput()` — XSS/인젝션 방지 | generate/* API |
| `src/lib/usage.ts` | `logUsage()` — AI 사용량 기록 | generate/* API |
| `src/lib/prompts/pipeline.ts` | `buildTitlePrompt()`, `buildDraftPrompt()`, `buildChannelPrompt()` 등 | generate/* API |
| `src/components/FlowGuard.tsx` | 파이프라인 단계 가드 — `requiredStep` 체크 | create/* 페이지 |
| `src/components/SetupRequired.tsx` | 마이페이지 설정 필수 가드 | draft-info 페이지 |
| `src/hooks/useBusinessProfile.ts` | 비즈니스 프로필 Context | draft-info, settings |

## 나중에 할 것
- projects/route.ts 페이지네이션을 paginatedResponse로 통일
  → 프론트 projects 페이지에서 응답 형식 변경 필요
- settings/page.tsx 탭별 컴포넌트 분리 후 useAsyncAction 적용
- keywords/page.tsx, keywords/[id]/page.tsx visible 패턴 정리

## Ralph Loop 자동 검증

모든 작업 완료 후 반드시 실행:
\=== Ralph Loop 시작 ===
[1/3] 타입 체크 중...
✅ 타입 체크 통과
[2/3] 빌드 중...

> marketing-saas-v2@1.0.0 build
> next build

▲ Next.js 16.2.1 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 3.6s
  Running TypeScript ...
  Finished TypeScript in 5.4s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/96) ...
  Generating static pages using 11 workers (24/96) 
  Generating static pages using 11 workers (48/96) 
  Generating static pages using 11 workers (72/96) 
✓ Generating static pages using 11 workers (96/96) in 651ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ○ /admin-login
├ ○ /admin/industries
├ ○ /admin/mail
├ ○ /admin/plans
├ ○ /admin/prompts
├ ○ /admin/support
├ ○ /admin/users
├ ƒ /api/admin/action-logs
├ ƒ /api/admin/industries
├ ƒ /api/admin/industries/[id]
├ ƒ /api/admin/logs
├ ƒ /api/admin/mail/history
├ ƒ /api/admin/mail/send
├ ƒ /api/admin/migrate
├ ƒ /api/admin/plan-limits
├ ƒ /api/admin/prompts
├ ƒ /api/admin/prompts/[id]/activate
├ ƒ /api/admin/stats
├ ƒ /api/admin/stats/costs
├ ƒ /api/admin/support
├ ƒ /api/admin/users
├ ƒ /api/admin/users/[id]
├ ƒ /api/admin/users/[id]/unlock
├ ƒ /api/admin/users/[id]/usage-grant
├ ƒ /api/auth/forgot-password
├ ƒ /api/auth/login
├ ƒ /api/auth/me
├ ƒ /api/auth/register
├ ƒ /api/auth/resend-verify
├ ƒ /api/auth/reset-password
├ ƒ /api/auth/verify-email
├ ƒ /api/brand-voices
├ ƒ /api/brand-voices/[id]
├ ƒ /api/calendar
├ ƒ /api/channels
├ ƒ /api/channels/[id]
├ ƒ /api/channels/test
├ ƒ /api/contents
├ ƒ /api/contents/[id]
├ ƒ /api/contents/[id]/duplicate
├ ƒ /api/generate
├ ƒ /api/generate/draft
├ ƒ /api/generate/image
├ ƒ /api/generate/image-script
├ ƒ /api/generate/outline
├ ƒ /api/generate/pipeline
├ ƒ /api/generate/single
├ ƒ /api/generate/titles
├ ƒ /api/generate/video-script
├ ƒ /api/industries
├ ƒ /api/keywords
├ ƒ /api/keywords/[id]
├ ƒ /api/keywords/grade
├ ƒ /api/keywords/naver
├ ƒ /api/keywords/opportunities
├ ƒ /api/keywords/seo-score
├ ƒ /api/keywords/trends
├ ƒ /api/mypage/account
├ ƒ /api/mypage/business-profile
├ ƒ /api/mypage/password
├ ƒ /api/mypage/profile
├ ƒ /api/mypage/usage
├ ƒ /api/payments/checkout
├ ƒ /api/payments/confirm
├ ƒ /api/payments/history
├ ƒ /api/payments/webhook
├ ƒ /api/projects
├ ƒ /api/projects/[id]
├ ƒ /api/public/keyword-preview
├ ƒ /api/publish/clipboard
├ ƒ /api/publish/instagram
├ ƒ /api/publish/threads
├ ƒ /api/schedules
├ ƒ /api/schedules/[id]
├ ƒ /api/social-settings
├ ƒ /api/subscriptions
├ ƒ /api/subscriptions/cancel
├ ƒ /api/support
├ ƒ /api/user-prompts
├ ○ /calendar
├ ○ /contents
├ ƒ /contents/[id]
├ ○ /contents/new
├ ○ /create/channel-write
├ ○ /create/draft-info
├ ○ /create/generating
├ ○ /create/image-script
├ ○ /create/video-script
├ ○ /dashboard
├ ○ /dashboard-preview
├ ○ /guide
├ ○ /keywords
├ ƒ /keywords/[id]
├ ○ /landing
├ ○ /login
├ ○ /login-preview
├ ○ /onboarding
├ ○ /pricing
├ ○ /pricing/checkout
├ ○ /privacy
├ ○ /reset-password
├ ○ /settings
├ ○ /sitemap.xml
├ ○ /support
├ ○ /terms
└ ○ /verify-email


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

✅ 빌드 성공
[3/3] PRD 상태 확인...
PRD 현황: 7/11 통과
US-01 ❌ 토스페이먼츠 결제 연동
US-02 ❌ 페이스북 자동 발행
US-03 ✅ 채널별 개별 컨펌
US-04 ❌ 자동 결제 갱신
US-05 ❌ 블로그 직접 발행
US-06 ✅ SNS 채널 설정 개선
US-07 ✅ 채널별 이미지 BottomSheet 통합
US-08 ✅ STEP2 키워드+서비스명 조합
US-09 ✅ STEP3 이벤트 유형 + 핵심 전달 내용
US-10 ✅ STEP7 영상 글+스토리보드 탭 분리
US-11 ✅ STEP7 영상 수정 요청 API 연동
=== Ralph Loop 완료 ===
오류 발생 시:
1. 타입 에러 → 해당 파일 수정 후 다시 실행
2. 빌드 실패 → 오류 메시지 확인 후 수정
3. 모두 통과 → 커밋 진행
