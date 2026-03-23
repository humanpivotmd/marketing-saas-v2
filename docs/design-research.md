# 디자인 리서치: 토스 스타일 + SaaS 대시보드

> 조사일: 2026-03-23

---

## 1. 토스(Toss) 디자인 시스템 분석

### 1.1 TDS(Toss Design System) 핵심 원칙

- **일관성**: 동일한 의도에는 동일한 색상/컴포넌트를 사용. 시맨틱 토큰 기반으로 디자인 결정 시간 단축
- **생산성**: 레고 블록처럼 조합 가능한 모듈식 UI 컴포넌트
- **확장성**: "System of System" 접근 - 기초(Foundation) 토큰을 공유하면서 플랫폼별 시맨틱/컴포넌트 토큰을 오버라이드
- **Single Source of Truth**: 모든 플랫폼(Web, Native, Server)에서 동일한 토큰 소스 사용

### 1.2 색상 시스템

**7년만의 컬러 시스템 업데이트 핵심:**
- 동일 번호의 색상은 동일한 밝기(Luminance) 보장 (Grey 100 = Blue 100 = Red 100 밝기 동일)
- 라이트/다크 모드 1:1 자동 대응 팔레트
- 토스 블루: 흰 배경/검은 배경 모두에서 쉽게 인지 가능
- 다크모드: 명도 대비를 더 강하게 설계

