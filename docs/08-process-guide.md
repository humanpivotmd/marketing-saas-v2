# 프로세스 가이드

> 작성일: 2026-03-23

---

## 단계별 작업 흐름

### 각 Sprint 완료 조건

1. **코드 구현** 완료
2. **3역할 교차 채점** (Architect / QA / Security) 각 95점 이상
3. **Figma 스크린샷 업로드** — 해당 단계의 UI가 포함된 경우
4. **07-quality-log.md** 에 채점 결과 기록
5. PM 확인 (이전 단계 산출물과의 연결성 검증)

---

## 각 단계 검증 후 Figma 스크린샷 업로드 절차

### 대상 단계
- S2: 인증 + 대시보드 (로그인, 회원가입, 대시보드 화면)
- S3: 키워드 분석 (키워드 입력, 결과, 저장 화면)
- S4: 콘텐츠 생성 (생성 폼, 결과, SEO 점수 화면)
- S5: 발행 + 이미지 (캘린더, 채널 연동, 이미지 생성 화면)
- S6: 관리자 + 결제 (관리자 대시보드, 결제 화면)

### 업로드 절차

1. 해당 단계 구현 완료 후 개발 서버에서 주요 화면 캡처
2. Figma 프로젝트 (DG89MBxDXCSuo7ZgJ91oBB) 내 해당 단계 페이지에 업로드
3. 디자인 토큰 (design-tokens.json) 준수 여부 시각적 확인
4. 스크린샷에 번호 매기기: `S{n}-{순번}-{화면명}.png`
   - 예: S2-01-login.png, S2-02-register.png, S2-03-dashboard.png
5. 07-quality-log.md에 "스크린샷 업로드 완료" 기록

### 검증 체크리스트 (스크린샷 리뷰)
- [ ] 다크 테마 색상이 design-tokens.json과 일치하는지
- [ ] 터치 타겟 44px 이상인지
- [ ] 모바일 반응형 확인 (375px 너비)
- [ ] 사이드바/레이아웃 구조가 설계서와 일치하는지
- [ ] 로딩 상태 및 에러 상태 화면 포함

---

## Sprint 목록

| Sprint | 범위 | 채점 대상 | Figma |
|--------|------|-----------|-------|
| S0 | 디자인 토큰 + Figma | design-tokens.json | O |
| S1 | 인프라 (DB + lib) | src/lib, migrations, types | - |
| S2 | 인증 + 대시보드 | auth API, 로그인/가입 UI | O |
| S3 | 키워드 분석 | keyword API, 분석 UI | O |
| S4 | 콘텐츠 생성 | content API, 생성 UI | O |
| S5 | 발행 + 이미지 | schedule/image API, UI | O |
| S6 | 관리자 + 결제 | admin API, 결제 UI | O |
