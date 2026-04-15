# Code Conventions (ADK plugin 강제)

> `adk-pipeline` 플러그인의 `@implementer` + `hooks/post-tool-use.sh`가
> 실행 레이어에서 강제. 위반 시 파일 쓰기가 차단됩니다.

## 파일 크기
- 신규 파일: 200줄 이하 필수
- 기존 위반 파일: 수정 시 해당 함수/섹션만 분리 (보이스카우트 규칙)
- 기존 파일 편집: `export ADK_ALLOW_OVERSIZE=1` 후 Claude 실행

## 공통화
- 동일 로직 2회 이상 → `src/lib/`에 추출
- API 호출 → `src/lib/api/`
- 재사용 훅 → `src/hooks/`
- 타입 → `src/types/index.ts` 중앙 관리

## 컴포넌트 분리
- 공통 UI → `src/components/`
- 페이지 전용 → `src/app/.../components/`
- 200줄 초과 페이지 수정 시 해당 섹션을 `components/`로 즉시 추출

## ADK implementer 경로 변수
- `constants_path`: `src/lib/constants.ts`
- `types_path`: `src/types/index.ts`
- `validations_path`: `src/lib/validations.ts`
- `api_helper_path`: `src/lib/api-helpers.ts`
- `pagination_path`: `src/lib/pagination.ts`
- `async_hook_path`: `src/hooks/useAsyncAction.ts`

## 현재 부채 (기존 위반 파일 15개 — `ADK_ALLOW_OVERSIZE=1` 필요)

| 파일 | 줄수 |
|------|------|
| `src/app/(dashboard)/contents/new/page.tsx` | 739 |
| `src/app/(dashboard)/create/channel-write/page.tsx` | 676 |
| `src/app/(dashboard)/keywords/[id]/page.tsx` | 596 |
| `src/app/(dashboard)/create/video-script/page.tsx` | 475 |
| `src/app/(dashboard)/keywords/page.tsx` | 474 |
| `src/app/(dashboard)/contents/page.tsx` | 462 |
| `src/app/(public)/landing/page.tsx` | 459 |
| `src/app/(auth)/login/page.tsx` | 449 |
| `src/app/(dashboard)/pricing/page.tsx` | 424 |
| `src/app/(dashboard)/contents/[id]/page.tsx` | 403 |
| `src/app/(dashboard)/calendar/page.tsx` | 360 |
| `src/app/(admin)/admin/users/page.tsx` | 334 |
| `src/app/(dashboard)/create/draft-info/page.tsx` | 315 |
| `src/app/(dashboard)/dashboard/page.tsx` | 280 |
| `src/app/(dashboard)/layout.tsx` | 251 |