**토스 컬러 특징:**
- Primary: 토스 블루 (#3182F6 계열)
- 배경: 매우 어두운 회색 (순수 블랙 아닌 약간의 블루 틴트)
- 텍스트: 밝은 회색 계열 (순수 화이트 아닌 약간 낮춘 톤)
- 시맨틱 컬러: Success(초록), Warning(노란), Error(빨간) 명확한 구분

### 1.3 타이포그래피

- **Pretendard** 계열 폰트 사용 (한국어 최적화)
- 본문 최소 16px (모바일 확대 방지)
- 제목은 크고 굵게 (SemiBold~Bold)
- 행간(line-height) 1.5 이상으로 가독성 확보
- 다크모드: 더 무거운 폰트 웨이트, 넓은 행간

### 1.4 여백과 레이아웃

- **넓은 여백**: 콘텐츠 간 간격이 넓어 시각적 여유
- **카드 기반 레이아웃**: 정보를 카드 단위로 그룹화
- **충분한 패딩**: 카드 내부 패딩 20px~24px
- **섹션 간 간격**: 32px~48px

### 1.5 애니메이션과 인터랙션

- 블러 효과로 가벼운 느낌 (Glass Morphism)
- 밝은 외곽선으로 유리 같은 질감
- 부드러운 터치 인터랙션 (ease-out 계열 easing)
- 트랜지션 200~300ms
- 모달/시트: 슬라이드업 + 페이드
- prefers-reduced-motion 대응

### 1.6 다크모드 처리

- Dark-first 워크플로우 (2026 트렌드: 80%+ 사용자가 다크모드 기본)
- 하나의 디자인 시스템에 테마 토큰 스왑
- 공유: spacing, typography, component behaviors
- 분리: semantic color tokens만 교체
- 배경 계층: Primary(가장 어두움) > Secondary > Tertiary > Elevated

---

## 2. 경쟁 SaaS 디자인 분석

### 2.1 Linear

- **LCH 색 공간 기반 테마 시스템**: base color, accent color, contrast 3개 변수로 전체 테마 생성
- **초고대비 테마**: 접근성을 위한 자동 고대비 옵션
- **미니멀 사이드바**: 아이콘 + 텍스트, 접을 수 있는 구조
- **콘텐츠 밀도 높음**: 작은 요소들이 깔끔하게 정렬
- **키보드 우선**: 모든 액션에 단축키

### 2.2 Notion

- **깔끔한 다크 테마**: #191919 배경, 부드러운 텍스트 색상
- **미니멀 네비게이션**: 사이드바 + 콘텐츠 2단 구조
- **커스텀 아이콘/이모지**: 시각적 구분에 활용
- **블록 기반 인터페이스**: 모듈화된 콘텐츠

### 2.3 Buffer

- **좌측 사이드바 네비게이션**: Publish, Create, Analyze, Community 메뉴
- **채널 중심 경험**: 각 SNS 채널별로 콘텐츠 관리
- **캘린더 뷰**: 시각적 콘텐츠 스케줄링
- **드래그앤드롭**: 직관적 포스트 관리
- **프로필 아바타 하단 배치**: 설정/빌링/팀 관리

### 2.4 Jasper AI

- **좌측 사이드바**: Home, Projects, Apps, Jasper IQ
- **깔끔하고 모던한 인터페이스**
- **템플릿 선택 -> 입력 -> 생성**: 3단계 워크플로우
- **브라우저 확장 UI 통합**

### 2.5 shadcn/ui SaaS 패턴

- **사이드바 너비**: 200~300px 최적
- **고정 사이드바**: 사용자 위치 인지 유지
- **메뉴 아이템 논리적 그룹화**
- **다크/라이트 모드 토글**: 시스템 설정 연동
- **10+ 페이지 관리자 패널 패턴**

---

## 3. 2026 다크모드 디자인 원칙

### 3.1 Dark-First 워크플로우
- 다크 테마를 먼저 디자인하고 라이트로 파생
- 80%+ 모바일 사용자가 다크모드 기본 사용

### 3.2 색상 원칙
- 순수 블랙(#000) 배경 지양 -> 약간의 블루/퍼플 틴트 추가
- 순수 화이트(#FFF) 텍스트 지양 -> #F0~#E8 계열로 눈 부담 감소
- 배경 계층: 최소 3단계 (Primary < Secondary < Elevated)
- 액센트 컬러: 밝기를 약간 올려 다크 배경에서 충분한 대비

### 3.3 타이포그래피
- 다크 배경에서 폰트 웨이트를 약간 올림 (400 -> 500)
- 행간 약간 넓힘 (가독성)
- 텍스트 색상 단계: Primary > Secondary > Tertiary

### 3.4 엘리베이션
- 그림자 대신 배경색 밝기로 높낮이 표현
- 높은 엘리베이션 = 더 밝은 배경
- 미세한 보더로 요소 구분

---

## 4. 디자인 의사결정

### 토스 스타일 적용 요약

| 요소 | 토스에서 가져올 것 | 우리 서비스 적용 |
|------|------------------|----------------|
| 색상 | 토스 블루 + 다크 계층 | Primary Accent: #2F81F7 (토스 블루 유사) |
| 배경 | 블루 틴트 다크 배경 | #0E1117 (GitHub 다크 유사, 블루 틴트) |
| 타이포 | Pretendard + 큰 본문 | Pretendard, 본문 16px, 제목 Bold |
| 여백 | 넉넉한 카드 패딩 | 카드 패딩 24px, 섹션 간격 32~48px |
| 애니메이션 | 부드러운 200~300ms | cubic-bezier(0.4,0,0.2,1) |
| 터치타겟 | 최소 44px | 버튼/인풋 최소 높이 44px |
| 카드 | 둥근 모서리 + 미세 보더 | rounded-xl(16px) + border 0.1 opacity |
| 사이드바 | 좌측 고정 | 240px, 접기 가능 |

### 색상 팔레트 결정 근거

- **배경 #0E1117**: GitHub 다크 테마에서 검증된 가독성, 블루 틴트로 부드러움
- **보조 배경 #161B22**: 카드/사이드바, 배경 대비 미세한 높낮이
- **액센트 #2F81F7**: 토스 블루와 유사, 다크 배경에서 WCAG AA 대비 충족
- **보라 #8B5CF6**: 보조 액센트, 프리미엄/AI 기능 강조
- **성공 #3FB950**: 녹색, SEO 점수/키워드 등급 표시
- **경고 #D29922**: 주황, 사용량 경고
- **에러 #F85149**: 빨강, 오류/삭제

Sources:
- [토스 디자이너가 제품에만 집중할 수 있는 방법](https://toss.tech/article/toss-design-system)
- [달리는 기차 바퀴 칠하기: 7년만의 컬러 시스템 업데이트](https://toss.tech/article/tds-color-system-update)
- [UX와 DX, 모든 경험을 위한 디자인 시스템 - Slash 22](https://toss.im/slash-22/sessions/1-3)
- [토스 디자인 시스템 가이드 개선](https://toss.tech/article/toss-design-system-guide)
- [Linear UI 리디자인](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Linear Style](https://linear.style/)
- [Dark Mode Design Best Practices 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/)
- [Buffer 대시보드 네비게이션](https://support.buffer.com/article/946-navigating-buffers-new-dashboard)
- [shadcn/ui Dashboard](https://ui.shadcn.com/examples/dashboard)
- [Sidebar Menu Design 2026](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples)
