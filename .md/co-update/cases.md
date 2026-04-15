# Co-update Cases — 학습용 사례 로그

> **목적**: 사용자가 "이거 빠졌어"라고 발견한 forward propagation 실패 사례 누적.
> **자동 수집**: `case-logger.mjs` 스크립트 또는 designer가 매번 호출.
> **학습**: 같은 카테고리에 3건 이상 누적되면 `pattern-extractor.mjs`가 패턴 보강 제안.
> **검토 주기**: 월 1회 또는 사용자 명령 시.

---

## 사례 형식

```markdown
## Case NNN — YYYY-MM-DD — <한 줄 제목>
- **트리거**: <어떤 작업이었나>
- **누락**: <무엇이 빠졌나>
- **발견 경로**: <사용자 직접 / playwright / build 에러 등>
- **매칭된 패턴**: <patterns.md의 패턴 번호 또는 "매칭 안 됨">
- **추가됐어야 할 패턴**: <크로스 매칭이 필요했던 다른 패턴>
- **해결 커밋**: <git sha>
- **재발 방지**: <시스템에 어떻게 박혔나>
- **카테고리**: <분류 태그>
```

---

## Case 001 — 2026-04-15 — draft-info에 영상 옵션 추가했지만 layout.tsx STEPS 빠짐
- **트리거**: 진입점(`/create/draft-info`)에 채널 옵션(영상 포함) 추가
- **누락**: `src/app/(dashboard)/create/layout.tsx`의 `STEPS` 배열에 영상 step 없음
- **발견 경로**: 사용자가 화면에서 진행 바 보고 "영상 없음" 발견 → 스크린샷 첨부
- **매칭된 패턴**: 8 (콘텐츠 진입점)
- **추가됐어야 할 패턴**: 9 (파이프라인 단계) cross-match
- **해결 커밋**: `390fa6f` (layout.tsx STEPS에 영상 스크립트 추가) + `0f88526` (패턴 8 보강)
- **재발 방지**: 패턴 8에 layout.tsx 항목 추가 + "패턴 9 cross-match" 명시
- **카테고리**: `entry-point`, `pipeline-step`, `ui-flow`

---

## Case 002 — 2026-04-15 — channel-write에서 영상 진입 막힘 (모든 채널 컨펌+이미지 강제)
- **트리거**: 글 컨펌 후 영상 단계로 이동 시도
- **누락**: 5가지 사용자 시나리오 중 4가지 미지원 (`allChannelsDone` 게이트)
- **발견 경로**: 사용자가 channel-write 진입 → "영상 만들기" 버튼 안 보임 → 스크린샷
- **매칭된 패턴**: 9 (파이프라인 단계)
- **추가됐어야 할 패턴**: 새 패턴 후보 — "단계 진입 게이트"
- **해결 커밋**: `6c33bbd` (always-active 버튼 + 인라인 상태) + `6b08ef2` (제품팀 4 에이전트 추가)
- **재발 방지**: 제품팀 6 에이전트가 다음 비슷한 결정 시 자동 토론
- **카테고리**: `pipeline-step`, `entry-point`

---

## Case 003 — 2026-04-15 — /contents/new 데드 페이지 + draft-info 채널 선택 누락
- **트리거**: /keywords의 "콘텐츠 생성" 버튼이 새 진입점(/create/draft-info)으로 이동
- **누락**: 옛 진입점(/contents/new)에 있던 채널 선택 UI를 새 진입점에 옮기지 않음. 옛 진입점은 데드 코드(어디서도 링크 안 됨).
- **발견 경로**: 사용자 며칠 동안 반복적으로 "영상 옵션 사라졌어" 발견
- **매칭된 패턴**: 8 (진입점 추가)
- **추가됐어야 할 패턴**: "옛 진입점 → 새 진입점 마이그레이션 시 옛 기능 전부 옮겼는지"
- **해결 커밋**: `2efa3cf` (draft-info에 채널 선택 추가 + contents/new 삭제)
- **재발 방지**: 패턴 8 트리거에 "진입점에 새 옵션 추가" 명시
- **카테고리**: `entry-point`, `dead-code`, `legacy-debt`

---

## Case 004 — 2026-04-15 — channel-write contents 중복 row → React key 에러
- **트리거**: `contents.map(c => key={c.channel})` 매핑 + DB에 중복 row
- **누락**: pipeline route가 미컨펌 contents를 cleanup하지 않음 → 누적
- **발견 경로**: 사용자 콘솔 에러 + 화면에 채널 탭 두 번씩 표시
- **매칭된 패턴**: 매칭 안 됨 (런타임 데이터 정합성 — 패턴화 안 됨)
- **추가됐어야 할 패턴**: 새 패턴 후보 — "리스트 렌더링 + 데이터 dedup"
- **해결 커밋**: `7334f05` (frontend dedup hot fix) + `eb25092` (pipeline cleanup)
- **재발 방지**: pipeline route 시작 시 미컨펌 row DELETE
- **카테고리**: `data-integrity`

---

## Case 005 — 2026-04-15 — image-script(STEP6) 페이지가 빈 redirect로 비어있음
- **트리거**: 설계 문서엔 STEP6가 있지만 실제 코드는 빈 redirect (16줄)
- **누락**: 설계와 코드 정합성 — 설계 문서가 거짓말
- **발견 경로**: draft-info 영상 누락 추적 중 발견
- **매칭된 패턴**: 매칭 안 됨 (구조적 부채)
- **추가됐어야 할 패턴**: 새 패턴 후보 — "설계 문서 vs 코드 정합성 정기 점검"
- **해결 커밋**: 미해결 (별도 작업 필요)
- **재발 방지**: 패턴 9의 image-script/page.tsx 항목에 "현재 빈 redirect" 주석 (TODO)
- **카테고리**: `legacy-debt`

---

---


## 📊 카테고리별 빈도 (자동 집계)

```
entry-point          : 3건
pipeline-step        : 2건
legacy-debt          : 2건
ui-flow              : 1건
dead-code            : 1건
data-integrity       : 1건
```

> **임계값 도달**: `entry-point` 3건 — `pattern-extractor.mjs` 실행 권장.

3건 이상 누적된 카테고리는 패턴 추가/보강 후보. `pattern-extractor.mjs`가 자동 추출.

---

## 🔄 새 사례 추가 방법

### 자동 (권장)
```bash
node "F:/marketing -app/agent-dev-kit/scripts/case-logger.mjs" \
  "draft-info에 영상 옵션 추가했지만 layout.tsx STEPS 빠짐" \
  --pattern=8 \
  --commit=390fa6f \
  --category=entry-point
```
→ 이 파일에 자동 append.

### 수동
위의 사례 형식 그대로 복사 + 채워넣기. 번호는 마지막 사례 +1.

### 임계값 알림
같은 카테고리에 3건 누적되면 `pattern-extractor.mjs`가 다음에 호출될 때 경고:
```
⚠️ 'entry-point' 카테고리에 3건 누적됨. 패턴 추가 검토 권장:
   - Case #002, #N, #M의 공통점: ...
   - 제안 트리거: ...
   - 제안 항목: ...
```
사용자가 검토 후 `patterns.md`에 직접 추가.
