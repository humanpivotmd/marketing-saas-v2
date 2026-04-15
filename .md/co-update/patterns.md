# Co-update Patterns — Forward Propagation Rules

> **목적**: 새 기능을 추가할 때 "이것도 같이 해야 하지 않나?" 자동 체크용 일반 규칙.
> **사용**: `@designer` 에이전트가 spec 보고서 작성 시 매칭하여 보고서에 자동 포함.
> **사례**: 구체적인 과거 사례는 `cases.md` 참조 (학습 데이터).
> **유지보수**: 새 패턴은 사용자(도메인 전문가)가 추가. 자동 추출은 `pattern-extractor.mjs` 사용.

---

## 사용 방법

1. 사용자가 새 기능 요청 → `@designer` 호출
2. designer가 이 파일에서 매칭되는 패턴 검색 (여러 패턴 동시 매칭 가능)
3. 매칭된 행의 "같이 확인" 항목 전부를 spec 보고서에 포함
4. 각 항목에 **필요/불필요/사용자 결정** 답변 요구
5. 사용자 승인 후에만 다음 단계 진행
6. designer는 추가로 `cases.md`에서 유사 사례 N건 검색 → 보고서에 표시

---

## 패턴 1: 새 admin 액션 추가
**트리거**: `src/app/api/admin/users/[id]/<액션이름>/route.ts` 신규

| 같이 확인할 곳 | 왜 |
|---|---|
| `supabase/migrations/006_add_action_logs.sql` (또는 후속 migration) | `action` CHECK constraint에 새 액션 이름 추가 필요 |
| `src/app/api/admin/users/[id]/<액션>/route.ts` 내부 | `action_logs` 테이블에 로그 기록 추가 |
| `src/app/(admin)/admin/users/components/UserDetailModal.tsx` | UI 액션 버튼 추가 |
| `src/app/(admin)/admin/action-logs/page.tsx` (있다면) | 액션 라벨/필터 옵션 추가 |
| `src/lib/notifications.ts` 또는 이메일 발송 | 사용자 알림 필요 여부 |

---

## 패턴 2: 새 사용자 role 추가
**트리거**: `users.role` CHECK constraint 변경 또는 새 role 값 사용

| 같이 확인할 곳 | 왜 |
|---|---|
| `supabase/migrations/` 새 migration | `users_role_check` constraint 업데이트 |
| `src/lib/auth.ts` `requireAdmin` / `requireSuperAdmin` | 새 role의 권한 정의 |
| `src/lib/constants.ts` `ROLE_LABELS` (또는 같은 역할의 상수) | UI 표시 라벨 |
| `src/app/(admin)/admin/users/components/UserDetailModal.tsx` | role 변경 dropdown 옵션 |
| `src/app/(admin)/admin/users/page.tsx` | 필터 dropdown 옵션 |
| RLS 정책 (있다면) | 새 role의 접근 권한 |

---

## 패턴 3: 새 generate API 추가
**트리거**: `src/app/api/generate/<이름>/route.ts` 신규

| 같이 확인할 곳 | 왜 |
|---|---|
| `src/lib/claude-parser.ts` | 응답 검증용 새 Zod 스키마 추가 |
| `src/lib/pipeline-guard.ts` (해당되면) | `StepKey` type에 새 키 추가 + step_status 핸들링 |
| `supabase/migrations/003_v3_pipeline.sql` 의 `step_status` 기본값 | 새 step 키 기본값 (혹은 후속 migration) |
| `src/app/(dashboard)/create/<단계>/page.tsx` | 프론트엔드에서 새 API 호출 |
| `usage_logs` `action_type` (`src/lib/usage.ts`) | 사용량 추적 항목 추가 |
| `src/lib/rate-limit.ts` | rate limit 적용 |
| `src/lib/sanitize.ts` 호출 | user 입력 살균 |
| `src/lib/prompts/pipeline.ts` (🔴) | 새 system prompt 추가 |
| `CLAUDE.md` `Claude 출력 검증 규칙` 섹션의 표 | 적용 위치 표 업데이트 |

---

## 패턴 4: 새 콘텐츠 채널 추가
**트리거**: `src/lib/constants.ts` `CHANNEL_OPTIONS` / `CONTENT_CREATE_CHANNELS` 변경

| 같이 확인할 곳 | 왜 |
|---|---|
| `CHANNEL_LABEL_MAP` (constants) | 한글 라벨 |
| `CHANNEL_COLOR_MAP` (constants) | UI 뱃지 색상 |
| `CHANNEL_DOT_MAP` (constants, 있다면) | 작은 인디케이터 |
| `contents` 테이블 `channel` 컬럼 CHECK constraint | DB 검증 |
| `src/lib/prompts/pipeline.ts` (🔴) | 채널별 프롬프트 |
| `src/app/(dashboard)/create/channel-write/page.tsx` | UI 채널 선택 |
| `src/app/(dashboard)/create/draft-info/page.tsx` | draft-info 채널 선택 카드 |

