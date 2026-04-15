import { z } from 'zod'

// ─────────────────────────────────────────────
// 공통 파싱 함수
// ─────────────────────────────────────────────

/**
 * Claude가 반환한 텍스트를 Zod 스키마로 검증한다.
 * 마크다운 코드블록(```json ... ```)을 자동으로 제거한다.
 * 검증 실패 시 ZodError를 throw → 호출부에서 재시도 처리
 */
export function parseClaudeJson<T>(
  schema: z.ZodSchema<T>,
  text: string
): T {
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Claude 응답이 JSON 형식이 아닙니다: ${cleaned.slice(0, 200)}`)
  }

  return schema.parse(parsed)
}

// ─────────────────────────────────────────────
// STEP3: 제목 생성 스키마
// /api/generate/titles
// ─────────────────────────────────────────────

export const TitlesOutputSchema = z.object({
  titles: z
    .array(z.string().min(5, '제목이 너무 짧습니다').max(150, '제목이 너무 깁니다'))
    .length(5, '제목은 정확히 5개여야 합니다'),
})

export type TitlesOutput = z.infer<typeof TitlesOutputSchema>

// ─────────────────────────────────────────────
// STEP6: 이미지 프롬프트 스키마
// /api/generate/image-script
// ─────────────────────────────────────────────

const ImageItemSchema = z.object({
  seq: z.number().int().min(1).max(3),
  description_ko: z.string().min(5, '한글 설명이 너무 짧습니다'),
  prompt_en: z.string().min(10, '영문 프롬프트가 너무 짧습니다'),
  placement: z.enum(['본문 상단', '본문 중간', '본문 하단']),
})

const ThumbnailSchema = z.object({
  description_ko: z.string().min(5),
  prompt_en: z.string().min(10),
})

export const ImageScriptOutputSchema = z.object({
  images: z
    .array(ImageItemSchema)
    .length(3, '이미지는 정확히 3개여야 합니다'),
  thumbnail: ThumbnailSchema,
})

export type ImageScriptOutput = z.infer<typeof ImageScriptOutputSchema>

// ─────────────────────────────────────────────
// STEP7: 영상 스크립트 스키마
// /api/generate/video-script
// ─────────────────────────────────────────────

const SceneSchema = z.object({
  scene: z.number().int().min(1),
  duration: z.number().int().min(3).max(10),
  visual: z.string().min(5, '화면 설명이 너무 짧습니다'),
  narration: z.string().min(5, '나레이션이 너무 짧습니다'),
  text_overlay: z.string(),
  transition: z.enum(['fade', 'slide', 'cut', 'zoom']),
})

export const VideoScriptOutputSchema = z.object({
  title: z.string().min(2),
  total_duration: z.number().int().min(1),
  scenes: z
    .array(SceneSchema)
    .min(1, '씬이 최소 1개 이상이어야 합니다')
    .max(5, '씬은 최대 5개까지 허용됩니다'),
  bgm_suggestion: z.string().optional(),
  hook: z.string().optional(),
})

export type VideoScriptOutput = z.infer<typeof VideoScriptOutputSchema>

// ─────────────────────────────────────────────
// 사용 예시 (API route에서)
// ─────────────────────────────────────────────
//
// import { parseClaudeJson, TitlesOutputSchema } from '@/lib/claude-parser'
//
// const response = await anthropic.messages.create({ ... })
// const raw = response.content[0].text
//
// let validated
// try {
//   validated = parseClaudeJson(TitlesOutputSchema, raw)
// } catch {
//   // 1회 재시도: 프롬프트에 "반드시 JSON 배열로만 출력" 추가 후 재호출
//   const retryResponse = await anthropic.messages.create({ ... })
//   validated = parseClaudeJson(TitlesOutputSchema, retryResponse.content[0].text)
// }
//
// return NextResponse.json({ success: true, data: { titles: validated.titles } })
