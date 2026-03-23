import { Resend } from 'resend'
import crypto from 'crypto'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY가 설정되지 않았습니다.')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

function getMailFrom(): string {
  const name = process.env.MAIL_FROM_NAME || 'MarketingFlow'
  const email = process.env.MAIL_FROM || 'onboarding@resend.dev'
  return `${name} <${email}>`
}

function getAppUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

interface SendMailParams {
  to: string | string[]
  subject: string
  html: string
}

interface SendMailResult {
  success: boolean
  id?: string
  error?: unknown
}

async function sendMail({ to, subject, html }: SendMailParams): Promise<SendMailResult> {
  try {
    const client = getResend()
    const { data, error } = await client.emails.send({
      from: getMailFrom(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    if (error) {
      console.error('[Resend Error]', error)
      return { success: false, error }
    }
    return { success: true, id: data?.id }
  } catch (err) {
    console.error('[Resend Exception]', err)
    return { success: false, error: err instanceof Error ? err.message : '알 수 없는 오류' }
  }
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<SendMailResult> {
  const link = `${getAppUrl()}/verify-email?token=${token}`
  return sendMail({
    to: email,
    subject: '[MarketingFlow] 이메일 인증을 완료해주세요',
    html: `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>이메일 인증</h2>
      <p>${escapeHtml(name)}님, 가입해주셔서 감사합니다.</p>
      <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
      <p>인증 링크는 <strong>24시간</strong> 후 만료됩니다.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:6px;text-decoration:none;margin:16px 0">이메일 인증하기</a>
      <p style="color:#888;font-size:12px">버튼이 작동하지 않으면 아래 링크를 복사하세요.<br>${link}</p>
    </div>`,
  })
}

export async function sendResetEmail(
  email: string,
  name: string,
  token: string
): Promise<SendMailResult> {
  const link = `${getAppUrl()}/reset-password?token=${token}`
  return sendMail({
    to: email,
    subject: '[MarketingFlow] 비밀번호 재설정',
    html: `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>비밀번호 재설정</h2>
      <p>${escapeHtml(name)}님, 비밀번호 재설정을 요청하셨습니다.</p>
      <p>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
      <p>링크는 <strong>1시간</strong> 후 만료됩니다.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:6px;text-decoration:none;margin:16px 0">비밀번호 재설정하기</a>
      <p style="color:#888;font-size:12px">본인이 요청하지 않은 경우 이 메일을 무시해주세요.</p>
    </div>`,
  })
}

export async function sendBroadcastEmail(
  to: string | string[],
  subject: string,
  body: string
): Promise<SendMailResult> {
  const htmlBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  return sendMail({
    to,
    subject,
    html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      ${htmlBody}
      <hr style="margin:24px 0;border:none;border-top:1px solid #eee">
      <p style="color:#888;font-size:12px">MarketingFlow | 수신 거부는 고객센터로 문의해주세요.</p>
    </div>`,
  })
}

export function createVerifyToken(): { token: string; expires: Date } {
  return {
    token: crypto.randomUUID(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }
}

export function createResetToken(): { token: string; expires: Date } {
  return {
    token: crypto.randomUUID(),
    expires: new Date(Date.now() + 60 * 60 * 1000),
  }
}
