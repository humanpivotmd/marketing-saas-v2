import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { handleApiError } from '@/lib/errors'
import { createServerSupabase } from '@/lib/supabase/server'
import { sendBroadcastEmail } from '@/lib/email'
import { adminMailSchema, validateRequest } from '@/lib/validations'

// POST: 메일 발송
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req)
    requireAdmin(authUser)

    const body = await req.json()
    const { to, subject, body: mailBody } = validateRequest(adminMailSchema, body)

    const result = await sendBroadcastEmail(to, subject, mailBody)

    if (!result.success) {
      return Response.json({ error: '메일 발송에 실패했습니다.', detail: result.error }, { status: 500 })
    }

    // Log the email
    const supabase = createServerSupabase()
    const recipients = Array.isArray(to) ? to : [to]

    for (const email of recipients) {
      await supabase.from('email_logs').insert({
        user_id: authUser.userId,
        to_email: email,
        subject,
        template: 'marketing',
        status: 'sent',
        resend_id: result.id || null,
      })
    }

    return Response.json({ success: true, message: `${recipients.length}건의 메일이 발송되었습니다.` })
  } catch (error) {
    return handleApiError(error)
  }
}
