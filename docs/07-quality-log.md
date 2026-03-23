# Quality Log

> 작성일: 2026-03-23

---

## S1 인프라 검증

### 검토 범위
- src/lib/ (15개 파일: auth, crypto, email, env, errors, grade, naver, naver-seo-scorer, prompts, rate-limit, usage, validations, supabase/client, supabase/server)
- src/types/index.ts
- supabase/migrations/001_init.sql, 002_seed.sql

---

### Architect 채점 (최종: 97/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 파일 구조 적절성 | 15 | 14 | 15 | lib/ 모듈 분리 완료, env/validations 추가 |
| API 연동 설계 | 20 | 18 | 19 | Naver 3종 API 완비, AI provider는 S2 범위 |
| DB 스키마 정규화 | 20 | 19 | 20 | 16 테이블, plans admin write/support_tickets admin 정책 추가 |
| 타입 안전성 | 15 | 14 | 14 | types/index.ts 360줄 완성, Zod 스키마 추가 |
| 보안 설계 | 15 | 13 | 15 | AuthError/ForbiddenError 전환, ENCRYPTION_KEY 분리, bcrypt 12 rounds |
| 확장성 | 15 | 14 | 14 | S2에서 바로 import 가능 구조 |

**수정 사항:**
1. auth.ts: generic Error -> AuthError/ForbiddenError, JWT_SECRET 검증 함수 추가, bcrypt 10->12 rounds
2. crypto.ts: ENCRYPTION_KEY 환경변수 분리, decrypt 입력 검증 추가
3. 001_init.sql: plans_admin_write, usage_logs/payments admin read, support_tickets_admin 정책 추가
4. env.ts 신규: 환경변수 Zod 검증
5. validations.ts 신규: 전 API 입력 Zod 스키마

---

### QA 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| TypeScript strict | 20 | 18 | 19 | any 없음, Record<string, unknown> 적절 사용 |
| 에러 핸들링 일관성 | 20 | 16 | 19 | auth.ts에 AppError 계열 적용 완료 |
| 입력 검증 | 20 | 14 | 19 | validations.ts Zod 스키마 10개 + validateRequest 헬퍼 |
| 코드 중복 | 20 | 18 | 19 | prompts.ts는 DB fallback 용도로 적절 |
| 엣지 케이스 | 20 | 18 | 20 | decrypt 포맷 검증, SEO scorer 빈 body 처리, regex escape |

**수정 사항:**
1. auth.ts: throw new Error -> throw new AuthError/ForbiddenError
2. validations.ts: 전 API endpoint용 Zod 스키마 추가
3. crypto.ts: decrypt 입력 포맷 검증
4. naver-seo-scorer.ts: 빈 body 처리, keyword regex escape

---

### Security 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 인증 구현 | 20 | 17 | 19 | bcrypt 12 rounds, AuthError 통합 |
| 암호화 | 20 | 16 | 19 | ENCRYPTION_KEY 분리, decrypt 입력 검증 |
| Rate Limiting | 20 | 17 | 19 | Retry-After/X-RateLimit 헤더 추가 |
| 환경변수 관리 | 20 | 15 | 20 | env.ts Zod 검증, production 시 필수값 throw |
| SQL Injection/XSS | 20 | 17 | 19 | email HTML escape, regex escape, Supabase parameterized |

**수정 사항:**
1. auth.ts: bcrypt rounds 10 -> 12
2. crypto.ts: ENCRYPTION_KEY 별도 환경변수 사용
3. rate-limit.ts: 429 응답에 Retry-After, X-RateLimit 헤더 추가
4. env.ts: 환경변수 스키마 검증 모듈 추가
5. email.ts: escapeHtml 함수 추가, 템플릿 내 사용자 이름 escape
6. naver-seo-scorer.ts: escapeRegExp로 keyword 안전 처리

---

### PM 확인 사항

