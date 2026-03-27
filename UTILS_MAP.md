# 공통 유틸 맵

## 프론트엔드

| 용도 | 파일 | 함수/상수 |
|------|------|-----------|
| API 호출 인증 | auth-client.ts | getToken(), authHeaders() |
| loading + toast | useAsyncAction.ts | run(), showToast(), clearToast |
| 채널 라벨/색상 | constants.ts | CHANNEL_LABEL_MAP, CHANNEL_COLOR_MAP, CHANNEL_DOT_MAP |
| 채널 목록 | constants.ts | CHANNEL_OPTIONS, CONTENT_CHANNELS, CONTENT_CREATE_CHANNELS |
| 폼 옵션 | constants.ts | TONE_OPTIONS, TOPIC_TYPES, PROMPT_MODES, GENDER_OPTIONS, BUSINESS_TYPES |
| 상태 표시 | constants.ts | CONTENT_STATUS_MAP |
| 영상 옵션 | constants.ts | VIDEO_FORMAT_OPTIONS, VIDEO_CHANNEL_OPTIONS, VIDEO_STYLES |

## 백엔드 (API route)

| 용도 | 파일 | 함수 |
|------|------|------|
| CRUD 조회 | api-helpers.ts | getOwnedRecord(req, params, table) |
| CRUD 수정 | api-helpers.ts | updateOwnedRecord(req, params, table, schema) |
| CRUD 삭제 | api-helpers.ts | deleteOwnedRecord(req, params, table) |
| 목록 파싱 | pagination.ts | parsePagination(url, defaults?) |
| 목록 응답 | pagination.ts | paginatedResponse(data, count, params) |
| 입력 검증 | validations.ts | validateRequest(schema, body) |

## 나중에 할 것
- projects/route.ts 페이지네이션을 paginatedResponse로 통일
  → 프론트 projects 페이지에서 응답 형식 변경 필요
- settings/page.tsx 탭별 컴포넌트 분리 후 useAsyncAction 적용
- keywords/page.tsx, keywords/[id]/page.tsx visible 패턴 정리

## 규칙
새 기능 추가 전에 이 파일 먼저 확인.
있는 거 재사용, 없으면 여기에 추가.
