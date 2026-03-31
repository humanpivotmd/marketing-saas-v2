// ─── 7단계 콘텐츠 생성 파이프라인 프롬프트 ───

// 시스템/유저 분리 프롬프트 구조
export interface SplitPrompt {
  system: string
  user: string
}

export interface PipelineContext {
  businessType: 'B2B' | 'B2C'
  keyword: string
  companyName?: string
  serviceName?: string
  targetAudience?: string
  targetGender?: string
  tone?: string
  industry?: string
  topicType?: string    // info | intro | service | product
  selectedTitle?: string
  draftContent?: string
  blogContent?: string
  userPrompt?: string
  promptMode?: 'priority' | 'combine' | 'reference'
  coreMessage?: string
  blogCategory?: string
  fixedKeywords?: string[]
}

const B2B_CONTEXT = `
[B2B 글쓰기 원칙]
- 전문적이고 격식 있는 문체
- 데이터, 수치, 사례(케이스스터디) 중심
- 논리적 근거와 ROI 강조
- 구매 담당자/임원이 의사결정에 활용 가능한 정보
- 키워드: 효율성, 생산성, 비용 절감, 확장성, 도입 효과
- 신뢰 구축: 레퍼런스, 인증, 데이터 기반 증거
`

const B2C_CONTEXT = `
[B2C 글쓰기 원칙]
- 친근하고 감성적인 문체
- 스토리텔링과 공감 활용
- 즉각적인 감정 자극과 행동 유도
- 일반 소비자가 쉽게 이해하는 수준
- 키워드: 지금 바로, 한정, 특가, 후기, 라이프스타일
- 신뢰 구축: 후기, 별점, 인플루언서, 감정적 경험
`

function getBusinessContext(type: 'B2B' | 'B2C') {
  return type === 'B2B' ? B2B_CONTEXT : B2C_CONTEXT
}