**S0 디자인 토큰 참조 가능 여부:** design-tokens.json이 프로젝트 루트에 존재하며, lib/ 코드에서 import 가능. 컴포넌트 단에서 Tailwind 또는 CSS Variables로 매핑하여 사용 예정.

**S2 import 준비 상태:** 모든 lib 모듈이 named export로 제공되어 S2(인증+대시보드)에서 바로 사용 가능:
- `import { requireAuth, signToken } from '@/lib/auth'`
- `import { handleApiError, AuthError } from '@/lib/errors'`
- `import { validateRequest, loginSchema } from '@/lib/validations'`
- `import { checkUsageLimit, logUsage } from '@/lib/usage'`
- `import { checkRateLimitOrRespond, loginRateLimit } from '@/lib/rate-limit'`
- `import { validateEnv } from '@/lib/env'`

---

### 최종 점수

| 역할 | 점수 |
|------|------|
| Architect | **97** |
| QA | **96** |
| Security | **96** |
| **평균** | **96.3** |

---

## S2 인증+대시보드 검증

### 검토 범위
- src/app/(auth)/ 전체 (login, verify-email, reset-password, onboarding)
- src/app/(dashboard)/layout.tsx, dashboard/page.tsx
- src/app/(public)/landing/page.tsx
- src/app/api/auth/ 전체 (register, login, me, verify-email, resend-verify, forgot-password, reset-password)
- middleware.ts
- src/components/ui/ (Button, Input, Card, Modal, Toast, Badge, Skeleton, EmptyState)
- src/app/globals.css

---

### UX 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 가입→첫 결과 4단계 | 25 | 22 | 24 | 가입(4-step)→자동 로그인→온보딩(2-step)→대시보드. 실질 3단계 |
| 온보딩 QuickSetup | 25 | 21 | 24 | 업종별 Brand Voice 톤/타겟 동적 매핑 완료, 업종 12개 프리셋 |
| 대시보드 정보 구조 + 빈 상태 | 25 | 23 | 24 | EmptyState + Skeleton 로딩 + 빠른 액션 완비 |
| 에러/로딩/성공 피드백 | 25 | 22 | 24 | Toast/role="alert"/loading spinner/aria-busy 전체 적용 |

**수정 사항:**
1. onboarding: Brand Voice 톤/타겟을 업종별 동적 매핑 (12개 프리셋)
2. globals.css: Tailwind v4 spacing 토큰 충돌 해결 (--spacing-* → --space-*)
3. auth layout: max-w-[420px] shrink-0으로 안정적 폼 너비

---

### Mobile 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 반응형 레이아웃 | 25 | 24 | 24 | 사이드바 lg:hidden, 햄버거 슬라이드+오버레이 |
| 터치타겟 44px | 25 | 23 | 24 | globals.css 글로벌 44px + 랜딩 nav 링크 min-h-[44px] 추가 |
| Input 16px + viewport-fit | 25 | 24 | 24 | globals.css input font-size:16px, env(safe-area-inset) |
| 모바일 네비게이션 UX | 25 | 19 | 24 | 랜딩 모바일 햄버거 메뉴 추가, aria-expanded, 드롭다운 |

**수정 사항:**
1. landing: 모바일 햄버거 메뉴 + 드롭다운 네비게이션 추가
2. landing nav: 데스크톱 링크에 min-h-[44px] 터치타겟 적용
3. dashboard layout: 사이드바 ESC 키 닫기 구현

---

### A11y 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| ARIA 속성 | 25 | 23 | 24 | role="progressbar", aria-valuenow, aria-pressed, aria-expanded 전체 |
| Focus 스타일 | 25 | 23 | 24 | Button에 focus:ring-2 추가, :focus-visible 글로벌 |
| 색상 대비 WCAG AA | 25 | 22 | 24 | 주요 텍스트 AA 충족, tertiary는 보조 텍스트용으로 적절 |
| 키보드 네비게이션 | 25 | 21 | 24 | skip-to-content 링크 2곳, ESC 사이드바 닫기, Modal focus trap |

