# Checklists — 작업 유형별 확인 항목

## UI / 문구 / 버튼 / 상수 변경
- [ ] `src/lib/constants.ts` 단일 출처 — 여기만 수정
- [ ] 같은 문구가 다른 페이지에도 있는지 grep
- [ ] 기존 하드코딩 잔존 여부 grep
- [ ] 모바일 레이아웃 영향
- [ ] 다국어 처리 필요 여부

## 페이지 추가 / 삭제
- [ ] 네비게이션/사이드바 메뉴 반영
- [ ] 로그인 Guard 설정
- [ ] 에러 페이지 처리
- [ ] 빈 상태 메시지
- [ ] Smoke Test 추가

## 컴포넌트 변경
- [ ] 같은 컴포넌트 사용하는 페이지 전부 확인
- [ ] 로딩/에러/빈 상태 포함
- [ ] 모바일 터치 영역 44px 이상

## 폼 / 입력 변경
- [ ] 필수값 검증 (`src/lib/validations.ts` Zod 스키마)
- [ ] 중복 제출 방지 (버튼 비활성화)
- [ ] 성공/실패 toast
- [ ] 로딩 스피너

## API / 로직 변경
- [ ] 중복 로직 다른 파일에 있는지
- [ ] `src/types/index.ts` 요청/응답 타입 업데이트
- [ ] `src/lib/validations.ts` Zod 스키마 수정
- [ ] 프론트엔드 호출부 수정
- [ ] token 없을 때 처리 (loading 고착 방지)
- [ ] loading 시작/종료
- [ ] API 에러 시 사용자 안내
- [ ] `src/lib/auth-client.ts` getToken()/authHeaders() 사용
- [ ] `src/lib/api-helpers.ts` CRUD 헬퍼 사용
- [ ] 목록 API는 `src/lib/pagination.ts`
- [ ] 페이지 loading+toast는 `src/hooks/useAsyncAction.ts`
- [ ] 프롬프트 변경 시 `src/lib/prompts/pipeline.ts` + `.md/서비스가이드/` 확인

## DB 변경
- [ ] `supabase/migrations/` 새 마이그레이션 (현재 005까지)
- [ ] `src/types/index.ts` 타입 업데이트
- [ ] `.md/설계문서/DB스키마.md` 업데이트
- [ ] 프론트 기대 컬럼 vs DB 실제 컬럼 일치 (특히 contents)
- [ ] 관련 API route 전부 확인
- [ ] 프론트 호출부 전부 확인
- [ ] 수정 순서: migration → types → API → 프론트

## 스타일 / 디자인
- [ ] 다른 페이지와 일관성
- [ ] PC/모바일 둘 다
- [ ] 공통 컴포넌트 스타일 충돌

## 함수 변경
- [ ] 시그니처 변경 시 grep으로 호출부 전부
- [ ] 이름 변경과 로직 변경은 절대 동시에 X

## ⚠️ contents 테이블 컬럼 (프로덕션 DB)
- ✅ `channel`, `metadata`, `meta`, `scheduled_date`, `published_at`, `tokens_used`
- ❌ `type`, `hashtags`, `word_count`, `ai_model`, `keyword_id`, `seo_score`
