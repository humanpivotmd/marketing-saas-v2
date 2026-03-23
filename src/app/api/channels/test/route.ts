import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'

// POST: 연결 테스트 (Instagram/Threads)
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    const { channel_id } = await req.json()

    if (!channel_id) {
      return Response.json({ error: '채널 ID가 필요합니다.' }, { status: 400 })
    }

    const supabase = createServerSupabase()

    const { data: channel, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channel_id)
      .eq('user_id', authUser.userId)
      .single()

    if (error || !channel) {
      return Response.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!channel.access_token) {
      return Response.json({
        success: false,
        connected: false,
        message: '액세스 토큰이 설정되지 않았습니다.',
      })
    }

    const token = decrypt(channel.access_token)

    let connected = false
    let accountInfo = null
    let message = ''

    if (channel.platform === 'instagram') {
      try {
        const res = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${token}`
        )
        if (res.ok) {
          accountInfo = await res.json()
          connected = true
          message = `Instagram 연결 성공: @${accountInfo.username}`
        } else {
          message = 'Instagram 토큰이 유효하지 않습니다.'
        }
      } catch {
        message = 'Instagram API 연결에 실패했습니다.'
      }
    } else if (channel.platform === 'threads') {
      try {
        const res = await fetch(
          `https://graph.threads.net/me?fields=id,username&access_token=${token}`
        )
        if (res.ok) {
          accountInfo = await res.json()
          connected = true
          message = `Threads 연결 성공: @${accountInfo.username}`
        } else {
          message = 'Threads 토큰이 유효하지 않습니다.'
        }
      } catch {
        message = 'Threads API 연결에 실패했습니다.'
      }
    } else {
      message = `${channel.platform} 연결 테스트는 아직 지원하지 않습니다.`
    }

    return Response.json({ success: true, connected, message, account: accountInfo })
  } catch (error) {
    return handleApiError(error)
  }
}
