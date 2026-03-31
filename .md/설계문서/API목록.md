# API 엔드포인트 목록

> 총 69개 API Route Handler

---

## 인증 범례

| 기호 | 의미 |
|------|------|
| -- | 인증 불필요 (공개) |
| USER | 일반 사용자 인증 필요 |
| ADMIN | 관리자 권한 필요 (admin, super_admin) |

---

## 1. 관리자 API (23개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/admin/action-logs` | ADMIN | 관리자 행동 로그 조회 |
| 2 | GET | `/api/admin/industries` | ADMIN | 업종 목록 (트리 구조) |
| 3 | POST | `/api/admin/industries` | ADMIN | 업종 추가 |
| 4 | PUT | `/api/admin/industries/[id]` | ADMIN | 업종 수정 |
| 5 | DELETE | `/api/admin/industries/[id]` | ADMIN | 업종 삭제 |
| 6 | GET | `/api/admin/logs` | ADMIN | 사용량 로그 조회 |
| 7 | GET | `/api/admin/mail/history` | ADMIN | 이메일 발송 이력 |
| 8 | POST | `/api/admin/mail/send` | ADMIN | 브로드캐스트 이메일 발송 |
| 9 | POST | `/api/admin/migrate` | ADMIN | DB 마이그레이션 실행 |
| 10 | GET | `/api/admin/plan-limits` | ADMIN | 요금제 한도 조회 |
| 11 | PUT | `/api/admin/plan-limits` | ADMIN | 요금제 한도 변경 |
| 12 | GET | `/api/admin/prompts` | ADMIN | AI 프롬프트 목록 |
| 13 | POST | `/api/admin/prompts` | ADMIN | AI 프롬프트 추가 |
| 14 | POST | `/api/admin/prompts/[id]/activate` | ADMIN | 프롬프트 활성화/비활성화 |
| 15 | GET | `/api/admin/stats` | ADMIN | KPI 통계 (사용자, 매출) |
| 16 | GET | `/api/admin/stats/costs` | ADMIN | AI 비용 통계 |
| 17 | GET | `/api/admin/support` | ADMIN | 전체 고객 문의 목록 |
| 18 | PATCH | `/api/admin/support` | ADMIN | 문의 답변/상태 변경 |
| 19 | GET | `/api/admin/users` | ADMIN | 사용자 목록 (페이지네이션, 검색) |
| 20 | GET | `/api/admin/users/[id]` | ADMIN | 사용자 상세 |
| 21 | PATCH | `/api/admin/users/[id]` | ADMIN | 사용자 정보 수정 (역할, 상태, 플랜) |
| 22 | POST | `/api/admin/users/[id]/unlock` | ADMIN | 계정 잠금 해제 |
| 23 | POST | `/api/admin/users/[id]/usage-grant` | ADMIN | 사용량 추가 부여 |

---

## 2. 인증 API (7개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | POST | `/api/auth/login` | -- | 로그인 (JWT 발급) |
| 2 | POST | `/api/auth/register` | -- | 회원가입 (인증 메일 발송) |
| 3 | GET | `/api/auth/me` | USER | 현재 사용자 정보 |
| 4 | POST | `/api/auth/forgot-password` | -- | 비밀번호 재설정 메일 발송 |
| 5 | POST | `/api/auth/reset-password` | -- | 비밀번호 재설정 (토큰 검증) |
| 6 | POST | `/api/auth/resend-verify` | -- | 인증 이메일 재발송 |
| 7 | GET | `/api/auth/verify-email` | -- | 이메일 인증 처리 |

---

## 3. 브랜드 보이스 API (5개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/brand-voices` | USER | 브랜드 보이스 목록 |
| 2 | POST | `/api/brand-voices` | USER | 생성 |
| 3 | GET | `/api/brand-voices/[id]` | USER | 상세 |
| 4 | PUT | `/api/brand-voices/[id]` | USER | 수정 |
| 5 | DELETE | `/api/brand-voices/[id]` | USER | 삭제 |

---

## 4. 캘린더 API (1개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/calendar` | USER | 월별 콘텐츠/스케줄 캘린더 데이터 |

---

## 5. 채널 관리 API (6개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/channels` | USER | 채널 목록 |
| 2 | POST | `/api/channels` | USER | 채널 등록 |
| 3 | GET | `/api/channels/[id]` | USER | 채널 상세 |
| 4 | PUT | `/api/channels/[id]` | USER | 채널 수정 |
| 5 | DELETE | `/api/channels/[id]` | USER | 채널 삭제 |
| 6 | POST | `/api/channels/test` | USER | 채널 연결 테스트 |

---

## 6. 콘텐츠 API (6개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/contents` | USER | 목록 (필터, 페이지네이션) |
| 2 | POST | `/api/contents` | USER | 생성/저장 |
| 3 | GET | `/api/contents/[id]` | USER | 상세 |
| 4 | PUT | `/api/contents/[id]` | USER | 수정 |
| 5 | DELETE | `/api/contents/[id]` | USER | 삭제 |
| 6 | POST | `/api/contents/[id]/duplicate` | USER | 복제 |

---

## 7. AI 생성 API (9개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | POST | `/api/generate` | USER | 범용 콘텐츠 생성 (레거시) |
| 2 | POST | `/api/generate/single` | USER | 단일 채널 콘텐츠 생성 |
| 3 | POST | `/api/generate/pipeline` | USER | v3 파이프라인 생성 (STEP5, SSE) |
| 4 | POST | `/api/generate/titles` | USER | 제목 후보 생성 (STEP3) |
| 5 | POST | `/api/generate/outline` | USER | 아웃라인 생성 |
| 6 | POST | `/api/generate/draft` | USER | 초안 생성 (STEP4) |
| 7 | POST | `/api/generate/image` | USER | 이미지 생성 |
| 8 | POST | `/api/generate/image-script` | USER | 이미지 프롬프트 스크립트 (STEP6) |
| 9 | POST | `/api/generate/video-script` | USER | 영상 스토리보드 (STEP7) |