// ── 업종별 맞춤 컨텍스트 (서비스가이드/업종별가이드.md 기반) ──
const INDUSTRY_CONTEXT: Record<string, {
  coreValue: string
  audience: string
  essentials: string
  differentiator: string
  emotionTrigger?: string
  caution?: string
}> = {
  '한식/전통음식': {
    coreValue: '전통, 정성, 손맛, 깊은 국물, 신선한 재료',
    audience: '40~60대 가족 모임, 상견례, 돌잔치, 회식',
    essentials: '상차림 전체 사진, 반찬 클로즈업, 메뉴+가격 투명 공개, 예약 시스템',
    differentiator: '"3대째 이어온 레시피", "국내산 식재료만 사용"',
    emotionTrigger: '어머니의 손맛, 집밥 같은 따뜻함',
  },
  '카페/디저트': {
    coreValue: '분위기, 감성, 인스타그래머블, 맛+공간',
    audience: '20~30대, 데이트, 소모임, 재택근무자',
    essentials: '매장 인테리어 사진, 시그니처 메뉴, 온라인 메뉴판, 위치+주차',
    differentiator: '"직접 로스팅한 원두", "매일 굽는 수제 디저트"',
    emotionTrigger: '나만의 아지트, 특별한 하루',
  },
  '일반 음식점': {
    coreValue: '맛, 가성비, 위생, 빠른 서비스',
    audience: '직장인 점심, 가족 외식, 배달 이용자',
    essentials: '메뉴+가격표, 배달/포장 안내, 영업시간, 후기',
    differentiator: '"당일 신선 재료", "배달 30분 이내"',
  },
  '병원/의원': {
    coreValue: '전문성, 신뢰, 안전, 경력',
    audience: '건강 고민 환자, 지역 주민',
    essentials: '의료진 소개+경력, 진료 과목, 진료 시간, 온라인 예약',
    differentiator: '"○○대학병원 출신", "20년 경력", "비급여 가격 투명 공개"',
    caution: '의료법 준수, 과대광고 금지',
  },
  '치과': {
    coreValue: '전문성, 신뢰, 안전, 최신 장비',
    audience: '치아 건강 고민 환자, 지역 주민, 심미 치료 관심자',
    essentials: '진료 과목, 의료진 경력, 치료 전후 사진, 온라인 예약',
    differentiator: '"디지털 진단 시스템", "무통 치료", "투명 가격 공개"',
    caution: '의료법 준수, 과대광고 금지',
  },
  '한의원': {
    coreValue: '전통 의학, 자연 치유, 체질 맞춤, 근본 치료',
    audience: '만성 질환 환자, 체질 개선 관심자, 산후조리',
    essentials: '진료 분야, 한의사 경력, 치료 후기, 상담 예약',
    differentiator: '"체질별 맞춤 처방", "비수술 치료 전문"',
    caution: '의료법 준수, 과대광고 금지',
  },
  '학원/교육기관': {
    coreValue: '교육 품질, 합격/성과 실적, 안전한 환경',
    audience: '학부모(30~50대), 학생',
    essentials: '커리큘럼, 강사진 소개, 수강료, 상담 신청, 합격 실적',
    differentiator: '"소수 정예 5인반", "1:1 맞춤 커리큘럼"',
    emotionTrigger: '아이의 성장, 합격의 기쁨',
  },
  '온라인 교육': {
    coreValue: '접근성, 반복 학습, 시간 효율, 체계적 커리큘럼',
    audience: '직장인, 자기계발 관심자, 재택 학습자',
    essentials: '강의 목록, 수강 후기, 샘플 강의, 수료증',
    differentiator: '"언제 어디서나 학습", "실무 중심 커리큘럼"',
  },
  '미용실/헤어샵': {
    coreValue: '실력, 트렌드, 1:1 맞춤 시술',
    audience: '20~40대 여성',
    essentials: '시술 전후 사진, 가격표, 예약 시스템, 스타일리스트 소개',
    differentiator: '"○○ 수상 경력", "1:1 담당제"',
    emotionTrigger: '특별한 날의 변신, 자신감',
  },
  '네일/피부관리': {
    coreValue: '섬세함, 트렌드, 위생, 피부 맞춤 관리',
    audience: '20~40대 여성, 자기관리 관심자',
    essentials: '시술 사진, 가격표, 예약, 제품/기기 소개',
    differentiator: '"1:1 피부 분석", "프리미엄 제품 사용"',
    emotionTrigger: '나만의 뷰티 타임, 자기 관리의 만족감',
  },
  '헬스/피트니스': {
    coreValue: '건강, 변화, 전문 트레이닝, 동기부여',
    audience: '20~40대 남녀, 다이어트/체력 관리 목적',
    essentials: '시설 사진, 프로그램 소개, 트레이너 경력, 가격/이용권',
    differentiator: '"1:1 PT 전문", "체성분 분석 무료"',
    emotionTrigger: '변화된 나, 건강한 라이프스타일',
  },
  '인테리어업체': {
    coreValue: '포트폴리오, 시공 품질, 가격 투명성',
    audience: '신혼부부, 리모델링 고객, 사무실 인테리어',
    essentials: '시공 사례(전후 사진), 견적 안내, 시공 과정, AS 정책',
    differentiator: '"시공 후 1년 무상 AS", "3D 시뮬레이션 제공"',
    emotionTrigger: '내 집의 변신, 새 공간의 설렘',
  },
  '시공/건설업체': {
    coreValue: '기술력, 안전, 공기 준수, 품질 보증',
    audience: '건축주, 시설 관리자, 공공 발주처',
    essentials: '시공 실적, 인허가/자격, 견적 상담, 공정 관리',
    differentiator: '"공기 내 완공률 99%", "하자 보증 2년"',
  },
  '펫샵/펫용품': {
    coreValue: '안전, 품질, 반려동물 건강',
    audience: '반려동물 보호자 (20~40대)',
    essentials: '제품 소개, 성분/안전 인증, 후기, 배송 안내',
    differentiator: '"수의사 추천 제품", "천연 원료만 사용"',
  },
  '애견미용': {
    coreValue: '안전, 전문성, 사랑, 신뢰',
    audience: '반려동물 보호자 (20~40대)',
    essentials: '서비스 소개, 가격표, 예약, 후기, 자격 인증',
    differentiator: '"CCTV 실시간 공개", "자격증 보유 미용사"',
  },
  '동물병원': {
    coreValue: '전문성, 신뢰, 응급 대응, 최신 장비',
    audience: '반려동물 보호자',
    essentials: '진료 과목, 수의사 경력, 진료 시간, 응급 안내',
    differentiator: '"24시간 응급 진료", "수의사 상주"',
  },
  '세무사/회계사': {
    coreValue: '전문성, 신뢰, 실적, 접근성',
    audience: '개인사업자, 중소기업 대표',
    essentials: '전문 분야, 경력, 상담 신청, 성공 사례',
    differentiator: '"○○건 처리 실적", "초기 상담 무료"',
  },
  '노무사/법률': {
    coreValue: '전문성, 신뢰, 분쟁 해결, 법률 지식',
    audience: '근로자, 사업주, 분쟁 당사자',
    essentials: '전문 분야, 상담 신청, 처리 사례, 비용 안내',
    differentiator: '"노동 분쟁 전문", "승소율 ○○%"',
  },
  '컨설팅': {
    coreValue: '전문성, 맞춤 솔루션, 성과 기반',
    audience: '중소기업 대표, 스타트업, 경영 고민자',
    essentials: '서비스 영역, 컨설턴트 경력, 성공 사례, 상담 신청',
    differentiator: '"업종 특화 컨설팅", "성과 보증 프로그램"',
  },
  '펜션/게스트하우스': {
    coreValue: '경험, 분위기, 가성비, 편의성',
    audience: '커플, 가족, 소모임',
    essentials: '객실 사진, 가격, 예약 시스템, 주변 관광지, 후기',
    differentiator: '"오션뷰", "바베큐 시설", "반려동물 동반"',
  },
  '호텔/모텔': {
    coreValue: '청결, 편의시설, 접근성, 서비스',
    audience: '출장자, 관광객, 커플',
    essentials: '객실 사진, 가격, 예약, 부대시설, 위치/교통',
    differentiator: '"역세권 도보 3분", "조식 포함"',
  },
  '여행사': {
    coreValue: '전문 기획, 안전, 가성비, 특별한 경험',
    audience: '가족 여행, 신혼여행, 단체 여행',
    essentials: '여행 상품, 일정표, 가격, 후기, 상담 신청',
    differentiator: '"현지 전문 가이드", "소규모 프리미엄 투어"',
  },
  '정비/수리': {
    coreValue: '기술력, 신뢰, 투명한 가격, 빠른 서비스',
    audience: '차량 소유자, 사고 수리 고객',
    essentials: '정비 항목, 가격표, 예약, 후기, 자격/인증',
    differentiator: '"정비 내역 투명 공개", "출장 정비 가능"',
  },
  '매매/딜러': {
    coreValue: '신뢰, 품질 보증, 합리적 가격, 다양한 매물',
    audience: '중고차 구매자/판매자',
    essentials: '매물 목록, 차량 상태 리포트, 가격, 보증 조건',
    differentiator: '"엔카/KB 시세 기반", "30일 환불 보증"',
  },
  '세차/튜닝': {
    coreValue: '디테일링, 전문성, 차량 관리, 개성 표현',
    audience: '차량 관리 관심자, 튜닝 마니아',
    essentials: '서비스 메뉴, 전후 사진, 가격, 예약',
    differentiator: '"프리미엄 코팅 전문", "맞춤 튜닝 설계"',
  },
  '온라인 쇼핑몰': {
    coreValue: '편의성, 가격 경쟁력, 다양한 상품, 빠른 배송',
    audience: '20~40대 온라인 쇼핑 이용자',
    essentials: '상품 카탈로그, 후기, 배송/반품 정책, 이벤트',
    differentiator: '"당일 배송", "무료 반품"',
  },
  '오프라인 매장': {
    coreValue: '직접 체험, 전문 상담, 지역 밀착',
    audience: '지역 주민, 직접 확인 후 구매 선호자',
    essentials: '매장 위치, 취급 브랜드, 영업시간, 이벤트',
    differentiator: '"직접 보고 구매", "전문 스태프 상담"',
  },
  'SW/앱 개발': {
    coreValue: '기술력, 맞춤 개발, 유지보수, 최신 기술',
    audience: '스타트업, 중소기업, 디지털 전환 기업',
    essentials: '포트폴리오, 기술 스택, 개발 프로세스, 견적 상담',
    differentiator: '"풀스택 자체 개발팀", "애자일 개발 방식"',
  },
  'IT 서비스/SaaS': {
    coreValue: '효율성, 자동화, 확장성, 데이터 기반',
    audience: '기업 담당자, IT 관리자, 의사결정자',
    essentials: '기능 소개, 요금제, 데모/체험, 도입 사례',
    differentiator: '"14일 무료 체험", "99.9% 가동률"',
  },
  '웹에이전시': {
    coreValue: '디자인, 기획력, 마케팅 연계, 포트폴리오',
    audience: '홈페이지 제작 필요 기업, 브랜딩 관심 기업',
    essentials: '포트폴리오, 서비스 범위, 가격, 제작 과정',
    differentiator: '"기획부터 마케팅까지 원스톱", "반응형 기본"',
  },
  '식품 제조': {
    coreValue: '안전, 위생, 품질 관리, 인증',
    audience: '유통업체, B2B 바이어, 소비자',
    essentials: '제품 라인업, 인증(HACCP 등), 생산 시설, OEM 안내',
    differentiator: '"HACCP 인증", "자체 연구소 보유"',
  },
  '부품/소재 제조': {
    coreValue: '정밀도, 납기 준수, 품질 보증, 기술력',
    audience: 'B2B 구매 담당자, 설계 엔지니어',
    essentials: '제품 스펙, 인증, 거래처 실적, 견적 요청',
    differentiator: '"ISO 인증", "납기 준수율 99%"',
  },
  '생활용품 제조': {
    coreValue: '안전, 편의성, 가성비, 디자인',
    audience: '유통업체, 소비자, 해외 바이어',
    essentials: '제품 카탈로그, 인증, OEM/ODM 안내, 유통 채널',
    differentiator: '"친환경 소재", "KC 인증 완료"',
  },
  '교회/성당': {
    coreValue: '공동체, 영성, 나눔, 환영',
    audience: '신앙인, 새신자, 지역 주민',
    essentials: '예배/미사 시간, 위치, 소그룹 안내, 행사 일정',
    differentiator: '"열린 공동체", "다양한 소그룹 활동"',
  },
  '절/사찰': {
    coreValue: '수행, 명상, 전통, 자연',
    audience: '불교 신자, 템플스테이 관심자, 힐링 목적',
    essentials: '법회 일정, 템플스테이 안내, 위치, 사찰 소개',
    differentiator: '"천년 고찰", "템플스테이 운영"',
  },
  '공공기관': {
    coreValue: '신뢰, 투명성, 공익, 접근성',
    audience: '지역 주민, 민원인',
    essentials: '서비스 안내, 조직도, 민원 접수, 공지사항',
    differentiator: '"온라인 민원 24시간", "원스톱 서비스"',
  },
  '비영리/NGO': {
    coreValue: '사회적 가치, 투명성, 참여, 연대',
    audience: '후원자, 자원봉사자, 수혜자',
    essentials: '활동 소개, 후원 안내, 활동 보고서, 참여 방법',
    differentiator: '"100% 투명 회계 공개", "현장 중심 활동"',
  },
}

