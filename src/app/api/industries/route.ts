import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'

// GET: 업종 목록 (일반 유저용, 활성만)
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req)
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('industries')
      .select('id, parent_id, name, level, sort_order')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw error

    // 트리 구조로 변환
    const map = new Map<string, Record<string, unknown>>()
    const roots: Record<string, unknown>[] = []

    ;(data || []).forEach(item => {
      map.set(item.id, { ...item, children: [] })
    })

    ;(data || []).forEach(item => {
      const node = map.get(item.id)!
      if (item.parent_id && map.has(item.parent_id)) {
        const parent = map.get(item.parent_id)!
        ;(parent.children as Record<string, unknown>[]).push(node)
      } else {
        roots.push(node)
      }
    })

    return Response.json({ success: true, data: roots })
  } catch (err) {
    return handleApiError(err)
  }
}
