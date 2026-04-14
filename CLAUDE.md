# CLAUDE.md — 작업 지침

---

## 🗺️ 수정 전 필독 문서 (매번 확인)
1. `.md/설계문서/수정위험도.md` — 🔴🟡🟢 등급 확인
2. `.md/설계문서/의존성맵.md` — 영향 범위 파악
→ 🔴 등급 파일이면 즉시 나에게 알리고 반드시 승인 받을 것

---

## 🤖 AI 에이전트 개발 방법론

AI 에이전트 작업은 표준화된 워크플로우를 따릅니다:

- **Agent Development Kit**: [Agent-Development-Kit.md](Agent-Development-Kit.md) - 전체 아키텍처와 구성 요소
- **Agent Skills**: [Agent-Skills.md](Agent-Skills.md) - 단계별 실행 가이드 (/spec → /plan → /build → /test → /review → /ship)

**핵심 규칙**:
1. 모든 작업은 `/spec`부터 시작
2. 단계별 승인 필수 (건너뛰기 금지)
3. CLAUDE.md 규칙 우선 적용
4. 3개 파일 초과 수정 금지

**실질적인 업무 단계별 필요 요소**: [Agent-Skills.md#각-단계-상세](Agent-Skills.md#각-단계-상세) 참조

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

1. **파일 의존성 분석**
   ```bash
   grep -r "import.*파일명" src/
   grep -r "from.*파일명" src/
   ```
   → 수정 파일을 import하는 모든 파일 찾기

2. **영향 범위 지도 작성**
   ```
   수정: A.ts
   → A를 쓰는 곳: B.tsx, C.tsx, D.tsx
   → 실제 수정 필요: A.ts, C.tsx
   → 확인만 필요: B.tsx, D.tsx
   ```

3. **복합 영향 분석**
   - **UI/UX 영향**: 화면 레이아웃, 사용자 플로우, 모바일 대응
   - **프로세스 영향**: 비즈니스 로직, 워크플로우, 상태 관리
   - **함수 영향**: 호출 체인, 파라미터 변경, 리턴 타입
   - **DB 영향**: 스키마 변경, 마이그레이션, 기존 데이터 호환성

4. **리스크 평가**
   - 🔴 고위험: API 변경, DB 스키마 변경, 인증 로직 변경
   - 🟡 중위험: UI 컴포넌트 변경, 설정 변경
   - 🟢 저위험: 문구 변경, 스타일 변경, 주석 추가

지도 그린 후 내 승인 받고 수정 시작

---

## 🤖 자동화된 영향 분석 (HOOKS + SUBAGENTS)

수정 작업 시 반드시 아래 자동화 도구를 활용:

### 1. Impact Analyzer SUBAGENT
```
/impact-analyze [수정대상]
```
- **UI/UX 영향**: 컴포넌트 의존성, 레이아웃 영향, 사용자 플로우
- **프로세스 영향**: 비즈니스 로직 체인, 상태 전이, 워크플로우
- **함수 영향**: 호출 그래프, 인터페이스 변경, 사이드 이펙트
- **DB 영향**: 스키마 변경, 데이터 마이그레이션, 쿼리 영향

### 2. Dependency Scanner HOOK
자동 실행되는 검증:
- 파일 import/export 관계 분석
- 함수 호출 체인 추적
- 데이터 플로우 맵핑
- 순환 의존성 감지

### 3. Risk Assessor SUBAGENT
```
/assess-risk [변경사항]
```
- 복합 리스크 평가 (🔴🟡🟢)
- 완화 전략 제안
- 대안 솔루션 제시

### 4. Code Reviewer SUBAGENT
```
/review-impact [코드변경]
```
- 품질 영향 분석
- 리팩토링 포인트 식별
- 테스트 커버리지 검토

**실행 규칙**: 모든 수정 전 `/impact-analyze` 실행 → 결과 보고 → 승인 후 진행

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
