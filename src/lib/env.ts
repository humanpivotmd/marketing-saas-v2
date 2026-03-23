import { z } from 'zod'

const envSchema = z.object({
  // Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET은 32자 이상이어야 합니다'),

  // Optional with defaults
  ENCRYPTION_KEY: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().optional(),
  NAVER_AD_CUSTOMER_ID: z.string().optional(),
  NAVER_AD_ACCESS_KEY: z.string().optional(),
  NAVER_AD_SECRET_KEY: z.string().optional(),
  DATALAB_CLIENT_ID: z.string().optional(),
  DATALAB_CLIENT_SECRET: z.string().optional(),
  APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  MAIL_FROM: z.string().email().optional(),
  MAIL_FROM_NAME: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

let validated = false

export function validateEnv(): Env {
  if (validated) return process.env as unknown as Env

  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    console.error(`[ENV] 환경변수 검증 실패:\n${missing}`)

    if (process.env.NODE_ENV === 'production') {
      throw new Error('필수 환경변수가 누락되었습니다.')
    }
  }

  validated = true
  return (result.success ? result.data : process.env) as unknown as Env
}