---

## 8. 업종 API (1개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/industries` | USER | 업종 목록 (트리 구조, 활성만) |

---

## 9. 키워드 API (9개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/keywords` | USER | 저장 키워드 목록 |
| 2 | POST | `/api/keywords` | USER | 키워드 저장 |
| 3 | GET | `/api/keywords/[id]` | USER | 키워드 상세 |
| 4 | DELETE | `/api/keywords/[id]` | USER | 키워드 삭제 |
| 5 | POST | `/api/keywords/naver` | USER | 네이버 키워드 분석 (검색량, CPC) |
| 6 | POST | `/api/keywords/grade` | USER | 기회 등급 계산 (A+~D-) |
| 7 | POST | `/api/keywords/trends` | USER | 트렌드 조회 (DataLab) |
| 8 | GET | `/api/keywords/opportunities` | USER | 기회 캐시 조회 |
| 9 | POST | `/api/keywords/seo-score` | USER | SEO 점수 계산 |

---

## 10. 마이페이지 API (7개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/mypage/profile` | USER | 프로필 조회 |
| 2 | PUT | `/api/mypage/profile` | USER | 프로필 수정 (이름) |
| 3 | GET | `/api/mypage/business-profile` | USER | 비즈니스 프로필 조회 |
| 4 | PUT | `/api/mypage/business-profile` | USER | 비즈니스 프로필 수정 |
| 5 | PUT | `/api/mypage/password` | USER | 비밀번호 변경 |
| 6 | DELETE | `/api/mypage/account` | USER | 계정 삭제 |
| 7 | GET | `/api/mypage/usage` | USER | 사용량 현황 |

---

## 11. 결제 API (4개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | POST | `/api/payments/checkout` | USER | 결제 세션 생성 |
| 2 | POST | `/api/payments/confirm` | USER | 결제 확인/완료 |
| 3 | GET | `/api/payments/history` | USER | 결제 이력 |
| 4 | POST | `/api/payments/webhook` | -- | 결제 웹훅 처리 |

---

## 12. 프로젝트 API (5개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/projects` | USER | 프로젝트 목록 |
| 2 | POST | `/api/projects` | USER | 프로젝트 생성 |
| 3 | GET | `/api/projects/[id]` | USER | 프로젝트 상세 (단계 상태) |
| 4 | PATCH | `/api/projects/[id]` | USER | 프로젝트 수정 (단계 진행) |
| 5 | DELETE | `/api/projects/[id]` | USER | 프로젝트 삭제 |

---

## 13. 공개 API (1개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | POST | `/api/public/keyword-preview` | -- | 키워드 프리뷰 (랜딩 페이지용) |

---

## 14. 발행 API (3개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | POST | `/api/publish/clipboard` | USER | 클립보드 복사용 데이터 |
| 2 | POST | `/api/publish/instagram` | USER | Instagram 발행 (Meta API) |
| 3 | POST | `/api/publish/threads` | USER | Threads 발행 (Meta API) |

---

## 15. 스케줄 API (5개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/schedules` | USER | 스케줄 목록 |
| 2 | POST | `/api/schedules` | USER | 스케줄 생성 |
| 3 | GET | `/api/schedules/[id]` | USER | 스케줄 상세 |
| 4 | PUT | `/api/schedules/[id]` | USER | 스케줄 수정 |
| 5 | DELETE | `/api/schedules/[id]` | USER | 스케줄 삭제 |

---

## 16. 소셜 설정 API (1개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | PUT | `/api/social-settings` | USER | 채널 소셜 토큰/설정 업데이트 |

---

## 17. 구독 API (2개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/subscriptions` | USER | 현재 구독 정보 |
| 2 | POST | `/api/subscriptions/cancel` | USER | 구독 취소 |

---

## 18. 고객지원 API (2개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/support` | USER | 내 문의 목록 |
| 2 | POST | `/api/support` | USER | 문의 등록 |

---

## 19. 사용자 프롬프트 API (3개)

| # | Method | Path | 인증 | 설명 |
|---|--------|------|------|------|
| 1 | GET | `/api/user-prompts` | USER | 커스텀 프롬프트 목록 |
| 2 | POST | `/api/user-prompts` | USER | 커스텀 프롬프트 저장/수정 |
| 3 | DELETE | `/api/user-prompts` | USER | 커스텀 프롬프트 삭제 (step 파라미터) |

---

## 공통 응답 형식

```
성공:  { "success": true, "data": T }
에러:  { "error": "메시지", "code": "ERROR_CODE" }
목록:  { "success": true, "data": T[], "total": N, "page": N, "per_page": N, "total_pages": N }
```

## 공통 에러 코드

| HTTP | code | 설명 |
|------|------|------|
| 400 | VALIDATION_ERROR | 입력값 검증 실패 |
| 401 | AUTH_REQUIRED | 인증 필요 |
| 403 | FORBIDDEN | 권한 부족 |
| 403 | USAGE_LIMIT_EXCEEDED | 사용량 한도 초과 |
| 404 | NOT_FOUND | 리소스 없음 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 제한 초과 |
| 500 | INTERNAL_ERROR | 서버 오류 |
