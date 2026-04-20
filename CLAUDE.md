# CLAUDE.md — 작업 지침 (index)

> 이 파일은 **인덱스**입니다. 상세 규칙은 `.md/rules/*.md`로 분리되어 있고,
> ADK `user-prompt-submit.sh` hook이 매 프롬프트마다 핵심 규칙을 자동 주입합니다.

---

## 🤖 AI 행동 규칙

모든 응답은 다음을 따릅니다: **[AI-BEHAVIOR.md](../agent-dev-kit/AI-BEHAVIOR.md)**

핵심 5가지:
1. **"못 한다"고 거짓말 금지** — ToolSearch 먼저, 시도 먼저, 거절은 마지막
2. **화면 변경은 playwright 검증 의무** — before/after 스크린샷 비교
3. **작업 완료 6단계 게이트** — build 통과만으로는 완료 아님
4. **Co-update Map 패턴 매칭은 넓게** — 한 작업 = 여러 패턴 동시 매칭
5. **사용자 시간 존중** — 묻기 전에 3가지 시도

위반 시 사용자가 "**AI-BEHAVIOR.md 읽고 다시 답해**" 한 마디로 교정.

---

## 🏢 에이전시팀 운영 규칙

**모든 작업에 총괄(@product-manager)을 소환한다.** 예외 없음.

### 소환 원칙
1. **총괄은 항상 나와야 한다** — 매 단계 시작 시 총괄 소환. 내가 대신 요약/질문/추천 금지
2. **제품 결정은 팀이 한다** — 1파일 1글자라도 제품 의미가 바뀌면 팀 소환 (단순 버그 fix만 예외)
3. **팀은 추천을 낸다** — Q1/Q2/Q3식 선택지 나열 금지. 총괄이 종합 추천안 1개 제시, 사용자는 승인/거부만
4. **이름표 필수** — [총괄]/[디자이너]/[구현]/[검증] 이름표로 발언자 구분. 오케스트레이터(나)는 이름표 없이

### ADK Skill별 소환 매트릭스

| Skill | 필수 소환 | 조건부 소환 |
|-------|----------|-----------|
| `/spec` | `@designer` | UX 포함 시 `@ux-designer`+`@product-planner`+`@frontend-dev` |
| `/plan` | 총괄 검토 | 복잡한 의존성 시 `@checker` |
| `/build` | `@implementer` | 없음 |
| `/test` | `@test-runner` | 없음 |
| `/review` | `@verifier` → `@code-reviewer`+`@test-runner`+`@security-scanner` 병렬 | 없음 |

### 엄격 체크
- Skill 호출 후 첫 행동은 반드시 **Agent tool 호출**. Read/Edit/Bash 먼저 나오면 잘못된 경로
- 진단까지는 혼자 가능. **"이렇게 고치자" 단계에서는 팀 소환**
- 내가 "옵션 A/B/C" 제시하고 싶어지면 → 그 순간 멈추고 팀 소환

---

## ⚠️ 모든 작업 시작 전

1. hook이 주입한 active rules 확인 (자동)
2. 🔴 위험 파일이면 즉시 알림 후 승인 대기
3. `impact-analyzer.mjs` 실행 (수정 대상 파일)
4. Co-update Map 패턴 매칭 (`.md/co-update/patterns.md`)
5. 사용자 승인 없이 코드 수정 절대 금지

상세: [.md/rules/workflow.md](.md/rules/workflow.md)

---

## 📚 규칙 파일 맵

| 파일 | 내용 | 언제 읽나 |
|------|------|----------|
| [.md/rules/active.md](.md/rules/active.md) | 핵심 10줄 | hook이 자동 주입 |
| [.md/rules/danger-files.md](.md/rules/danger-files.md) | 🔴 수정 금지 파일 목록 | hook이 자동 주입 |
| [.md/rules/workflow.md](.md/rules/workflow.md) | STEP 1~4 + 복구 + 에러 보고 | 작업 시작 전 |
| [.md/rules/checklists.md](.md/rules/checklists.md) | 유형별 체크리스트 (UI/폼/API/DB) | 해당 유형 작업 시 |
| [.md/rules/code-conventions.md](.md/rules/code-conventions.md) | 파일 크기·공통화·부채 리스트 | 신규 파일 작성 시 |
| [.md/rules/adk-patterns.md](.md/rules/adk-patterns.md) | parseClaudeJson, preventDuplicateStep, 프롬프트 분리 | generate API 작업 시 |
| [.md/rules/utilities-map.md](.md/rules/utilities-map.md) | 공통 유틸 맵 (14개) | 중복 로직 피할 때 |
| [.md/co-update/patterns.md](.md/co-update/patterns.md) | 전방 영향 패턴 12개 | @designer 매번 |
| [.md/co-update/cases.md](.md/co-update/cases.md) | 학습 사례 누적 | 패턴 추출 시 |
| [Agent-Skills.md](Agent-Skills.md) | /spec → /plan → /build → /test → /review → /ship | ADK 워크플로우 |
| `src/lib/swagger/openapi.ts` | OpenAPI 3.0 스펙 (75개 API) | API route 추가·수정 시 |

---

## ⛔ 절대 금지

- 사용자 "진행해"/"OK" 전 코드 수정
- 요청하지 않은 파일 생성·기능 추가
- 한 번에 3개 초과 파일 수정
- 라이브러리/패키지 새로 설치 (승인 없이)
- 함수 이름 변경과 로직 변경 동시
- 상수 이름 변경 시 grep 확인 없이 수정
- 에러 여러 개 한꺼번에 고치기
- "이 파일도 수정하면 좋을 것 같습니다" 승인 없이 진행

---

## 프로젝트 개요

- **MarketingFlow**: Next.js 16 + Supabase + Claude API 마케팅 SaaS
- **문서**: `.md/INDEX.md` 참조
- **API**: 75개 Route Handler — [Swagger UI](/api-docs) | [OpenAPI JSON](/api/openapi)
- **DB**: 21개 테이블, 마이그레이션 12개 (001~012)
- **AI 모델**: `claude-sonnet-4-20250514`
- **배포**: Railway (`next start`, 표준 모드 — standalone 아님)

## 빌드/실행

```bash
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 (tsc 포함)
```

## 📖 API 문서 (Swagger)

- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI JSON**: `http://localhost:3000/api/openapi`
- **Spec 소스**: `src/lib/swagger/openapi.ts`
- API 추가/수정 시 반드시 `openapi.ts`의 paths에도 반영할 것

---

## 🔄 Co-update Map 요약

> **전방 영향 검증** (학습형). 상세는 `.md/co-update/` 참조.

- `.md/co-update/patterns.md` — 패턴 12개
- `.md/co-update/cases.md` — 학습 사례 누적 (표준 11 카테고리)
- 3건 임계값 도달 시 `pattern-extractor.mjs`로 보강 제안
- 사용법: `@designer` 호출 시 자동으로 매칭

---

## 나중에 할 것

- projects/route.ts 페이지네이션을 `paginatedResponse`로 통일
- settings/page.tsx 탭별 컴포넌트 분리 + useAsyncAction
- keywords/page.tsx, keywords/[id]/page.tsx visible 패턴 정리
- Redis Rate Limit 전환 (현재 인메모리 Map)
- 토스페이먼츠 실제 결제 연동
