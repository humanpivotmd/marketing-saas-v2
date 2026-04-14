# CLAUDE.md — 작업 지침

---

## 🗺️ 수정 전 필독 문서 (매번 확인)
1. `.md/설계문서/수정위험도.md` — 🔴🟡🟢 등급 확인
2. `.md/설계문서/의존성맵.md` — 영향 범위 파악
→ 🔴 등급 파일이면 즉시 나에게 알리고 반드시 승인 받을 것

---

## 🤖 새 기능 개발 시 에이전트 팀 순서 (필수)

새 기능 개발은 반드시 아래 순서로 에이전트 호출:

```
1. @designer    → 구조 설계 + 파일 계획 + 위험도 확인
        ↓ 내 승인
2. @checker     → grep으로 의존성 충돌 + 부작용 탐지
        ↓ 내 승인
3. @implementer → 실제 코드 작성 (3개 파일씩, 완료마다 보고)
        ↓ 완료 보고마다 내가 확인
4. @verifier    → 빌드 + 타입 체크 + 재확인 (Ralph Loop)
```

→ 순서 건너뛰기 금지. 각 단계 내 승인 없이 다음 단계 진행 금지.

---

## ⛔ 절대 금지 (위반 시 즉시 중단)
- 내가 "진행해" 또는 "OK" 하기 전까지 코드 수정 절대 금지
- 요청하지 않은 파일 새로 생성 금지
- 요청하지 않은 기능 추가 금지
- 한 번에 3개 초과 파일 수정 금지
- 라이브러리/패키지 새로 설치 금지 (내가 먼저 승인한 경우만 허용)
- "일단 해보고 나서 설명"하는 방식 금지 → 반드시 계획 먼저
- 함수 이름 변경과 로직 변경을 동시에 하지 말 것 → 각각 따로
- 상수 이름 변경 시 grep 확인 없이 수정 금지
- 에러 여러 개를 한꺼번에 고치지 말 것 → 하나씩 순서대로
- 연관되어 보여도 반드시 먼저 나에게 보고 후 진행
- "이 파일도 수정하면 좋을 것 같습니다" → 보고 후 내가 승인해야만 진행

---

## 🔴 위험 파일 — 내 승인 없이 절대 수정 불가

아래 파일 수정 요청 시 즉시 "🔴 위험 파일입니다" 알림 후 승인 대기:

| 파일 | 위험 이유 |
|------|----------|
| `src/types/index.ts` | 69개 API + 전체 페이지 의존 |
| `src/lib/prompts/pipeline.ts` | 7단계 파이프라인 전체 영향 |
| `src/lib/auth.ts` | 전체 인증 흐름 — 잘못되면 모든 유저 영향 |
| `src/lib/constants.ts` | 전체 페이지 상수 의존 |
| `src/lib/crypto.ts` | 기존 채널 토큰 복호화 불가 위험 |
| `supabase/migrations/` | DB 롤백 어려움 |
| `projects.settings_snapshot` 구조 | 기존 프로젝트 데이터 호환성 파괴 |
| `contents` 테이블 컬럼 | channel/metadata 구조 — 프로덕션 DB와 코드 불일치 위험 |

---

## 🔗 의존성 추적 규칙 (수정 전 필수)

수정 전 반드시 아래를 확인하고 보고할 것:

1. 수정할 파일을 import 하는 파일 전부 찾기
   ```bash
   grep -r "import.*파일명" src/
   ```
2. 영향 범위 지도 그려서 보고:
   ```
   수정: A.ts
   → A를 쓰는 곳: B.tsx, C.tsx, D.tsx
   → 실제 수정 필요: A.ts, C.tsx
   → 확인만 필요: B.tsx, D.tsx
   ```
3. 지도 그린 후 내 승인 받고 수정 시작

---

## 🔄 대화 리셋 기준

