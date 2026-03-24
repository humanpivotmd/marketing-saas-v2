'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력하세요')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.')
        return
      }

      // 관리자 권한 체크
      if (!['admin', 'super_admin'].includes(data.user.role)) {
        setError('관리자 권한이 없는 계정입니다.')
        return
      }

      sessionStorage.setItem('token', data.session.access_token)
      sessionStorage.setItem('user', JSON.stringify(data.user))
      router.push('/admin')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-xl bg-accent-error flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-sm">AD</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">관리자 로그인</h1>
        <p className="text-sm text-text-secondary mt-1">MarketingFlow 관리자 전용</p>
      </div>

      <Card>
        <div className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-accent-error/10 border border-accent-error/20" role="alert">
              <p className="text-sm text-accent-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="관리자 이메일"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button fullWidth loading={loading} type="submit">
              관리자 로그인
            </Button>
          </form>

          <div className="text-center">
            <a href="/login" className="text-xs text-text-tertiary hover:text-text-secondary">
              일반 로그인으로 돌아가기
            </a>
          </div>
        </div>
      </Card>
    </main>
  )
}