function getIndustryContext(industryName?: string): string {
  if (!industryName) return ''
  const ctx = INDUSTRY_CONTEXT[industryName]
  if (!ctx) return `- 업종: ${industryName}`

  let result = `[업종 맞춤 컨텍스트 — ${industryName}]
- 핵심 가치: ${ctx.coreValue}
- 주요 고객: ${ctx.audience}
- 필수 요소: ${ctx.essentials}
- 차별화 포인트: ${ctx.differentiator}`
  if (ctx.emotionTrigger) result += `\n- 감정 트리거: ${ctx.emotionTrigger}`
  if (ctx.caution) result += `\n- 주의사항: ${ctx.caution}`
  return result
}

function applyUserPrompt(basePrompt: string, ctx: PipelineContext): string {
  if (!ctx.userPrompt) return basePrompt

  switch (ctx.promptMode) {
    case 'priority':
      return `${ctx.userPrompt}\n\n[참고 — 기본 가이드]\n${basePrompt}`
    case 'reference':
      return `${basePrompt}\n\n[참고 사항 — 사용자 요청]\n${ctx.userPrompt}`
    case 'combine':
    default:
      return `${basePrompt}\n\n[추가 지침]\n${ctx.userPrompt}`
  }
}

// ── STEP3: 제목 5개 추출
export function buildTitlePrompt(ctx: PipelineContext): string {
  const topicLabels: Record<string, string> = {
    info: '정보형 (독자에게 유용한 정보 제공)',
    intro: '회사/브랜드 소개',
    service: '서비스 소개 및 설명',
    product: '상품/제품 소개 및 리뷰',
  }

  const base = `당신은 한국 디지털 마케팅 전문가입니다.

${getBusinessContext(ctx.businessType)}

[조건]
- 비즈니스 유형: ${ctx.businessType}
- 키워드: ${ctx.keyword}
${ctx.companyName ? `- 회사명: ${ctx.companyName}` : ''}
${ctx.serviceName ? `- 서비스/제품: ${ctx.serviceName}` : ''}
- 글 유형: ${topicLabels[ctx.topicType || 'info'] || '정보형'}
- 톤: ${ctx.tone || 'auto'}
${ctx.targetAudience ? `- 타겟: ${ctx.targetAudience}` : ''}
${ctx.targetGender && ctx.targetGender !== 'all' ? `- 성별: ${ctx.targetGender === 'male' ? '남성' : '여성'} 타겟` : ''}
${ctx.blogCategory ? `- 블로그 카테고리: ${ctx.blogCategory}` : ''}
${ctx.fixedKeywords?.length ? `- 고정 키워드: ${ctx.fixedKeywords.join(', ')}` : ''}
${ctx.coreMessage ? `- 핵심 전달 내용: ${ctx.coreMessage}` : ''}

${getIndustryContext(ctx.industry)}

[지시]
위 조건에 맞는 블로그/콘텐츠 제목을 정확히 5개 생성하세요.
${ctx.businessType === 'B2B'
  ? '- 전문성과 신뢰감을 주는 제목 (데이터, 사례, 효과 강조)'
  : '- 클릭을 유도하되 감성적이고 공감가는 제목'
}

[출력 형식]
JSON 배열로만 응답: ["제목1", "제목2", "제목3", "제목4", "제목5"]`

  return applyUserPrompt(base, ctx)
}

