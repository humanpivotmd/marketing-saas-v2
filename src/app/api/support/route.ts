import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { supportTicketCreateSchema, validateRequest } from '@/lib/validations'
import { supportRateLimit, checkRateLimitOrRespond } from '@/lib/rate-limit'

// GET: 내 문의 목록
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 문의 등록
export async function POST(req: NextRequest) {
  try {
    const rateLimitRes = checkRateLimitOrRespond(req, supportRateLimit, '/api/support')
    if (rateLimitRes) return rateLimitRes

    const authUser = await requireAuth(req)
    const body = await req.json()
    const { subject, message } = validateRequest(supportTicketCreateSchema, body)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: authUser.userId,
        subject,
        message,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