---

## 패턴 5: 새 사용자 상태 추가
**트리거**: `users.status` 새 값 (`active`/`pending`/`suspended` 외)

| 같이 확인할 곳 | 왜 |
|---|---|
| `supabase/migrations/` | `users_status_check` constraint |
| `src/lib/constants.ts` `STATUS_LABELS` | UI 라벨 |
| `src/lib/auth.ts` 로그인 차단 로직 | suspended 패턴 따라 처리 |
| `src/app/(admin)/admin/users/page.tsx` | 필터 옵션 |
| `src/app/(admin)/admin/users/components/UserDetailModal.tsx` | 상태 변경 dropdown |
| `src/middleware.ts` (있다면) | 라우팅 가드 |

---

## 패턴 6: 새 DB 테이블 추가
**트리거**: `supabase/migrations/` 신규 `CREATE TABLE`

| 같이 확인할 곳 | 왜 |
|---|---|
| `src/types/index.ts` (🔴) | TypeScript 타입 추가 |
| RLS 정책 | 적절한 USING 절 |
| `src/lib/api-helpers.ts` | CRUD 헬퍼 적용 가능 여부 |
| 인덱스 | 자주 조회되는 컬럼 |
| `.md/설계문서/DB스키마.md` | 문서 업데이트 |

---

## 패턴 7: 새 환경 변수 추가
**트리거**: 코드에서 `process.env.NEW_VAR` 사용

| 같이 확인할 곳 | 왜 |
|---|---|
| `.env.local` | 로컬 개발용 값 |
| `.env.example` (있다면) | 다른 개발자용 placeholder |
| `API_KEYS_BACKUP.md` (`F:/marketing -app/`) | 백업 |
| Railway dashboard | 프로덕션 배포 |
| `next.config.ts` `env` 노출 (필요시) | 클라이언트 사이드 접근 |
| `NEXT_PUBLIC_` 접두사 (클라이언트 변수면) | 클라이언트 번들에 포함 |

---

## 패턴 8: 새 콘텐츠 생성 진입점 (만들기 버튼) 추가
**트리거**: "콘텐츠 만들기 버튼 추가" / 어디서든 `/contents/new` 또는 `/create/...`로 가는 새 버튼·링크 / 진입점에 새 옵션(채널/단계 등) 추가

| 같이 확인할 곳 | 왜 |
|---|---|
| `projects` 테이블 row 생성 로직 | `settings_snapshot`, `current_step`, `step_status`, `keyword_id` 채워야 함 |
| `src/app/(dashboard)/contents/page.tsx` | 새 row가 목록에 표시되는지 |
| `channelStatuses` / `channel_statuses` 계산 로직 | 채널별 ✅❌ 표시 |
| `has_video` / `has_image` 필드 | 영상/이미지 칸 표시 |
| `src/app/(dashboard)/contents/[id]/page.tsx` | 클릭 시 상세 페이지 도달 |
| `src/components/FlowGuard.tsx` `requiredStep` prop | 진입 시점에 맞는 step 가드 |
| `useBusinessProfile` 훅 | 비즈니스 프로필 없으면 `SetupRequired` 노출 |
| 권한·로그인 체크 | `requireAuth` |
| **`src/app/(dashboard)/create/layout.tsx` `STEPS` 배열** | **진행 바에 새 step 노출 (영상 등 추가 단계 포함)** |
| **새 채널·옵션이 별도 단계를 트리거하면 패턴 9도 같이 매칭** | **단계 변경 영향까지 cross-check** |

> **관련 사례**: cases.md의 #001, #003 참조

---

## 패턴 9: 파이프라인 단계 추가/제거/순서 변경
**트리거**: "STEP N 빼라" / "STEP 추가해줘" / 파이프라인 순서 바꾸기

| 같이 확인할 곳 | 왜 |
|---|---|
| `supabase/migrations/003_v3_pipeline.sql` `step_status` 기본값 | DB 스키마 정합성 (또는 후속 migration) |
| `current_step` CHECK constraint (`BETWEEN 1 AND 7`) | 범위 변경 필요할 수 있음 |
| `src/lib/pipeline-guard.ts` `StepKey` type (`'s5' \| 's6' \| 's7'`) | TypeScript 타입 |
| `src/components/FlowGuard.tsx` `requiredStep` prop 사용처 전부 | 라우팅 가드 |
| `src/app/(dashboard)/create/draft-info/page.tsx` | 진행률 표시 + 다음 버튼 |
| `src/app/(dashboard)/create/channel-write/page.tsx` | 동일 |
| `src/app/(dashboard)/create/image-script/page.tsx` | 동일 |
| `src/app/(dashboard)/create/video-script/page.tsx` | 동일 |
| `src/app/(dashboard)/create/generating/page.tsx` | 동일 |
| `src/app/(dashboard)/create/layout.tsx` `STEPS` 배열 | 진행 바 |
| `src/app/(dashboard)/contents/page.tsx` 채널 상태 계산 | `current_step >= 5` 같은 의존 로직 |
| `src/app/api/generate/draft/route.ts` | step 매핑 |
| `src/app/api/generate/pipeline/route.ts` | s5 매핑 |
| `src/app/api/generate/image-script/route.ts` | s6 매핑 |
| `src/app/api/generate/video-script/route.ts` | s7 매핑 |
| `STEP_LABELS` 상수 (있다면) | UI 라벨 |
| 진행률 % 계산 (`current_step / 7 * 100` 같은 것) | 분모 변경 |