// ── STEP4: 핵심 초안 (백그라운드, 유저 비노출)
export function buildDraftPrompt(ctx: PipelineContext): string {
  const base = `당신은 한국 마케팅 콘텐츠 작가입니다.

${getBusinessContext(ctx.businessType)}

[조건]
- 비즈니스 유형: ${ctx.businessType}
- 키워드: ${ctx.keyword}
- 선택된 제목: ${ctx.selectedTitle}
- 글 유형: ${ctx.topicType || '정보형'}
- 톤: ${ctx.tone || 'auto'}
${ctx.companyName ? `- 회사: ${ctx.companyName}` : ''}
${ctx.serviceName ? `- 서비스: ${ctx.serviceName}` : ''}
${ctx.targetAudience ? `- 타겟: ${ctx.targetAudience}` : ''}
${ctx.targetGender && ctx.targetGender !== 'all' ? `- 성별: ${ctx.targetGender === 'male' ? '남성' : '여성'} 타겟` : ''}
${ctx.blogCategory ? `- 블로그 카테고리: ${ctx.blogCategory}` : ''}
${ctx.fixedKeywords?.length ? `- 고정 키워드: ${ctx.fixedKeywords.join(', ')} (본문에 자연스럽게 포함)` : ''}
${ctx.coreMessage ? `- 핵심 전달 내용 (반드시 본문에 포함): ${ctx.coreMessage}` : ''}

${getIndustryContext(ctx.industry)}

[지시]
위 조건으로 핵심 초안을 작성하세요.
- ${ctx.businessType === 'B2B' ? '2000~3000자' : '1500~2000자'} 분량
- 도입/본론(3~4개 소제목)/결론 구조
- SEO 키워드 자연스럽게 3~5회 포함
- 이 초안은 블로그/SNS/영상 콘텐츠의 원본 소스로 사용됩니다
${ctx.businessType === 'B2B'
  ? '- 데이터와 사례 중심으로 작성, 논리적 구조 유지'
  : '- 스토리텔링과 공감 요소 포함, 읽기 쉽게 작성'
}`

  return applyUserPrompt(base, ctx)
}

