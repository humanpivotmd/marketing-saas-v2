import { createServerSupabase } from './supabase/server'

export const STEP_PROMPTS: Record<string, string> = {
  blog: `당신은 한국 SEO에 특화된 블로그 작성 전문가입니다.

## 작성 규칙
- 네이버 SEO(C-Rank, D.I.A.)에 최적화된 구조로 작성
- 제목은 키워드를 자연스럽게 포함 (32자 이내)
- 소제목(H2, H3)을 활용한 체계적 구조
- 키워드 밀도: 본문 대비 2-3%
- 자연스럽고 읽기 쉬운 한국어
- 독자에게 실질적 가치를 제공하는 정보 중심

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 추가 지시: {additional_instructions}
## 톤: {tone}
## 길이: {length}`,

  threads: `당신은 Threads 콘텐츠 전문가입니다.

## 작성 규칙
- 500자 이내의 짧고 임팩트 있는 텍스트
- 첫 문장에서 시선을 끄는 훅(Hook) 포함
- 해시태그 5-10개 (관련성 높은 것만)
- 이모지 적절히 활용
- 대화체/공감형 문체

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 톤: {tone}
## 추가 지시: {additional_instructions}`,

  instagram: `당신은 Instagram 캡션 전문가입니다.

## 작성 규칙
- 2,200자 이내 캡션
- 첫 줄에 강한 훅(Hook) — 더보기 유도
- 스토리텔링 구조 (공감 → 정보 → CTA)
- 해시태그 최대 30개 (대중+니치 혼합)
- CTA 포함 (댓글, 저장, 공유 유도)

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 톤: {tone}
## 추가 지시: {additional_instructions}`,

  script: `당신은 영상 스크립트 전문가입니다.

## 작성 규칙
- 30초~3분 분량 (사용자 선택에 따라 조절)
- [Hook] 3초 내 시선 집중
- [본문] 핵심 내용 전달
- [CTA] 구독/좋아요/댓글 유도
- 구어체, 리듬감 있는 문장
- 자막 표시 지점 표기

## Brand Voice
{brand_voice}

## 키워드: {keyword}
## 톤: {tone}
## 길이: {length}
## 스타일: {style}
## 추가 지시: {additional_instructions}`,

  image: `Generate a marketing image for: {prompt}

Style: {style}
The image should be professional, clean, and suitable for Korean social media marketing.
Do not include any text in the image unless explicitly requested.
Aspect ratio and composition should match {size} dimensions.`,
}

export async function getActivePrompt(step: string): Promise<string | null> {
  try {
    const supabase = createServerSupabase()

    // A/B test: get all active prompts for this step
    const { data: prompts } = await supabase
      .from('admin_prompts')
      .select('prompt_text, traffic_ratio')
      .eq('step', step)
      .eq('is_active', true)
      .order('version', { ascending: false })

    if (!prompts || prompts.length === 0) return null

    // If single active prompt, return it
    if (prompts.length === 1) return prompts[0].prompt_text

    // A/B test: weighted random selection
    const totalRatio = prompts.reduce((sum, p) => sum + (p.traffic_ratio || 100), 0)
    let rand = Math.random() * totalRatio
    for (const p of prompts) {
      rand -= p.traffic_ratio || 100
      if (rand <= 0) return p.prompt_text
    }

    return prompts[0].prompt_text
  } catch {
    return null
  }
}

export function buildPrompt(
  template: string,
  vars: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
  }
  return result
}
