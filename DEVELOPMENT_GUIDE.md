# 개발 가이드 (비개발자용)

> 대상: 혼자 개발, Claude Code 터미널만 사용, Windows
> 마지막 업데이트: 2026-03-26

---

## 1. 프로젝트 시작 체크리스트

### Next.js 프로젝트 시작

```
Claude Code 프롬프트:
"Next.js 16 + Supabase + Tailwind CSS 프로젝트를 만들어줘.
TypeScript strict 모드, 한국어 기본, 모바일 반응형 포함."
```

- [ ] `npx create-next-app@latest` 실행
- [ ] TypeScript + Tailwind CSS + App Router 선택
- [ ] `tsconfig.json`에 `strict: true`, `noUnusedLocals: true` 추가
- [ ] Git 초기화 + GitHub 연결
  ```bash
  git init
  git remote add origin https://github.com/humanpivotmd/프로젝트명.git
  git add -A && git commit -m "init: 프로젝트 초기화"
  git push -u origin main
  ```
- [ ] 환경변수 파일 생성
  - `.env.local` — 개발용 (Git에 올리지 않음)
  - `.env.production` — 배포용
- [ ] CLAUDE.md 생성 (아래 템플릿 사용)
- [ ] `.gitignore`에 `.env*`, `node_modules/`, `.next/` 추가
- [ ] 모바일 반응형 기본 설정 (viewport meta, Tailwind breakpoints)
- [ ] Claude Code 자동 승인 설정
  ```bash
  cd 프로젝트폴더
  claude --dangerously-skip-permissions
  ```
  > 이 설정을 켜면 파일 수정/생성을 매번 확인하지 않습니다.
  > 단, 삭제 작업(`rm`, `delete`)은 항상 확인을 요청합니다.

### PHP 프로젝트 시작

```
Claude Code 프롬프트:
"PHP 프로젝트를 만들어줘.
MySQL 연동, 모듈형 구조, 한국어 기본."
```

- [ ] 폴더 구조: `public/`, `src/`, `config/`, `templates/`
- [ ] DB 연결 설정 (`config/database.php`)
- [ ] `.htaccess` 설정
- [ ] CLAUDE.md 생성

### Next.js + PHP 혼합

- [ ] Next.js = 프론트엔드 (Vercel/Railway)
- [ ] PHP = API 백엔드 (별도 서버)
- [ ] CORS 설정 확인
- [ ] API 엔드포인트 문서화

---

## 2. CLAUDE.md 기본 템플릿

프로젝트 루트에 `CLAUDE.md` 파일을 만들면 Claude Code가 매번 자동으로 읽습니다.
아래는 현재 프로젝트에서 사용 중인 최신 버전입니다.

```markdown
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

페이지 추가/삭제:
- [ ] 네비게이션/사이드바 메뉴 반영
- [ ] 로그인 Guard 설정
- [ ] 빈 상태 메시지 포함
- [ ] Smoke Test 추가

컴포넌트 변경:
- [ ] 같은 컴포넌트 사용하는 페이지 전부 확인
- [ ] 로딩/에러/빈 상태 포함 여부
- [ ] 모바일 터치 영역 44px 이상

폼/입력 변경:
- [ ] 필수값 검증 (Zod 스키마)
- [ ] 중복 제출 방지 (버튼 비활성화)
- [ ] 성공/실패 toast 메시지

API/로직 변경:
- [ ] 중복 로직 다른 파일에 있는지 확인
- [ ] types/index.ts 업데이트
- [ ] token 없을 때 처리
- [ ] 공통 유틸 사용 (auth-client, api-helpers, pagination, useAsyncAction)

DB 변경:
- [ ] 마이그레이션 파일 추가
- [ ] types/index.ts 업데이트
- [ ] 프론트 기대 컬럼 vs DB 실제 컬럼 일치 확인
- [ ] 관련 API route + 프론트 호출부 전부 확인

### STEP 2 - 보고 형식 (수정 시작 전)
- 영향 범위: [파일 목록]
- 확인 필요: [해당 항목]
- 수정 계획: [순서]

### STEP 3 - 수정 진행
- 3개 파일씩 나눠서 처리, 완료마다 보고, 병렬 금지

### STEP 4 - 수정 완료 후 (항상)
- [ ] npm run build 성공 확인
- [ ] Smoke Test 실행
- [ ] 커밋
- [ ] 작업이력.md 기록

---

## 프로젝트 개요
- 프로젝트명: [이름]
- 기술 스택: [Next.js 16 / Supabase / etc.]

## 코드 원칙
- 상수는 constants.ts에서만 정의
- 같은 데이터를 2곳 이상에 하드코딩 금지
- 비슷한 로직이 이미 있으면 새로 만들지 말고 기존 것을 사용

## 공통 유틸 맵
| 파일 | 용도 |
|------|------|
| constants.ts | 상수 단일 출처 |
| auth-client.ts | 프론트 인증 |
| api-helpers.ts | CRUD 헬퍼 |
| pagination.ts | 목록 API |
| useAsyncAction.ts | loading+toast |
| validations.ts | Zod 스키마 |

## 나중에 할 것
- (할 일 목록)
```

