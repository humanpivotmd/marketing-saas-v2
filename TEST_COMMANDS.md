# 테스트 실행 명령어

## 사전 조건
1. npm run dev (터미널 1)
2. .env.test 에 TEST_EMAIL, TEST_PASSWORD 입력

## Smoke Test (빠른 확인)
npx playwright test --project=smoke

## E2E Test
npx playwright test --project=e2e            # 전체
npx playwright test --project=e2e --grep "happy-path"   # 핵심 플로우
npx playwright test --project=e2e --grep "Guard"        # Guard 차단
npx playwright test --project=e2e --grep "Edit"         # 수정/삭제
npx playwright test --project=e2e --grep "Empty"        # 빈 상태

## Mobile Test
npx playwright test --project=mobile-iphone            # iPhone 13
npx playwright test --project=mobile-galaxy            # Galaxy S21
npx playwright test --project=mobile-iphone --project=mobile-galaxy  # 둘 다

## 전체 실행
npx playwright test                          # 전체
npx playwright test --headed                 # 브라우저 보면서

## 결과 리포트
npx playwright show-report

## FIXME 항목 (앱 수정 후 제거)
- contents 목록 스켈레톤 미전환 → contents API 디버깅 필요
- 설정 toast 타이밍 → API 속도 개선 후 fixme 제거
