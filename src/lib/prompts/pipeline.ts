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
${ctx.industry ? `- 업종: ${ctx.industry}` : ''}

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

${ctx.businessType === 'B2B'
  ? `- B2B 이미지 원칙:
  · 전문적이고 깔끔한 비즈니스 분위기
  · 데이터 차트, 인포그래픽, 대시보드 화면 위주
  · 회의실, 오피스, 비즈니스 미팅 장면
  · 차분한 블루/그레이 계열 색상
  · 텍스트 오버레이: 수치, 퍼센트, 성과 지표`
  : `- B2C 이미지 원칙:
  · 감성적이고 밝은 라이프스타일 분위기
  · 인물 중심, 일상 속 사용 장면
  · 따뜻한 자연광, 생동감 있는 색상
  · 제품/서비스를 자연스럽게 노출
  · 텍스트 오버레이: 감성 카피, 혜택 강조`
}

[지시]
1. 본문 콘텐츠에 어울리는 이미지 프롬프트 3개를 생성
2. 블로그 썸네일 프롬프트 1개 추가 생성
3. 각 프롬프트: 한글 설명 + 영문 프롬프트(${ctx.aiTool}용)

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