**수정 사항:**
1. Button.tsx: focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 추가
2. landing/dashboard: skip-to-content ("본문으로 건너뛰기") 링크 추가
3. Modal.tsx: aria-label "Close dialog" → "닫기" 한국어화
4. Toast.tsx: aria-label "Close notification" → "알림 닫기" 한국어화
5. Skeleton.tsx: aria-label "Loading..." → "로딩 중" 한국어화
6. login: register step indicator에 role="progressbar" + aria-valuenow + sr-only 안내 텍스트
7. onboarding: step indicator에 role="progressbar" + sr-only 안내 텍스트
8. dashboard: hamburger 버튼에 aria-expanded 추가
9. dashboard: 사이드바 ESC 키 닫기 이벤트 리스너 추가

---

### Design-Trend 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 토스 디자인 원칙 | 25 | 23 | 24 | 넓은 여백, 명확한 계층, hero 그래디언트 추가 |
| S0 디자인 시스템 | 25 | 23 | 24 | CSS 변수 일관 사용, Tailwind v4 토큰 충돌 해결 |
| 트랜지션/애니메이션 | 25 | 22 | 24 | step indicator transition-colors, pricing hover -translate-y-1, 모바일 메뉴 fade-in |
| 시각 품질 | 25 | 23 | 24 | hero 배경 그래디언트, pricing 카드 hover 효과 추가 |

**수정 사항:**
1. landing hero: radial-gradient 배경 효과 2개 추가
2. landing pricing: hover:border, hover:shadow-md, hover:-translate-y-1 인터랙션
3. landing 모바일 메뉴: animate-[fade-in_150ms_ease-out] 진입 애니메이션
4. step indicators: transition-colors duration-300 부드러운 전환
5. globals.css: --spacing-* → --space-* 로 Tailwind v4 충돌 해결 (max-w-sm/lg/xl 정상 동작)

---

### PM 확인 사항

**Tailwind v4 spacing 충돌 해결:** `@theme` 블록의 `--spacing-sm/lg/xl` 등이 Tailwind v4의 `max-w-sm`, `max-w-lg` 유틸리티와 충돌하여 모든 `max-w-*` 값이 8-24px로 잘못 계산되던 문제 발견 및 수정. `--spacing-*` → `--space-*`로 prefix 변경.

**인증 플로우 정상 동작:** 가입 4단계 → 자동 로그인 → 온보딩 2단계 → 대시보드. Rate limiting, Zod 검증, 이메일 인증, 비밀번호 재설정 전체 완비.

**스크린샷:**
- `screenshots/s2-landing.png` — 랜딩 페이지 (데스크톱 full page)
- `screenshots/s2-login.png` — 로그인 페이지 (데스크톱)
- `screenshots/s2-mobile-landing.png` — 랜딩 페이지 (모바일 375px)
- `screenshots/s2-mobile-login.png` — 로그인 페이지 (모바일 375px)

---

### 최종 점수

| 역할 | 점수 |
|------|------|
| UX | **96** |
| Mobile | **96** |
| A11y | **96** |
| Design-Trend | **96** |
| **평균** | **96.0** |

---

## S6 결제+배포+최종 검증

### 검토 범위
- src/app/api/payments/ 전체 (checkout, confirm, history, webhook)
- src/app/api/subscriptions/ 전체 (route, cancel)
- src/app/(dashboard)/pricing/ 전체 (page, checkout)
- src/app/sitemap.ts, public/robots.txt
- src/app/layout.tsx (메타데이터)
- next.config.ts (보안 헤더, 이미지 최적화)
- src/app/not-found.tsx, src/app/error.tsx
- src/app/(public)/guide/page.tsx
- .env.example

---

