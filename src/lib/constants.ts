// ============================================
// 단일 출처 상수 (Single Source of Truth)
// 모든 하드코딩 데이터를 여기서 관리
// 다른 파일에서는 반드시 import 해서 사용
// ============================================

// ── 비즈니스 유형 ──
export const BUSINESS_TYPES = [
  { value: 'B2B' as const, label: 'B2B', desc: '기업 대상 (논리·데이터 중심)' },
  { value: 'B2C' as const, label: 'B2C', desc: '소비자 대상 (감성·스토리 중심)' },
] as const

// ── 운영 채널 (마이페이지 설정용) ──
export const CHANNEL_OPTIONS = [
  { id: 'blog', label: '블로그', icon: '📝' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
  { id: 'instagram', label: '인스타그램', icon: '📸' },
  { id: 'facebook', label: '페이스북', icon: '👤' },
  { id: 'video', label: '영상', icon: '🎬' },
] as const

// ── 콘텐츠 생성 채널 (콘텐츠 목록/필터용) ──
export const CONTENT_CHANNELS = [
  { id: 'blog', label: '블로그' },
  { id: 'threads', label: 'Threads' },
  { id: 'instagram', label: '인스타그램' },
  { id: 'facebook', label: '페이스북' },
  { id: 'video_script', label: '영상 스크립트' },
] as const

// ── 콘텐츠 생성 채널 (new 페이지용 — 아이콘 포함) ──
export const CONTENT_CREATE_CHANNELS = [
  { id: 'blog', label: '블로그', icon: '📝', desc: '네이버 블로그 최적화 글' },
  { id: 'threads', label: 'Threads', icon: '🧵', desc: 'Threads 게시글' },
  { id: 'instagram', label: '인스타그램', icon: '📸', desc: '인스타그램 캡션' },
  { id: 'script', label: '영상 스크립트', icon: '🎬', desc: '유튜브/릴스 스크립트' },
] as const

// ── 플랫폼 라벨 (SNS 연동 표시용) ──
export const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  threads: 'Threads',
  youtube: 'YouTube',
  naver_blog: '네이버 블로그',
  kakao: '카카오',
  facebook: '페이스북',
}

// ── 글 톤 옵션 ──
export const TONE_OPTIONS = [
  { value: 'auto', label: '자동' },
  { value: 'professional', label: '전문적' },
  { value: 'friendly', label: '친근한' },
  { value: 'formal', label: '격식체' },
  { value: 'conversational', label: '대화체' },
] as const

// ── 글 유형 ──
export const TOPIC_TYPES = [
  { value: 'info' as const, label: '정보형', desc: '독자에게 유용한 정보 제공' },
  { value: 'intro' as const, label: '회사 소개', desc: '회사/브랜드를 알리는 글' },
  { value: 'service' as const, label: '서비스 소개', desc: '서비스 설명 및 장점' },
  { value: 'product' as const, label: '상품 소개', desc: '제품 리뷰 및 소개' },
  { value: 'event' as const, label: '이벤트', desc: '할인·프로모션·이벤트 안내' },
] as const

// ── 프롬프트 적용 모드 ──
export const PROMPT_MODES = [
  { value: 'priority' as const, label: '내 프롬프트 우선', desc: '내 프롬프트를 최우선으로 적용' },
  { value: 'combine' as const, label: '조합', desc: '시스템 프롬프트와 내 프롬프트를 조합' },
  { value: 'reference' as const, label: '참고', desc: '내 프롬프트를 참고 수준으로 반영' },
] as const

// ── 타겟 성별 ──
export const GENDER_OPTIONS = [
  { value: 'all' as const, label: '전체' },
  { value: 'male' as const, label: '남성' },
  { value: 'female' as const, label: '여성' },
] as const
export const VALID_GENDERS = GENDER_OPTIONS.map(g => g.value)

// ── 콘텐츠 상태 ──
export const CONTENT_STATUS_MAP: Record<string, { label: string; variant: string }> = {
  draft: { label: '초안', variant: 'default' },
  generated: { label: '생성됨', variant: 'accent' },
  confirmed: { label: '확정', variant: 'info' },
  edited: { label: '수정됨', variant: 'warning' },
  scheduled: { label: '예약됨', variant: 'info' },
  published: { label: '발행됨', variant: 'success' },
  failed: { label: '실패', variant: 'danger' },
}

// ── 채널별 프롬프트 설정 (마이페이지) ──
export const PROMPT_STEPS = [
  { step: 'blog', label: '블로그', description: '네이버 블로그 콘텐츠 생성 시 적용' },
  { step: 'instagram', label: '인스타그램', description: '인스타그램 캡션 생성 시 적용' },
  { step: 'threads', label: 'Threads', description: 'Threads 게시글 생성 시 적용' },
  { step: 'facebook', label: '페이스북', description: '페이스북 게시물 생성 시 적용' },
  { step: 'image', label: '이미지', description: 'AI 이미지 프롬프트 생성 시 적용' },
  { step: 'video_script', label: '영상 스크립트', description: '영상 스크립트 생성 시 적용' },
] as const

