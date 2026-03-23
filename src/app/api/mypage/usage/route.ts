import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const supabase = createServerSupabase()

    // Get user with plan
    const { data: user } = await supabase
      .from('users')
      .select('plan_id')
      .eq('id', authUser.userId)
      .single()

    // Get plan limits
    let planLimits = {
      name: 'free',
      display_name: 'Free',
      content_limit: 5,
      keyword_limit: 3,
      image_limit: 0,
      saved_keyword_limit: 5,
      channel_limit: 0,
      brand_voice_limit: 1,
    }

    if (user?.plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('name, display_name, content_limit, keyword_limit, image_limit, saved_keyword_limit, channel_limit, brand_voice_limit')
        .eq('id', user.plan_id)
        .single()
      if (plan) planLimits = plan
    }

    // Count this month's usage
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

    const countUsage = async (actionType: string) => {
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authUser.userId)
        .eq('action_type', actionType)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd)
      return count ?? 0
    }

    const [contentUsed, keywordUsed, imageUsed] = await Promise.all([
      countUsage('content_create'),
      countUsage('keyword_analyze'),
      countUsage('image_generate'),
    ])

    // Count saved keywords
    const { count: savedKeywords } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.userId)

    // Count brand voices
    const { count: brandVoices } = await supabase
      .from('brand_voices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.userId)

    // Count channels
    const { count: channels } = await supabase
      .from('channels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.userId)
      .eq('is_active', true)

    const period = `${now.getFullYear()}년 ${now.getMonth() + 1}월`

    return Response.json({
      success: true,
      data: {
        plan: planLimits.name,
        plan_display_name: planLimits.display_name,
        period,
        content: { used: contentUsed, limit: planLimits.content_limit },
        keyword: { used: keywordUsed, limit: planLimits.keyword_limit },
        image: { used: imageUsed, limit: planLimits.image_limit },
        saved_keywords: { used: savedKeywords ?? 0, limit: planLimits.saved_keyword_limit },
        channels: { used: channels ?? 0, limit: planLimits.channel_limit },
        brand_voices: { used: brandVoices ?? 0, limit: planLimits.brand_voice_limit },
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