```
Claude Code 프롬프트:
"위 템플릿으로 CLAUDE.md 파일을 만들어줘.
프로젝트에 맞게 내용을 채워줘."
```

---

## 3. Git 변경 기록 자동화

### 커밋 규칙

작업이 완료될 때마다 커밋합니다. Claude Code에게 직접 요청하세요.

```
Claude Code 프롬프트:
"지금까지 변경한 내용을 커밋해줘."
```

### 커밋 메시지 형식

| 접두어 | 의미 | 예시 |
|--------|------|------|
| `feat:` | 새 기능 | `feat: 키워드 분석 페이지 추가` |
| `fix:` | 버그 수정 | `fix: 로그인 토큰 만료 처리` |
| `refactor:` | 리팩토링 | `refactor: constants.ts 통합` |
| `docs:` | 문서 수정 | `docs: CLAUDE.md 업데이트` |
| `test:` | 테스트 | `test: smoke 테스트 추가` |

### 복원 방법

무언가 잘못되었을 때:

```
Claude Code 프롬프트:
"방금 커밋한 변경을 되돌려줘." → git revert 실행

"어제 작업 내용을 보여줘." → git log 확인

"특정 파일만 이전으로 되돌려줘.
파일: src/lib/constants.ts" → git checkout으로 복원
```

### 이전 작업 확인

```bash
git log --oneline -20        # 최근 20개 커밋
git diff HEAD~1              # 마지막 변경 내용
git status                   # 현재 변경된 파일 목록
```

---

## 4. 파일 구조 원칙

### 공통 파일 vs 개별 파일

| 구분 | 위치 | 예시 |
|------|------|------|
| **공통** (여러 곳에서 사용) | `src/lib/` | constants.ts, auth-client.ts |
| **개별** (한 페이지에서만 사용) | 해당 페이지 폴더 | page.tsx 안에 정의 |
| **공통 UI** | `src/components/ui/` | Button, Card, Toast |
| **공통 훅** | `src/hooks/` | useAsyncAction.ts |
| **타입** | `src/types/` | index.ts |

### 분리 기준

- 같은 코드가 **2곳 이상**에서 사용되면 → 공통 파일로 분리
- 1곳에서만 사용되면 → 그 파일 안에 두기
- 파일이 **300줄 이상**이면 → 분리 고려

```
Claude Code 프롬프트:
"이 프로젝트에서 중복 코드를 찾아서 목록으로 보여줘.
코드 수정은 하지 말고 분석만 해줘."
```

### Next.js 권장 폴더 구조

```
src/
├── app/              ← 페이지 (라우팅)
│   ├── (dashboard)/  ← 로그인 필요한 페이지
│   ├── (auth)/       ← 로그인/회원가입
│   ├── (admin)/      ← 관리자
│   ├── (public)/     ← 비로그인 접근 가능
│   └── api/          ← API 라우트
├── components/       ← 공통 컴포넌트
│   └── ui/           ← 기본 UI (Button, Card 등)
├── hooks/            ← 커스텀 훅
├── lib/              ← 공통 유틸
│   ├── constants.ts  ← 상수 단일 출처
│   ├── auth-client.ts← 프론트 인증
│   ├── api-helpers.ts← API CRUD 헬퍼
│   └── pagination.ts ← 페이지네이션
└── types/            ← 타입 정의
    └── index.ts
```