// ── 네이버 블로그 주제 33개 ──
export const NAVER_BLOG_TOPICS = [
  { group: '엔터테인먼트·예술', topics: ['문학·책', '영화', '미술·디자인', '공연·전시', '음악', '드라마', '스타·연예인', '만화·애니', '방송'] },
  { group: '생활·노하우·쇼핑', topics: ['일상·생각', '육아·결혼', '애완·반려동물', '쇼핑', '요리·레시피', '상품리뷰', '원예·재배'] },
  { group: '취미·여가·여행', topics: ['게임', '스포츠', '사진', '가드닝', '세계여행', '맛집'] },
  { group: '지식·동향', topics: ['IT·컴퓨터', '사회·정치', '건강·의학', '비즈니스·경제', '어학·외국어', '교육·학문', '법률', '과학·기술', '인테리어', '자동차', '패션·뷰티'] },
] as const

// ── 브랜드 보이스 프리셋 ──
export const BRAND_VOICE_PRESETS = [
  { name: '카페/음식점', industry: '카페/음식점', tone: '친근한', description: '따뜻하고 감성적인 카페/음식점 마케팅 톤' },
  { name: '뷰티/패션', industry: '뷰티/패션', tone: '트렌디한', description: '세련되고 트렌디한 뷰티/패션 브랜드 톤' },
  { name: '교육/학원', industry: '교육', tone: '전문적인', description: '신뢰감 있는 교육 전문가 톤' },
  { name: '부동산', industry: '부동산', tone: '신뢰감 있는', description: '전문적이고 신뢰를 주는 부동산 중개 톤' },
  { name: 'IT/테크', industry: 'IT/테크', tone: '혁신적인', description: '혁신적이고 미래지향적인 테크 기업 톤' },
] as const

// ── 영상 스크립트 옵션 ──
export const VIDEO_FORMAT_OPTIONS = [
  { value: 'short' as const, label: '숏폼 (세로)', desc: '60초 이내, 릴스/쇼츠' },
  { value: 'normal' as const, label: '일반 (가로)', desc: '3~5분, 유튜브' },
] as const

export const VIDEO_CHANNEL_OPTIONS = [
  { value: 'youtube', label: '유튜브' },
  { value: 'instagram_reels', label: '인스타 릴스' },
  { value: 'tiktok', label: '틱톡' },
] as const

export const VIDEO_STYLES = ['미니멀', '모던', '빈티지', '도시적', '세련된', '따뜻한', '전문적'] as const

// ── 콘텐츠 스타일 (단건 생성용) ──
export const CONTENT_STYLES = ['정보 전달', '스토리텔링', '리스트형', '비교 분석', '가이드'] as const

// ── 사용량 액션 타입 매핑 ──
export const ACTION_TYPE_MAP: Record<string, string> = {
  blog: 'content_create',
  threads: 'content_create',
  instagram: 'content_create',
  facebook: 'content_create',
  script: 'content_create',
  video_script: 'content_create',
  keyword: 'keyword_analyze',
  image: 'image_generate',
}

// ── 채널 라벨 맵 (UI 표시용 단일 출처) ──
export const CHANNEL_LABEL_MAP: Record<string, string> = {
  blog: '블로그',
  threads: 'Threads',
  instagram: '인스타그램',
  facebook: '페이스북',
  video_script: '영상 스크립트',
  script: '영상 스크립트',
}

// ── 채널 배지 색상 맵 ──
export const CHANNEL_COLOR_MAP: Record<string, string> = {
  blog: 'bg-green-500/15 text-green-400',
  threads: 'bg-purple-500/15 text-purple-400',
  instagram: 'bg-pink-500/15 text-pink-400',
  facebook: 'bg-blue-500/15 text-blue-400',
  video_script: 'bg-orange-500/15 text-orange-400',
  script: 'bg-orange-500/15 text-orange-400',
}

// ── 채널 점(dot) 색상 맵 (캘린더 등) ──
export const CHANNEL_DOT_MAP: Record<string, string> = {
  blog: 'bg-green-400',
  threads: 'bg-purple-400',
  instagram: 'bg-pink-400',
  facebook: 'bg-blue-400',
  video_script: 'bg-orange-400',
  script: 'bg-orange-400',
}

// ── 이미지 프롬프트 생성 옵션 ──
export const AI_TOOL_OPTIONS = [
  'Midjourney', 'DALL-E', 'Stable Diffusion', 'Gemini', 'Ideogram', 'Flux',
] as const

export const IMAGE_STYLE_DETAIL_OPTIONS = [
  '미니멀', '모던', '빈티지', '팝아트', '수채화', '3D', '플랫', '도시적', '세련된',
] as const

export const IMAGE_SIZE_OPTIONS: Record<string, { label: string; value: string }[]> = {
  blog: [{ label: '1200x630 (썸네일)', value: '1200x630' }, { label: '800x800', value: '800x800' }],
  instagram: [{ label: '1080x1080 (피드)', value: '1080x1080' }, { label: '1080x1920 (스토리)', value: '1080x1920' }],
  threads: [{ label: '1080x1080', value: '1080x1080' }],
  facebook: [{ label: '1200x630', value: '1200x630' }, { label: '1080x1920 (스토리)', value: '1080x1920' }],
}

export const IMAGE_SIZE_DEFAULTS: Record<string, string> = {
  blog: '1200x630',
  instagram: '1080x1080',
  threads: '1080x1080',
  facebook: '1200x630',
}