아래 상황이면 새 대화를 시작할 것:
- 같은 에러가 3번 이상 반복될 때
- 대화가 20번 이상 주고받았을 때
- 내가 "새로 시작하자"고 할 때

→ 새 대화 시작 시 이 CLAUDE.md + 관련 파일만 다시 공유

---

## 🚨 꼬였을 때 복구 절차

1. 코드 수정 즉시 중단
2. `git status` 로 변경된 파일 목록 확인
3. `git diff` 로 무엇이 바뀌었는지 확인
4. 내가 판단 후 아래 중 선택:
   - `git checkout -- [파일명]` → 특정 파일만 되돌리기
   - `git stash` → 변경사항 임시 저장 후 되돌리기
   - `git reset --hard HEAD` → 마지막 커밋으로 전체 복구
5. 원인 파악 후 다시 STEP 1부터

---

## 💬 에러 발생 시 보고 형식

에러가 생기면 아래 형식으로만 보고:
```
에러 위치: [파일명, 줄 번호]
에러 원인: [한 줄 요약]
해결 방법: [하나만]
영향 파일: [목록]
```
→ 여러 에러가 있어도 하나씩 순서대로 처리
→ 에러 원인 파악 전에 코드 수정 금지

---

## ⚠️ contents 테이블 주의사항 (프로덕션 DB 기준)

코드에서 contents insert/select 시 반드시 아래 컬럼명 사용:
- ✅ 사용: `channel`, `metadata`, `meta`, `scheduled_date`, `published_at`, `tokens_used`
- ❌ 사용 금지: `type`, `hashtags`, `word_count`, `ai_model`, `keyword_id`, `seo_score`

---

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
- [ ] `supabase/migrations/` 새 마이그레이션 추가 (현재 005까지 존재)
- [ ] `src/types/index.ts` 타입 업데이트
- [ ] `.md/설계문서/DB스키마.md` 업데이트
- [ ] 프론트 기대 컬럼 vs DB 실제 컬럼 일치 확인 (특히 contents 테이블)
- [ ] 관련 API route 전부 확인
- [ ] 프론트 호출부 전부 확인
- [ ] 수정 순서 엄수: migration → types → API route → 프론트

스타일/디자인 변경:
- [ ] 다른 페이지와 디자인 일관성
- [ ] PC/모바일 둘 다 확인
- [ ] 공통 컴포넌트 스타일 충돌 여부

함수 변경:
- [ ] 함수 시그니처(이름, 파라미터, 리턴타입) 바꾸면 grep으로 호출부 전부 확인
- [ ] 이름 변경과 로직 변경은 절대 동시에 하지 말 것

### STEP 2 - 보고 형식 (수정 시작 전)
체크리스트 확인 결과를 아래 형식으로 보고:

```
🔴/🟡/🟢 등급:
수정 파일:
영향 파일:
확인 필요:
수정 순서:
```

### ⚠️ STEP 2 완료 후 반드시 내 승인을 기다릴 것. 승인 전 코드 수정 금지.

### STEP 3 - 수정 진행
- 3개 파일씩 나눠서 처리
- 완료마다 보고
- 병렬 처리 금지

### STEP 4 - 수정 완료 후 (항상) — Ralph Loop

```
[1/3] 타입 체크
npx tsc --noEmit

[2/3] 빌드 확인
npm run build

[3/3] Smoke Test
npx playwright test --project=smoke
```

- [ ] 위 3단계 모두 통과 확인
- [ ] 변경 내용 커밋:
  `git add -A && git commit -m "fix/feat/refactor: [내용]"`
- [ ] 작업 완료 후 변경 파일 목록 확인:
  `git diff --name-only HEAD~1`
  → 요청하지 않은 파일이 있으면 즉시 알려줄 것
- [ ] CLAUDE.md 공통 유틸 맵 업데이트 (새 공통 파일 생긴 경우)
- [ ] `.md/작업이력.md` 기록