### PHP 권장 폴더 구조

```
project/
├── public/           ← 웹 루트 (index.php)
├── src/
│   ├── Controllers/  ← 컨트롤러
│   ├── Models/       ← DB 모델
│   ├── Services/     ← 비즈니스 로직
│   └── Utils/        ← 공통 유틸
├── config/           ← 설정 파일
├── templates/        ← HTML 템플릿
└── storage/          ← 업로드/로그
```

---

## 5. Claude 에이전트 팀 구성

### Agent Teams 활성화 확인

에이전트 팀 기능을 사용하려면 환경변수가 활성화되어 있어야 합니다.

```bash
claude --version
# 버전 확인 후, settings.json에 아래가 있는지 확인:
# "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
```

비활성화된 경우 `%USERPROFILE%\.claude\settings.json` 에 추가:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 팀 구성

Claude Code의 Agent Teams 기능으로 역할별 에이전트를 사용합니다.

### PM 에이전트 (항상 유지)

```
Claude Code 프롬프트:
"PM 역할로 아래를 확인해줘:
1. CLAUDE.md가 현재 코드와 일치하는지
2. 작업이력.md에 오늘 작업이 기록되었는지
3. 변경된 파일에 연관된 다른 파일이 빠진 게 없는지"
```

### 개발 시작 팀

```
Claude Code 프롬프트:
"새 기능을 추가하기 전에:
1. UTILS_MAP.md 확인해서 재사용할 수 있는 게 있는지 알려줘
2. 프로젝트 구조에 맞는 파일 위치를 제안해줘
3. 필요한 타입/상수가 이미 있는지 확인해줘
코드 수정은 하지 말고 분석만 해줘."
```

### 개발 중 팀

```
Claude Code 프롬프트:
"[기능 설명]을 구현해줘.
조건:
- 기존 공통 유틸(auth-client, constants, api-helpers 등) 사용
- 새 상수는 constants.ts에 추가
- 하드코딩 금지
- 완료 후 npm run build 확인"
```

### 테스트 팀

```
Claude Code 프롬프트:
"변경된 페이지들의 Smoke Test를 실행해줘.
실패하면 원인 분석하고 앱 문제인지 테스트 코드 문제인지 구분해줘."
```

---

## 6. 하나 바꾸면 전체 반영 체크리스트

상세 체크리스트는 **CLAUDE.md STEP 1** 참조.
수정 시 Claude Code가 자동으로 확인합니다.

빠르게 확인하고 싶을 때:

```
Claude Code 프롬프트:
"CLAUDE.md 체크리스트 기준으로
[수정 내용]의 영향 범위를 분석해줘.
코드 수정은 하지 말고 분석만 해줘."
```

---

## 7. MCP 연동 설정 및 복원 방법

### 현재 연동된 MCP

| MCP | 용도 | 등록 방법 |
|-----|------|-----------|
| **Playwright** | 브라우저 자동 테스트 | settings.json에 등록 |
| **Figma Remote** | 디자인→코드 변환 | claude.ai 플러그인 |
| **Figma Desktop** | Figma 앱 직접 컨트롤 | Figma 앱 실행 시 자동 |
| **Notion** | 이슈/문서 관리 | claude.ai 플러그인 |
| **Gmail** | 이메일 연동 | claude.ai에서 인증 |
| **Google Calendar** | 일정 관리 | claude.ai에서 인증 |

### 백업 방법 (재설치 전에 미리 해두기)

Claude Code를 재설치하거나 PC를 바꾸기 전에 설정을 백업합니다.

- [ ] settings.json 백업
  ```bash
  copy %USERPROFILE%\.claude\settings.json %USERPROFILE%\Desktop\claude_settings_backup.json
  ```
- [ ] 백업 파일이 바탕화면에 있는지 확인

> 이 파일 하나로 자동 승인 설정, Agent Teams, MCP(Playwright) 설정이 모두 복원됩니다.
> claude.ai 플러그인(Figma, Notion)은 로그인하면 자동 복원됩니다.

### 재설치 시 복원 순서

Claude Code를 재설치했을 때:

- [ ] 1단계: settings.json 복원
  ```bash
  copy %USERPROFILE%\Desktop\claude_settings_backup.json %USERPROFILE%\.claude\settings.json
  ```
