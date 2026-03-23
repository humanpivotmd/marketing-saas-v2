import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { scheduleCreateSchema, validateRequest } from '@/lib/validations'

// GET: 스케줄 목록
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const status = url.searchParams.get('status')

    let query = supabase
      .from('schedules')
      .select('*, contents(id, title, channel, status)')
      .eq('user_id', user.userId)
      .order('scheduled_at', { ascending: true })

    if (from) query = query.gte('scheduled_at', from)
    if (to) query = query.lte('scheduled_at', to)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return Response.json({ success: true, data: data || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 스케줄 등록
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(scheduleCreateSchema, body)
    const supabase = createServerSupabase()

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        user_id: user.userId,
        content_id: data.content_id,
        channel_id: data.channel_id || null,
        scheduled_at: data.scheduled_at,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data: schedule }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
