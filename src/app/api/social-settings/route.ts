import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'
import { socialSettingsUpdateSchema, validateRequest } from '@/lib/validations'
import { socialSettingsRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

// GET: SNS 연동 설정 조회 (복호화)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Return masked tokens - never expose full tokens to frontend
    const masked = (data || []).map((ch) => ({
      ...ch,
      access_token: ch.access_token ? '••••••••' : null,
      refresh_token: ch.refresh_token ? '••••••••' : null,
      has_access_token: !!ch.access_token,
      has_refresh_token: !!ch.refresh_token,
    }))

    return Response.json({ success: true, data: masked })
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT: SNS 연동 설정 저장 (암호화)
export async function PUT(req: NextRequest) {
  try {
    const rateLimitRes = checkRateLimitOrRespond(req, socialSettingsRateLimit, '/api/social-settings')
    if (rateLimitRes) return rateLimitRes

    const authUser = await requireAuth(req)
    const body = await req.json()
    const { channel_id, access_token, refresh_token, account_name, account_id } = validateRequest(socialSettingsUpdateSchema, body)

    const supabase = createServerSupabase()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (access_token) updates.access_token = encrypt(access_token)
    if (refresh_token) updates.refresh_token = encrypt(refresh_token)
    if (account_name) updates.account_name = account_name
    if (account_id) updates.account_id = account_id

    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', channel_id)
      .eq('user_id', authUser.userId)
      .select()
      .single()

    if (error || !data) {
      return Response.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return handleApiError(error)
  }
}