### CLAUDE.md 확인 방법
작업 시작 시 반드시:
1. CLAUDE.md 파일을 실제로 읽었음을 확인
2. 읽은 내용 중 이번 작업과 관련된 규칙 나에게 먼저 보고
3. 확인 없이 작업 시작 금지

---

## 프로젝트 개요
- MarketingFlow: Next.js 16 + Supabase + Claude API 마케팅 SaaS
- 문서: `.md/INDEX.md` 참조
- API: 69개 Route Handler
- DB: 21개 테이블, 마이그레이션 5개 (001~005)
- AI 모델: `claude-sonnet-4-20250514`

## 빌드/실행
```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 (TypeScript 타입 체크 포함)
```

---

## 📋 실질적인 업무 단계별 필요 요소

### /spec 단계 - 요구사항 분석 (실행 전 필수)
**입력 요소:**
- 사용자 요청 내용 (기능/버그/개선)
- 현재 코드 상태 (관련 파일 grep)
- 데이터베이스 스키마 확인
- API 엔드포인트 영향도

**출력 요소:**
- 요구사항 명세서 (Markdown)
- 영향받는 파일 리스트
- 위험도 평가 (🔴🟡🟢)
- 예상 작업 시간
- 테스트 케이스 영향도

**체크리스트:**
- [ ] UI/UX 변경 사항 문서화
- [ ] 보안/권한 영향도 분석
- [ ] 성능 영향도 평가
- [ ] 브레이킹 체인지 여부 확인

### /plan 단계 - 작업 계획 수립
**입력 요소:**
- /spec 결과물
- 현재 프로젝트 상태
- 팀 리소스 상황

**출력 요소:**
- 작업 브레이크다운 (최대 2시간 단위)
- 우선순위 매트릭스
- 의존성 그래프
- 롤백 계획
- 코드 리뷰 포인트

**체크리스트:**
- [ ] 작업 단위가 너무 크지 않은지 확인
- [ ] 병렬 작업 가능성 평가
- [ ] 테스트 전략 수립
- [ ] 문서화 계획 포함

### /build 단계 - 코드 구현
**입력 요소:**
- /plan 승인된 작업 단위
- 기존 코드베이스
- 디자인/기획 문서

**출력 요소:**
- 구현된 코드
- TypeScript 타입 정의
- 단위 테스트 코드
- 변경된 파일 리스트

**체크리스트:**
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 규칙 준수
- [ ] JSDoc 주석 작성
- [ ] 임시 코드/콘솔 로그 제거
- [ ] 코드 포맷팅 완료

### /test 단계 - 검증 및 테스트
**입력 요소:**
- 구현된 코드
- 기존 테스트 케이스
- 성능 기준

**출력 요소:**
- 테스트 결과 리포트
- 커버리지 리포트
- 빌드 로그
- 성능 측정 결과

**체크리스트:**
- [ ] `npm run build` 성공
- [ ] 단위 테스트 80% 이상 커버리지
- [ ] 통합 테스트 통과
- [ ] E2E 테스트 (Playwright) 통과
- [ ] Lighthouse 성능 점수 확인
- [ ] npm audit 보안 취약점 없음

### /review 단계 - 코드 리뷰
**입력 요소:**
- 구현된 코드 + 테스트 결과
- 코드 리뷰 체크리스트
- 기존 코드베이스 표준

**출력 요소:**
- 리뷰 코멘트 리스트
- 개선 제안
- 승인/거부 결정
- 리팩토링 계획

**체크리스트:**
- [ ] 코드 중복 제거
- [ ] 네이밍 일관성 확인
- [ ] 보안 취약점 검사
- [ ] 성능 최적화 적용
- [ ] 접근성 준수 확인
- [ ] 문서화 업데이트

### /ship 단계 - 배포 및 모니터링
**입력 요소:**
- 리뷰 승인된 코드
- 배포 환경 설정
- 모니터링 도구