// ── STEP5: 채널별 변환
const CHANNEL_SPECS: Record<string, { b2b: string; b2c: string }> = {
  blog: {
    b2b: `- 형식: 네이버 블로그 (B2B 전문 콘텐츠)
- 분량: 2500~3500자
- H2/H3 소제목, 데이터 표, 인용 활용
- 본문 내 키워드 5~8회 자연 포함
- 사례/레퍼런스 1~2개 포함
- 맺음말에 상담/문의 CTA`,
    b2c: `- 형식: 네이버 블로그 (B2C 감성 콘텐츠)
- 분량: 1800~2500자
- 읽기 쉬운 문단, 이모지 적절 활용
- 본문 내 키워드 3~5회 자연 포함
- 후기/경험담 형식 추천
- 맺음말에 구매/체험 CTA`,
  },
  threads: {
    b2b: `- 형식: Threads (B2B 인사이트)
- 분량: 200~400자
- 전문적이되 간결한 톤
- 핵심 데이터 1개 + 인사이트
- 해시태그 3~5개 (업계 키워드)`,
    b2c: `- 형식: Threads (B2C 대화형)
- 분량: 100~300자
- 대화체, 이모지 2~4개
- 첫 줄 후킹 (질문/충격적 사실)
- 해시태그 5~10개`,
  },
  instagram: {
    b2b: `- 형식: 인스타그램 캡션 (B2B)
- 분량: 300~500자
- 전문적 인사이트 공유 형식
- 줄바꿈으로 가독성
- 해시태그 10~15개 (업계 전문 태그)
- CTA: 링크/프로필 유도`,
    b2c: `- 형식: 인스타그램 캡션 (B2C)
- 분량: 200~400자
- 이모지 적극 활용
- 감성적 스토리텔링
- 해시태그 15~25개
- CTA: 저장/공유/댓글 유도`,
  },
  facebook: {
    b2b: `- 형식: 페이스북 게시물 (B2B)
- 분량: 500~800자
- 업계 뉴스/트렌드 분석 형식
- 데이터 인사이트 포함
- 링크 공유 유도
- 해시태그 3~5개`,
    b2c: `- 형식: 페이스북 게시물 (B2C)
- 분량: 300~600자
- 대화형 톤, 질문형 도입
- 공감/공유 유도
- 이벤트/혜택 강조
- 해시태그 3~5개`,
  },
}

