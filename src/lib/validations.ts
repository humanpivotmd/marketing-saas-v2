import { z } from 'zod'
import { ValidationError } from './errors'

// --- Auth Schemas ---
export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
})

export const registerSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '비밀번호에 영문자를 포함하세요')
    .regex(/[0-9]/, '비밀번호에 숫자를 포함하세요'),
  name: z.string().min(1, '이름을 입력하세요').max(100),
})

// --- Keyword Schemas ---
export const keywordAnalyzeSchema = z.object({
  keyword: z.string().min(1, '키워드를 입력하세요').max(200),
  period: z.number().int().min(1).max(365).optional(),
})

// --- Content Schemas ---
export const contentGenerateSchema = z.object({
  keyword: z.string().min(1).max(200),
  type: z.enum(['blog', 'threads', 'instagram', 'script']),
  brand_voice_id: z.string().uuid().optional(),
  tone: z.string().max(50).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  additional_instructions: z.string().max(1000).optional(),
})

// --- Image Schemas ---
export const imageGenerateSchema = z.object({
  prompt: z.string().min(1).max(500),
  style: z.enum(['photo', 'illustration', 'minimal', 'vintage']).optional(),
  size: z.enum(['1200x630', '1080x1080', '1080x1920']).optional(),
  content_id: z.string().uuid().optional(),
})

// --- Brand Voice Schemas ---
export const brandVoiceCreateSchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().max(50).optional(),
  tone: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  target_audience: z.string().max(500).optional(),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  banned_words: z.array(z.string().max(50)).max(20).optional(),
  required_words: z.array(z.string().max(50)).max(20).optional(),
  sample_content: z.string().max(5000).optional(),
  is_default: z.boolean().optional(),
})

// --- Schedule Schemas ---
export const scheduleCreateSchema = z.object({
  content_id: z.string().uuid(),
  channel_id: z.string().uuid().optional(),
  scheduled_at: z.string().datetime(),
})

// --- Support Ticket Schemas ---
export const supportTicketCreateSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

// --- Profile Schema ---
export const profileUpdateSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(100, '이름은 100자 이하여야 합니다').transform((v) => v.trim()),
})

// --- Channel Schema ---
export const channelCreateSchema = z.object({
  platform: z.enum(['instagram', 'threads', 'youtube', 'naver_blog', 'kakao'], { message: '지원하지 않는 플랫폼입니다.' }),
  account_name: z.string().min(1, '계정명은 필수입니다').max(200),
  account_id: z.string().max(200).optional().nullable(),
  access_token: z.string().max(2000).optional(),
  refresh_token: z.string().max(2000).optional(),
})

// --- Social Settings Schema ---
export const socialSettingsUpdateSchema = z.object({
  channel_id: z.string().uuid('올바른 채널 ID가 필요합니다.'),
  access_token: z.string().max(2000).optional(),
  refresh_token: z.string().max(2000).optional(),
  account_name: z.string().max(200).optional(),
  account_id: z.string().max(200).optional(),
})

// --- Admin Mail Schema ---
export const adminMailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
})

// --- Validation Helper ---
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(', ')
    throw new ValidationError(message)
  }
  return result.data
}
