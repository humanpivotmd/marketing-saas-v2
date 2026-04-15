# Active Rules — 매 프롬프트 자동 주입

> 이 파일은 `user-prompt-submit.sh` hook이 매 프롬프트마다 읽어서
> `additionalContext`로 주입. 짧게 유지 (≤15줄).

- 3-file batch 한도 — 한 번에 3개 초과 파일 수정 금지
- Build 통과 ≠ 완료 — UI 변경은 playwright before/after 스크린샷 필수
- 수정 전 impact-analyzer 실행 (🔴 파일은 반드시 승인 대기)
- Co-update 패턴은 여러 개 동시 매칭 가능 — 넓게 검색
- "못 한다"고 말하기 전 ToolSearch로 도구 확인
- 사용자 승인 없이 코드 수정 금지 — "진행해"/"OK" 대기
- 요청하지 않은 파일 생성·기능 추가 금지
- contents 테이블은 `channel`/`metadata` 컬럼 (type/hashtags 금지)