export function buildChannelPrompt(ctx: PipelineContext, channel: string): string {
  const sourceContent = ctx.blogContent || ctx.draftContent || ''
  const specs = CHANNEL_SPECS[channel]
  if (!specs) return ''

  const channelSpec = ctx.businessType === 'B2B' ? specs.b2b : specs.b2c

  const base = `${getBusinessContext(ctx.businessType)}

[원본 콘텐츠]
${sourceContent.substring(0, 3000)}

[변환 채널 규칙]
${channelSpec}

[톤] ${ctx.tone || 'auto'}
[키워드] ${ctx.keyword}
${ctx.companyName ? `[회사] ${ctx.companyName}` : ''}
${getIndustryContext(ctx.industry)}

위 원본을 채널 특성에 맞게 변환하세요. 원본의 핵심 메시지는 유지하되, 형식/분량/톤을 채널에 맞추세요.`

  return applyUserPrompt(base, ctx)
}

// ── STEP6: 이미지 프롬프트
export function buildImageScriptPrompt(ctx: PipelineContext & {
  aiTool: string
  imageSize: string
  imageStyle: 'photo' | 'illustration'
  styleDetail: string
  channel: string
}): string {
  return `당신은 AI 이미지 생성 프롬프트 전문가입니다.

[콘텐츠 정보]
- 비즈니스 유형: ${ctx.businessType}
- 키워드: ${ctx.keyword}
- 제목: ${ctx.selectedTitle}
- 채널: ${ctx.channel}
- 본문 요약: ${(ctx.blogContent || ctx.draftContent || '').slice(0, 500)}

[이미지 조건]
- AI 도구: ${ctx.aiTool}
- 사이즈: ${ctx.imageSize}
- 스타일: ${ctx.imageStyle === 'photo' ? '실사 사진' : '일러스트/그림'}
- 세부 스타일: ${ctx.styleDetail || '모던 미니멀'}

[한국 시장 컨텍스트 — 반드시 반영]
- 인물: 한국인 또는 동아시아인 모델 (서양인 금지)
- 배경: 한국 도시, 한국식 오피스, 한국 카페, 한국 매장 등 한국 환경
- 텍스트 오버레이: 반드시 한글 사용 (영어 텍스트 금지)
- 분위기: 한국 마케팅 트렌드에 맞는 깔끔하고 밝은 톤, 고채도 파스텔 또는 미니멀 화이트

${ctx.businessType === 'B2B'
  ? `- B2B 이미지 원칙:
  · 전문적이고 깔끔한 비즈니스 분위기
  · 데이터 차트, 인포그래픽, 대시보드 화면 위주
  · 한국 기업 오피스 환경: 강남/판교 스타일 모던 오피스, 한국식 회의실, 한국 비즈니스 미팅 장면
  · 차분한 블루/그레이 계열 색상
  · 텍스트 오버레이: 수치, 퍼센트, 성과 지표 (한글)`
  : `- B2C 이미지 원칙:
  · 감성적이고 밝은 라이프스타일 분위기
  · 한국인 인물 중심, 한국 라이프스타일: 한국 카페, 한국 거리, 한국 주거 공간 등 일상 장면
  · 따뜻한 자연광, 생동감 있는 색상
  · 제품/서비스를 자연스럽게 노출
  · 텍스트 오버레이: 감성 카피, 혜택 강조 (한글)`
}

[지시]
1. 본문 콘텐츠에 어울리는 이미지 프롬프트 3개를 생성
2. 블로그 썸네일 프롬프트 1개 추가 생성
3. 각 프롬프트: 한글 설명 + 영문 프롬프트(${ctx.aiTool}용). prompt_en에 반드시 "Korean" 키워드를 포함하여 한국 환경/인물이 생성되도록 할 것 (예: "Korean office", "Korean woman", "Korean cafe")

[출력 형식] JSON
{
  "images": [
    { "seq": 1, "description_ko": "...", "prompt_en": "...", "placement": "본문 상단" },
    { "seq": 2, "description_ko": "...", "prompt_en": "...", "placement": "본문 중간" },
    { "seq": 3, "description_ko": "...", "prompt_en": "...", "placement": "본문 하단" }
  ],
  "thumbnail": { "description_ko": "...", "prompt_en": "..." }
}`
}