- [ ] 2단계: claude.ai 로그인 → 플러그인(Figma, Notion) 자동 복원
- [ ] 3단계: Playwright MCP 재등록
  ```bash
  claude mcp add playwright -- npx @playwright/mcp@latest
  ```
- [ ] 4단계: Figma Desktop 앱 실행 → 자동 연결
- [ ] 5단계: 연결 확인
  ```bash
  claude mcp list
  ```

### Figma + Claude Code 활용법

```
Claude Code 프롬프트:
"이 Figma URL의 디자인을 코드로 변환해줘:
[figma.com/design/xxxxx]
프로젝트의 기존 컴포넌트(Button, Card 등)를 재사용해줘."
```

```
Claude Code 프롬프트:
"이 Figma 파일에서 색상/폰트 디자인 토큰을 추출해줘.
Tailwind CSS 형식으로 변환해줘."
```

---

## 8. 테스트 체크리스트

### 사전 조건

- [ ] dev 서버 실행: `npm run dev` (터미널 1)
- [ ] `.env.test`에 테스트 계정 정보 입력

### Smoke Test (빠른 확인 — 2분)

모든 페이지가 깨지지 않았는지 빠르게 확인합니다.

```bash
npx playwright test --project=smoke
```

- [ ] 15개 페이지 로딩 확인
- [ ] 콘솔 에러 없음
- [ ] toast 동작 확인

### E2E Test (전체 플로우 — 5분)

사용자 시나리오대로 전체 흐름을 테스트합니다.

```bash
npx playwright test --project=e2e                     # 전체
npx playwright test --project=e2e --grep "happy-path"  # 핵심 플로우
npx playwright test --project=e2e --grep "Guard"       # 접근 제어
npx playwright test --project=e2e --grep "Edit"        # 수정/삭제
npx playwright test --project=e2e --grep "Empty"       # 빈 상태
```

### Mobile Test (모바일 확인 — 3분)

iPhone / Galaxy에서 레이아웃과 터치가 정상인지 확인합니다.

```bash
npx playwright test --project=mobile-iphone --project=mobile-galaxy
```

- [ ] 레이아웃 깨짐 없음
- [ ] 햄버거 메뉴 동작
- [ ] 터치 영역 44px 이상
- [ ] 수평 스크롤 없음

### Rate Limit 방지

테스트가 로그인을 반복하면 Rate Limit에 걸립니다.
`storageState`로 세션을 1번만 저장하고 재사용합니다 (이미 설정됨).

### FIXME 관리

`test.fixme()`로 표시된 테스트는 앱 수정 후 제거합니다.

```
Claude Code 프롬프트:
"테스트에서 fixme로 표시된 항목을 보여줘.
각 항목의 실패 원인도 알려줘."
```

### 배포 전 필수 테스트 순서

- [ ] 1. `npm run build` — 빌드 성공
- [ ] 2. `npx playwright test --project=smoke` — 페이지 깨짐 없음
- [ ] 3. `npx playwright test --project=e2e` — 핵심 플로우 정상
- [ ] 4. `npx playwright test --project=mobile-iphone` — 모바일 정상

### 전체 실행

```bash
npx playwright test              # 전체 (smoke + e2e + mobile)
npx playwright test --headed     # 브라우저 보면서
npx playwright show-report       # HTML 결과 리포트
```

---

## 9. 배포 체크리스트

### Railway 배포 (추천: 풀스택)

Next.js + API + DB를 한곳에서 관리할 때 사용합니다.

- [ ] `npm run build` 성공 확인
- [ ] 테스트 통과 확인
- [ ] 환경변수 Railway에 등록 확인
  ```bash
  railway variables
  ```
- [ ] DB 마이그레이션 적용 확인
- [ ] 배포 실행
  ```bash
  railway up
  ```
- [ ] 배포 후 사이트 접속 확인

### Netlify 배포 (추천: 정적 사이트)

랜딩 페이지, 블로그 등 정적 사이트에 사용합니다.

- [ ] `npm run build` 성공 확인
- [ ] 배포 실행
  ```bash
  netlify deploy --prod
  ```

### 환경별 체크

