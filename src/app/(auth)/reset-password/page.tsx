'use client'

import { useState, type FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Toast from '@/components/ui/Toast'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' })

  if (!token) {
    return (
      <div>
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">비밀번호 재설정</h1>
        </div>
        <Card>
          <div className="text-center py-4" role="alert">
            <p className="text-sm text-accent-error mb-4">유효하지 않은 재설정 링크입니다.</p>
            <a href="/login">
              <Button variant="secondary">로그인 페이지로</Button>
            </a>
          </div>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setConfirmError('')

    if (!password || password.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다')
      return
    }
    if (!/[A-Za-z]/.test(password)) {
      setPasswordError('비밀번호에 영문자를 포함하세요')
      return
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('비밀번호에 숫자를 포함하세요')
      return
    }
    if (password !== confirmPassword) {
      setConfirmError('비밀번호가 일치하지 않습니다')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (res.ok) {
        setToast({ visible: true, message: '비밀번호가 재설정되었습니다.', variant: 'success' })
        setTimeout(() => router.push('/login?reset=1'), 1500)
      } else {
        setToast({ visible: true, message: data.error || '재설정에 실패했습니다.', variant: 'error' })
      }
    } catch {
      setToast({ visible: true, message: '네트워크 오류가 발생했습니다.', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">비밀번호 재설정</h1>
        <p className="text-sm text-text-secondary mt-1">새로운 비밀번호를 설정해주세요.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="새 비밀번호"
            type="password"
            placeholder="8자 이상, 영문+숫자"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            autoComplete="new-password"
            required
            aria-required="true"
            hint="8자 이상, 영문과 숫자 포함"
          />
          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmError}
            autoComplete="new-password"
            required
            aria-required="true"
          />
          <Button fullWidth loading={loading} type="submit">
            비밀번호 변경
          </Button>
        </form>
      </Card>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}
