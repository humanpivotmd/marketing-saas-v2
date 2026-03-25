import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// POST: 마이그레이션 실행 (admin only)
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const results: { step: string; status: string; error?: string }[] = []

    // 1. users 테이블 확장
    for (const col of [
      { name: 'business_type', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type VARCHAR(10) DEFAULT 'B2C'" },
      { name: 'selected_channels', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_channels TEXT[] DEFAULT '{}'" },
      { name: 'target_audience', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS target_audience TEXT" },
      { name: 'target_gender', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS target_gender VARCHAR(10) DEFAULT 'all'" },
      { name: 'fixed_keywords', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS fixed_keywords TEXT[] DEFAULT '{}'" },
      { name: 'blog_category', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS blog_category VARCHAR(100)" },
      { name: 'industry_id', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS industry_id UUID" },
      { name: 'company_name', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(200)" },
      { name: 'service_name', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS service_name VARCHAR(200)" },
      { name: 'writing_tone', sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS writing_tone VARCHAR(50) DEFAULT 'auto'" },
    ]) {
      const { error } = await supabase.rpc('exec_sql', { sql: col.sql }).single()
      results.push({ step: `users.${col.name}`, status: error ? 'error' : 'ok', error: error?.message })
    }

    // 2~8. 테이블 생성은 Supabase Dashboard에서 003_v3_pipeline.sql 실행 필요
    // 여기서는 테이블 존재 여부만 확인
    for (const table of ['industries', 'projects', 'image_scripts', 'video_scripts', 'user_prompts']) {
      const { error } = await supabase.from(table).select('id').limit(1)
      results.push({
        step: `table.${table}`,
        status: error ? 'missing' : 'exists',
        error: error?.message,
      })
    }

    // contents 확장 확인
    const { error: contentsErr } = await supabase.from('contents').select('project_id').limit(1)
    results.push({
      step: 'contents.project_id',
      status: contentsErr ? 'missing' : 'exists',
      error: contentsErr?.message,
    })

    // plans 확인
    const { data: plans } = await supabase.from('plans').select('name')
    const planNames = (plans || []).map((p: { name: string }) => p.name)
    results.push({
      step: 'plans.starter',
      status: planNames.includes('starter') ? 'exists' : 'missing',
    })
    results.push({
      step: 'plans.premium',
      status: planNames.includes('premium') ? 'exists' : 'missing',
    })

    const allOk = results.every(r => r.status === 'ok' || r.status === 'exists')

    return Response.json({
      success: true,
      data: {
        overall: allOk ? 'ready' : 'needs_migration',
        details: results,
        instruction: allOk
          ? '모든 테이블이 준비되었습니다.'
          : 'Supabase Dashboard SQL Editor에서 003_v3_pipeline.sql을 실행해주세요.',
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
