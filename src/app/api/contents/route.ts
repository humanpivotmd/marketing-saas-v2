import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import { validateRequest } from '@/lib/validations'
import { parsePagination, paginatedResponse } from '@/lib/pagination'

const contentCreateSchema = z.object({
  keyword: z.string().max(200).optional(),
  channel: z.enum(['blog', 'threads', 'instagram', 'facebook', 'video_script', 'script']),
  title: z.string().max(500).optional(),
  body: z.string().optional(),
  status: z.enum(['draft', 'generated', 'confirmed', 'edited', 'scheduled', 'published', 'failed']).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

// GET: 콘텐츠 목록
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const channel = url.searchParams.get('channel')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const ALLOWED_SORTS = ['created_at', 'title', 'updated_at'] as const
    const sortParam = url.searchParams.get('sort') || 'created_at'
    const sort = ALLOWED_SORTS.includes(sortParam as typeof ALLOWED_SORTS[number]) ? sortParam : 'created_at'
    const order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    const { page, limit, offset } = parsePagination(url)

    let query = supabase
      .from('contents')
      .select('*', { count: 'exact' })
      .eq('user_id', user.userId)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    if (channel) query = query.eq('channel', channel)
    if (status) query = query.eq('status', status)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, count, error } = await query
    if (error) throw error

    return paginatedResponse(data || [], count, { page, limit })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: 콘텐츠 수동 저장
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    const body = await req.json()
    const data = validateRequest(contentCreateSchema, body)
    const supabase = createServerSupabase()

    const { data: content, error } = await supabase
      .from('contents')
      .insert({
        user_id: user.userId,
        keyword: data.keyword || null,
        channel: data.channel,
        title: data.title || null,
        body: data.body || null,
        status: data.status || 'draft',
        metadata: data.meta || {},
      })
      .select()
      .single()

    if (error) throw error

    return Response.json({ success: true, data: content }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
