import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'
import { channelCreateSchema, validateRequest } from '@/lib/validations'
import { channelRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

// GET: 연동된 채널 목록
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('channels')
      .select('id, platform, account_name, account_id, is_active, token_expires, created_at, updated_at')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 채널 연동
export async function POST(req: NextRequest) {
  try {
    const rateLimitRes = checkRateLimitOrRespond(req, channelRateLimit, '/api/channels')
    if (rateLimitRes) return rateLimitRes

    const authUser = await requireAuth(req)
    const body = await req.json()
    const { platform, account_name, account_id, access_token, refresh_token } = validateRequest(channelCreateSchema, body)

    const supabase = createServerSupabase()

    const insertData: Record<string, unknown> = {
      user_id: authUser.userId,
      platform,
      account_name,
      account_id: account_id || null,
      is_active: true,
    }

    if (access_token) insertData.access_token = encrypt(access_token)
    if (refresh_token) insertData.refresh_token = encrypt(refresh_token)

    const { data, error } = await supabase
      .from('channels')
      .insert(insertData)
      .select('id, platform, account_name, account_id, is_active, created_at')
      .single()

    if (error) throw error

    return Response.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
