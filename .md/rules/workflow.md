# Workflow — 작업 시작 전 필수 절차

## 4단계 (모든 작업)

### STEP 1 — 영향 분석 (수정 전)
1. `.md/설계문서/수정위험도.md` — 🔴🟡🟢 등급 확인
2. `.md/설계문서/의존성맵.md` — 영향 범위 파악
3. `node scripts/impact-analyzer.mjs <file>` — AST 기반 caller 추적
4. Co-update Map 패턴 매칭 (`.md/co-update/patterns.md`)
5. 관련 체크리스트 항목 확인 (`.md/rules/checklists.md`)

### STEP 2 — 보고 (승인 대기)
```
🔴/🟡/🟢 등급:
수정 파일:
영향 파일:
확인 필요:
수정 순서:
Co-update 매칭 패턴:
```

⚠️ STEP 2 완료 후 **반드시 승인 대기**. 승인 전 코드 수정 금지.

### STEP 3 — 수정
- 3개 파일씩 배치로 나눠서 처리
- 완료마다 보고
- 병렬 처리 금지

### STEP 4 — 검증 (Ralph Loop)
```
[1/3] npx tsc --noEmit
[2/3] npm run build
[3/3] npx playwright test --project=smoke  (UI 변경이면)
```

UI 변경이면 추가:
- playwright browser_navigate → browser_take_screenshot (after)
- before/after 비교 보고
- 의도와 다르면 즉시 보고 (덮어쓰기 금지)

---

## 🚨 꼬였을 때 복구 절차

1. 코드 수정 즉시 중단
2. `git status` → 변경 파일 확인
3. `git diff` → 무엇이 바뀌었는지 확인
4. 사용자 판단 후 선택:
   - `git checkout -- <file>` — 특정 파일만 되돌리기
   - `git stash` — 임시 저장
   - `git reset --hard HEAD` — 전체 복구 (마지막 수단)
5. 원인 파악 후 STEP 1부터 재시작

---

## 💬 에러 보고 형식

```
에러 위치: [파일명, 줄 번호]
에러 원인: [한 줄 요약]
해결 방법: [하나만]
영향 파일: [목록]
```

여러 에러는 하나씩 순서대로. 원인 파악 전 코드 수정 금지.

---

## 🔄 대화 리셋 기준

- 같은 에러 3번 이상 반복
- 대화 20턴 이상
- 사용자가 "새로 시작하자"고 할 때