**출력 요소:**
- 배포 로그
- 모니터링 대시보드
- 롤백 스크립트
- 사용자 피드백 수집 계획

**체크리스트:**
- [ ] 브랜치 전략 준수 (feature branch)
- [ ] 커밋 메시지 규칙 준수
- [ ] PR 템플릿 사용
- [ ] CI/CD 파이프라인 통과
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 환경별 설정 확인
- [ ] 에러 트래킹 설정 완료

---

*이 문서는 프로젝트 요구사항에 따라 업데이트됩니다.*

## 코드 원칙
- 상수는 `src/lib/constants.ts`에서만 정의
- 같은 데이터를 2곳 이상에 하드코딩 금지
- 타입은 `src/types/index.ts`에서 관리
- 검증은 `src/lib/validations.ts` Zod 스키마 사용
- contents insert/select 시 반드시 프로덕션 DB 컬럼 기준 사용 (`channel`, `metadata`)

---

## 공통 유틸 맵

| 파일 | 용도 | 사용처 |
|------|------|--------|
| `src/lib/auth-client.ts` | `getToken()`, `authHeaders()` — 클라이언트 인증 | 프론트 API 호출 시 필수 (18개 파일) |
| `src/lib/api-helpers.ts` | `getOwnedRecord()`, `updateOwnedRecord()`, `deleteOwnedRecord()` — CRUD 헬퍼 | API route CRUD (11곳) |
| `src/lib/pagination.ts` | `parsePagination()`, `paginatedResponse()` — 목록 API 페이지네이션 | keywords, contents, admin/users |
| `src/hooks/useAsyncAction.ts` | `run()`, `showToast()`, `clearToast()` — 비동기 액션+토스트 | 16개 페이지 |
| `src/hooks/useBusinessProfile.ts` | 비즈니스 프로필 Context — 중복 API 호출 제거 | SetupRequired, dashboard, keywords, draft-info, settings/BusinessProfileTab |
| `src/lib/constants.ts` | 상수 단일 출처 — 채널/톤/상태/옵션/색상 등 | 전역 (CHANNEL_LABEL_MAP, CHANNEL_COLOR_MAP 포함) |
| `src/lib/validations.ts` | Zod 스키마 — 폼 검증 | API route, 프론트 |
| `src/lib/errors.ts` | `handleApiError()` — API 에러 응답 통일 | 모든 API route |
| `src/lib/rate-limit.ts` | `generateRateLimit`, `checkRateLimitOrRespond()` | generate/* API (9개) |
| `src/lib/sanitize.ts` | `sanitizeInput()`, `sanitizePromptInput()` — XSS/인젝션 방지 | generate/* API |
| `src/lib/usage.ts` | `logUsage()`, `checkUsageLimit()` — AI 사용량 기록/체크 | generate/* API |
| `src/lib/prompts/pipeline.ts` | `buildTitlePrompt()`, `buildDraftPrompt()`, `buildChannelPrompt()` 등 | generate/* API (9개) |
| `src/components/FlowGuard.tsx` | 파이프라인 단계 가드 — `requiredStep` 체크 | create/* 4개 페이지 |
| `src/components/SetupRequired.tsx` | 마이페이지 설정 필수 가드 | draft-info 페이지 |

---

## 나중에 할 것
- projects/route.ts 페이지네이션을 paginatedResponse로 통일
  → 프론트 projects 페이지에서 응답 형식 변경 필요
- settings/page.tsx 탭별 컴포넌트 분리 후 useAsyncAction 적용 (일부 완료)
- keywords/page.tsx, keywords/[id]/page.tsx visible 패턴 정리
- Redis Rate Limit 전환 (현재 인메모리 Map — 멀티 인스턴스 미지원)
- 토스페이먼츠 실제 결제 연동 (현재 주석 처리)
- 발행 예약 자동화 (scheduled_date → 실제 발행)