// ── STEP7: 영상 스크립트
export function buildVideoScriptPrompt(ctx: PipelineContext & {
  format: 'short' | 'normal'
  targetChannel: string
  sceneCount: number
  sceneDuration: number
}): string {
  const totalDuration = ctx.sceneCount * ctx.sceneDuration

  return `당신은 영상 콘텐츠 기획자입니다.

${getBusinessContext(ctx.businessType)}

[콘텐츠 정보]
- 키워드: ${ctx.keyword}
- 제목: ${ctx.selectedTitle}
- 본문 요약: ${(ctx.blogContent || ctx.draftContent || '').slice(0, 800)}

[영상 조건]
- 형식: ${ctx.format === 'short' ? '숏폼 (세로 9:16)' : '일반 (가로 16:9)'}
- 채널: ${ctx.targetChannel}
- 장면 수: ${ctx.sceneCount}개
- 장면당 시간: ${ctx.sceneDuration}초
- 총 길이: ${totalDuration}초

${ctx.businessType === 'B2B'
  ? `- B2B 영상 원칙:
  · 설명형/데모 중심, 전문적 내레이션
  · 데이터 시각화(그래프, 차트) 장면 포함
  · 제품/서비스 데모, 대시보드 화면
  · 사례 발표, 전문가 인터뷰 형식
  · CTA: "무료 상담", "데모 신청", "백서 다운로드"`
  : `- B2C 영상 원칙:
  · 감성적이고 빠른 장면 전환
  · 첫 3초 강력한 후킹 (질문/충격/공감)
  · 인물 중심 라이프스타일 장면
  · 트렌디한 BGM, 자막 효과
  · CTA: "지금 바로", "링크 클릭", "댓글로 알려주세요"`
}

[지시]
각 장면별 스토리보드를 작성하세요.

[출력 형식] JSON
{
  "title": "영상 제목",
  "total_duration": ${totalDuration},
  "scenes": [
    {
      "scene": 1,
      "duration": ${ctx.sceneDuration},
      "visual": "화면 설명",
      "narration": "나레이션 텍스트",
      "text_overlay": "화면 자막",
      "transition": "fade"
    }
  ],
  "bgm_suggestion": "배경음악 분위기",
  "hook": "첫 3초 후킹 멘트"
}`
}
