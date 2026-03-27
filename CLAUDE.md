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

## 나중에 할 것
- projects/route.ts 페이지네이션을 paginatedResponse로 통일
  → 프론트 projects 페이지에서 응답 형식 변경 필요
- settings/page.tsx 탭별 컴포넌트 분리 후 useAsyncAction 적용
- keywords/page.tsx, keywords/[id]/page.tsx visible 패턴 정리