**⚠️ 추가 권고**: 단순 UI에서 STEP 텍스트를 빼는 것과 **실제 데이터 흐름에서 STEP을 빼는 것**은 다른 작업입니다. designer는 사용자에게 둘 중 어느 것인지 명확히 물어야 합니다.

> **관련 사례**: cases.md의 #002 참조

---

## 패턴 10: 새 폼 (form) 추가
**트리거**: 사용자 입력을 받는 새 `<form>` 또는 입력 필드 묶음

| 같이 확인할 곳 | 왜 |
|---|---|
| `src/lib/validations.ts` | Zod 스키마 추가 |
| `src/hooks/useAsyncAction.ts` 사용 | 로딩/에러/토스트 통합 처리 |
| `src/lib/sanitize.ts` `sanitizeInput()` | 사용자 입력 살균 (XSS/주입 방지) |
| `src/lib/auth-client.ts` `authHeaders()` | API 호출 시 인증 |
| 성공 토스트 / 실패 토스트 | UX 일관성 |
| 제출 버튼 disabled 상태 | 중복 제출 방지 |
| 모바일 터치 영역 44px 이상 | 접근성 |
| 필수값 표시 (`aria-required`) | 접근성 |
| 에러 메시지 위치 (`aria-describedby`) | 접근성 |

---

## 패턴 11: 새 dashboard 페이지 추가
**트리거**: `src/app/(dashboard)/<이름>/page.tsx` 신규

| 같이 확인할 곳 | 왜 |
|---|---|
| `src/app/(dashboard)/layout.tsx` 사이드바 메뉴 | 네비게이션에 노출 |
| `src/components/FlowGuard.tsx` (파이프라인 페이지면) | step 가드 적용 |
| 200줄 제한 (Code Conventions) | 신규 파일은 200줄 이하 |
| `src/app/(dashboard)/<이름>/loading.tsx` | 로딩 UI (필요시) |
| `src/app/(dashboard)/<이름>/error.tsx` | 에러 바운더리 (필요시) |
| 빈 상태(empty state) UI | 데이터 없을 때 표시 |
| 모바일 레이아웃 | 좁은 화면 대응 |
| `metadata` export | SEO + 탭 제목 |
| 로그인 가드 | `requireAuth` 또는 미들웨어 |

---

## 패턴 12: `projects.settings_snapshot` JSONB 구조 변경
**트리거**: `settings_snapshot`에 새 필드 추가 / 기존 필드 이름 변경 / 제거

> **🔴 위험**: 이 컬럼은 기존 프로젝트와의 호환성이 깨질 수 있음. CLAUDE.md 위험 파일 목록에 있음.

| 같이 확인할 곳 | 왜 |
|---|---|
| `src/types/index.ts` (🔴) | TypeScript 타입 정의 |
| `src/app/(dashboard)/create/draft-info/page.tsx` | snapshot 생성 시점 |
| `src/app/(dashboard)/contents/page.tsx` | snapshot 읽기 (`proj.settings_snapshot?.selected_channels` 등) |
| `src/app/api/generate/pipeline/route.ts` | snapshot 사용 |
| 기존 row 마이그레이션 | NULL 또는 기존 값 처리 |
| 폴백 코드 (`?.field || default`) | 옛 row 호환 |
| `.md/설계문서/DB스키마.md` | 문서 업데이트 |

---

## 📝 새 패턴 추가 방법

본인이 작업하다가 "아 이거 다음에도 있을 패턴인데" 싶으면 위 표 형식대로 추가:

```markdown
## 패턴 N: <패턴 이름>
**트리거**: <어떤 변경이 트리거인지>

| 같이 확인할 곳 | 왜 |
|---|---|
| ... | ... |

> **관련 사례**: cases.md의 #NNN 참조 (있다면)
```

또는 `cases.md`에 사례를 충분히 기록한 후 `pattern-extractor.mjs` 실행:
```bash
node "F:/marketing -app/agent-dev-kit/scripts/pattern-extractor.mjs" \
  --cases ".md/co-update/cases.md"
```
3건 이상 누적된 같은 카테고리의 사례를 자동으로 패턴 보강 후보로 제안.

도메인 지식은 본인이 가장 정확합니다. AI는 패턴을 모방하지만 **새 패턴을 발견하는 건 본인의 경험**입니다.