### Architect 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 결제 아키텍처 | 25 | 22 | 24 | checkout→confirm→webhook 3단계 구조, 금액 서버검증 추가 |
| 배포 준비도 | 25 | 24 | 24 | standalone, env.example 완비, TOSS_WEBHOOK_SECRET 추가 |
| 파일 구조 일관성 | 25 | 24 | 24 | 119개 파일, payments/subscriptions 모듈 분리 적절 |
| 확장성 | 25 | 23 | 24 | 토스 라이브 전환 시 주석 해제+시크릿 설정만으로 가능 |

**수정 사항:**
1. .env.example: TOSS_WEBHOOK_SECRET 추가
2. payments/confirm: 서버 사이드 금액 검증 로직 추가 (위변조 방지)
3. pricing/page.tsx: Badge 컴포넌트 dynamic import 적용

---

### Security 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 결제 보안 | 25 | 18 | 24 | 웹훅 HMAC-SHA256 시그니처 검증, timingSafeEqual 적용 |
| 보안 헤더 | 25 | 20 | 24 | CSP 헤더 추가 (tosspayments, supabase, jsdelivr 허용) |
| API 인증 일관성 | 25 | 24 | 24 | 58개 API 중 7개만 미인증 (auth/login,register,forgot,reset,verify + public/preview + webhook) — 모두 정당 |
| 환경변수 관리 | 25 | 23 | 24 | TOSS_WEBHOOK_SECRET 추가, 모든 시크릿 placeholder |

**수정 사항:**
1. webhook/route.ts: HMAC-SHA256 시그니처 검증 구현 (crypto.timingSafeEqual)
2. webhook/route.ts: production 환경에서 시크릿 미설정 시 거부
3. next.config.ts: CSP 헤더 추가 (default-src, script-src, style-src, connect-src, frame-src)
4. confirm/route.ts: 서버 사이드 금액 검증 (amount !== expectedAmount 시 거부)
5. confirm/route.ts: billing_cycle 유효값 검증 추가

---

### Performance 채점 (최종: 95/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| SSR/SSG 전략 | 25 | 22 | 23 | guide/landing 서버 컴포넌트(SSG 가능), dashboard 클라이언트 |
| 이미지 최적화 | 25 | 24 | 24 | avif/webp 설정, deviceSizes/imageSizes 커스텀 |
| 번들 최적화 | 25 | 21 | 24 | Badge dynamic import 추가 |
| 캐싱 전략 | 25 | 20 | 24 | API no-store, guide 1h/landing 30m 캐싱, stale-while-revalidate |

**수정 사항:**
1. pricing/page.tsx: Badge 컴포넌트 dynamic import (번들 분리)
2. next.config.ts: /guide에 Cache-Control public max-age=3600 s-maxage=86400
3. next.config.ts: /landing에 Cache-Control public max-age=1800 s-maxage=43200

---

### QA 채점 (최종: 96/100)

| 항목 | 배점 | 초기 | 최종 | 비고 |
|------|------|------|------|------|
| 결제 API 에러 핸들링 | 25 | 22 | 24 | 모든 결제 API에 try-catch+handleApiError, ValidationError 적절 |
| TypeScript 타입 안전성 | 25 | 24 | 24 | tsc --noEmit 통과, 인터페이스 정의 완비 |
| 빌드 무결성 | 25 | 24 | 24 | TypeScript 컴파일 에러 없음 |
| 엣지 케이스 | 25 | 20 | 24 | 웹훅 멱등성(중복 상태 체크), 금액 위변조 방지, billing_cycle 검증 |

**수정 사항:**
1. webhook/route.ts: 멱등성 처리 (기존 상태 확인 후 다를 때만 업데이트)
2. confirm/route.ts: 금액 위변조 방지 (서버 계산 금액과 비교)
3. confirm/route.ts: billing_cycle 유효값 검증

---

### 최종 점수

| 역할 | 점수 |
|------|------|
| Architect | **96** |
| Security | **96** |
| Performance | **95** |
| QA | **96** |
| **평균** | **95.75** |
