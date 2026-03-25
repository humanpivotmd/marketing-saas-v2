import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 업종 목록 (트리 구조)
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const url = new URL(req.url)
    const flat = url.searchParams.get('flat') === 'true'
    const activeOnly = url.searchParams.get('active') !== 'false'

    let query = supabase
      .from('industries')
      .select('*')
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true })

    if (activeOnly) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error

    if (flat) {
      return Response.json({ success: true, data })
    }

    // 트리 구조로 변환
    const tree = buildTree(data || [])
    return Response.json({ success: true, data: tree })
  } catch (err) {
    return handleApiError(err)
  }
}

// POST: 업종 추가
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)
    const supabase = createServerSupabase()

    const body = await req.json()
    const { name, parent_id, level, sort_order, is_active } = body

    if (!name?.trim()) {
      return Response.json({ success: false, error: '업종명을 입력하세요.' }, { status: 400 })
    }

    const insertData: Record<string, unknown> = {
      name: name.trim(),
      level: level || (parent_id ? 2 : 1),
      sort_order: sort_order || 0,
      is_active: is_active !== false,
    }
    if (parent_id) insertData.parent_id = parent_id

    const { data, error } = await supabase
      .from('industries')
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return Response.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}

function buildTree(items: Record<string, unknown>[]) {
  const map = new Map<string, Record<string, unknown>>()
  const roots: Record<string, unknown>[] = []

  items.forEach(item => {
    map.set(item.id as string, { ...item, children: [] })
  })

  items.forEach(item => {
    const node = map.get(item.id as string)!
    if (item.parent_id && map.has(item.parent_id as string)) {
      const parent = map.get(item.parent_id as string)!
      ;(parent.children as Record<string, unknown>[]).push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}