| 환경 | 확인 사항 |
|------|-----------|
| **개발** | `.env.local` 사용, localhost |
| **스테이징** | `.env.staging`, Railway preview |
| **운영** | `.env.production`, 도메인 연결 |

### 배포 전 최종 확인

```
Claude Code 프롬프트:
"배포 전 체크리스트를 실행해줘:
1. npm run build 성공 확인
2. Smoke Test 실행
3. 환경변수 누락 확인
4. DB 마이그레이션 상태 확인"
```

---

## 10. 이슈별 대응 체크리스트

### 페이지 깨짐 발생 시

- [ ] 어떤 페이지인지 URL 확인
- [ ] 콘솔 에러 메시지 확인 (F12 → Console)
- [ ] 최근 변경 커밋 확인

```
Claude Code 프롬프트:
"[URL] 페이지가 깨졌어.
최근 변경된 파일 중에 이 페이지에 영향을 주는 게 있는지 찾아줘.
콘솔 에러: [에러 메시지]"
```

### API 오류 발생 시

- [ ] 어떤 API인지 확인 (Network 탭)
- [ ] 응답 코드 확인 (400, 401, 500 등)
- [ ] 요청 body 확인

```
Claude Code 프롬프트:
"API [엔드포인트]에서 [에러코드] 오류가 발생해.
이 API의 코드를 확인하고 원인을 분석해줘.
코드 수정은 하지 말고 원인만 알려줘."
```

### DB 오류 발생 시

- [ ] 에러 메시지에서 테이블/컬럼명 확인
- [ ] 마이그레이션 적용 여부 확인

```
Claude Code 프롬프트:
"DB에서 [에러 메시지] 오류가 발생해.
마이그레이션 파일과 실제 DB 스키마를 비교해줘."
```

### 빌드 실패 시

- [ ] 에러 메시지에서 파일명/줄번호 확인
- [ ] TypeScript 타입 에러인지 확인

```
Claude Code 프롬프트:
"npm run build가 실패해.
에러: [에러 메시지]
이 파일을 확인하고 수정해줘."
```

### 테스트 실패 시

앱 문제인지 테스트 코드 문제인지 먼저 구분합니다.

```
Claude Code 프롬프트:
"테스트가 실패했어.
test-results/ 폴더의 스크린샷을 확인하고
앱 문제인지 테스트 코드 문제인지 구분해줘.
앱 문제면 수정하고, 테스트 코드 문제면 locator를 수정해줘."
```

### 중복 코드 발견 시

```
Claude Code 프롬프트:
"코드 수정 없이 분석만 해줘.
프로젝트에서 중복 코드를 찾아서 목록으로 보여줘.
파일명과 줄 번호 포함해서."
```

### Claude Code 재설치 후 복원 시

- [ ] 1. settings.json 백업 파일 복원
  ```bash
  copy %USERPROFILE%\Desktop\claude_settings_backup.json %USERPROFILE%\.claude\settings.json
  ```
- [ ] 2. claude.ai 로그인 (Figma, Notion 플러그인 자동 복원)
- [ ] 3. Playwright MCP 재등록
  ```bash
  claude mcp add playwright -- npx @playwright/mcp@latest
  ```
- [ ] 4. Figma Desktop 실행
- [ ] 5. 확인
  ```bash
  claude mcp list
  ```
- [ ] 6. 프로젝트 폴더에서 Claude Code 시작 → CLAUDE.md 자동 로드 확인

---

## 부록: 자주 쓰는 명령어

### 개발

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
```

### Git

```bash
git status           # 변경 파일 확인
git log --oneline -10 # 최근 커밋 10개
git diff             # 변경 내용 확인
```

### GitHub

```bash
gh pr create         # PR 생성
gh pr list           # PR 목록
gh issue list        # 이슈 목록
```

### 테스트

```bash
npx playwright test --project=smoke    # 빠른 확인
npx playwright test --project=e2e      # 전체 플로우
npx playwright test --headed           # 브라우저 보면서
npx playwright show-report             # 결과 리포트
```

### 배포

```bash
railway up           # Railway 배포
netlify deploy --prod # Netlify 배포
```

### MCP

```bash
claude mcp list      # MCP 연결 상태 확인
```

### 터널링 (외부에서 로컬 접속)

```bash
ngrok http 3000      # localhost:3000을 외부에서 접속 가능하게
```
