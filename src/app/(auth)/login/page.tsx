'use client'

import { useState, useEffect, type FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'

type AuthMode = 'login' | 'register'
type RegisterStep = 1 | 2 | 3 | 4

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<AuthMode>('login')
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1)
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  // Errors
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [nameError, setNameError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [generalError, setGeneralError] = useState('')

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', variant: 'success' as 'success' | 'error' | 'info' })

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      setToast({ visible: true, message: '이메일 인증이 완료되었습니다. 로그인해주세요.', variant: 'success' })
    }
    if (searchParams.get('reset') === '1') {
      setToast({ visible: true, message: '비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.', variant: 'success' })
    }
  }, [searchParams])

  const clearErrors = () => {
    setEmailError('')
    setPasswordError('')
    setNameError('')
    setConfirmError('')
    setGeneralError('')
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    clearErrors()

    if (!email) { setEmailError('이메일을 입력하세요'); return }
    if (!password) { setPasswordError('비밀번호를 입력하세요'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setGeneralError(data.error || '로그인에 실패했습니다.')
        return
      }

      sessionStorage.setItem('token', data.session.access_token)
      sessionStorage.setItem('user', JSON.stringify(data.user))

      if (!data.user.onboarding_done) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setGeneralError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    clearErrors()

    // Step validation
    if (registerStep === 1) {
      if (!email) { setEmailError('이메일을 입력하세요'); return }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('올바른 이메일 주소를 입력하세요'); return }
      setRegisterStep(2)
      return
    }
    if (registerStep === 2) {
      if (!name) { setNameError('이름을 입력하세요'); return }
      setRegisterStep(3)
      return
    }
    if (registerStep === 3) {
      if (!password || password.length < 8) { setPasswordError('비밀번호는 8자 이상이어야 합니다'); return }
      if (!/[A-Za-z]/.test(password)) { setPasswordError('비밀번호에 영문자를 포함하세요'); return }
      if (!/[0-9]/.test(password)) { setPasswordError('비밀번호에 숫자를 포함하세요'); return }
      if (password !== confirmPassword) { setConfirmError('비밀번호가 일치하지 않습니다'); return }
      setRegisterStep(4)
      return
    }

    // Step 4: submit
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()

      if (!res.ok) {
        setGeneralError(data.error || '회원가입에 실패했습니다.')
        return
      }

      // Auto-login after register
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginRes.json()

      if (loginRes.ok) {
        sessionStorage.setItem('token', loginData.session.access_token)
        sessionStorage.setItem('user', JSON.stringify(loginData.user))
        router.push('/onboarding')
      } else {
        setToast({ visible: true, message: '가입 완료! 로그인해주세요.', variant: 'success' })
        setMode('login')
      }
    } catch {
      setGeneralError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setShowForgotModal(false)
      setToast({ visible: true, message: '비밀번호 재설정 이메일이 발송되었습니다.', variant: 'info' })
    } catch {
      setToast({ visible: true, message: '오류가 발생했습니다.', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setRegisterStep(1)
    clearErrors()
    setGeneralError('')
  }

  return (
    <main>
      {/* Skip link */}
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-lg focus:text-sm"
      >
        본문으로 건너뛰기
      </a>

      {/* Logo */}
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">M</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">MarketingFlow</h1>
        <p className="text-sm text-text-secondary mt-1">
          네이버 상위 노출을 위한 콘텐츠 자동화
        </p>
      </div>

      <Card>
        <div id="login-form" className="space-y-6">
          {/* Social Login */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full h-11 min-h-[44px] flex items-center justify-center gap-3 bg-white rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
              aria-label="Google 계정으로 계속하기"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.62z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 009 18z" fill="#34A853"/>
                <path d="M3.97 10.71A5.41 5.41 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A8.99 8.99 0 000 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google로 계속하기
            </button>

            <button
              type="button"
              className="w-full h-11 min-h-[44px] flex items-center justify-center gap-3 bg-[#FEE500] rounded-lg text-sm font-medium text-[#191919] hover:bg-[#FDD835] transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
              aria-label="카카오 계정으로 계속하기"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M9 1C4.58 1 1 3.87 1 7.39c0 2.27 1.5 4.26 3.77 5.38-.16.59-.6 2.14-.68 2.47-.1.42.15.41.32.3.13-.09 2.08-1.41 2.92-1.98.54.08 1.1.12 1.67.12 4.42 0 8-2.87 8-6.29S13.42 1 9 1z" fill="#191919"/>
              </svg>
              카카오로 계속하기
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(240,246,252,0.1)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-bg-secondary px-3 text-text-tertiary">또는</span>
            </div>
          </div>

          {generalError && (
            <div className="p-3 rounded-lg bg-accent-error/10 border border-accent-error/20" role="alert">
              <p className="text-sm text-accent-error">{generalError}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="이메일"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                autoComplete="email"
                required
                aria-required="true"
              />
              <Input
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                autoComplete="current-password"
                required
                aria-required="true"
              />
              <Button fullWidth loading={loading} type="submit">
                로그인
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2" role="progressbar" aria-valuenow={registerStep} aria-valuemin={1} aria-valuemax={4} aria-label={`회원가입 ${registerStep}/4 단계`}>
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      step <= registerStep ? 'bg-accent-primary' : 'bg-bg-tertiary'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="sr-only" aria-live="polite">{registerStep}/4 단계</p>

              {registerStep === 1 && (
                <Input
                  label="이메일"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  autoComplete="email"
                  autoFocus
                  required
                  aria-required="true"
                />
              )}
              {registerStep === 2 && (
                <Input
                  label="이름"
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={nameError}
                  autoComplete="name"
                  autoFocus
                  required
                  aria-required="true"
                />
              )}
              {registerStep === 3 && (
                <>
                  <Input
                    label="비밀번호"
                    type="password"
                    placeholder="8자 이상, 영문+숫자"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passwordError}
                    autoComplete="new-password"
                    autoFocus
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
                </>
              )}
              {registerStep === 4 && (
                <div className="text-center py-4">
                  <p className="text-sm text-text-secondary mb-1">가입 정보를 확인해주세요</p>
                  <p className="text-base font-medium text-text-primary">{email}</p>
                  <p className="text-sm text-text-secondary mt-1">{name}</p>
                </div>
              )}

              <Button fullWidth loading={loading} type="submit">
                {registerStep < 4 ? '다음' : '가입하기'}
              </Button>

              {registerStep > 1 && (
                <Button
                  fullWidth
                  variant="ghost"
                  type="button"
                  onClick={() => setRegisterStep((s) => (s - 1) as RegisterStep)}
                >
                  이전
                </Button>
              )}
            </form>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-text-link hover:underline min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary rounded"
            >
              비밀번호를 잊으셨나요?
            </button>
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-text-link hover:underline min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-accent-primary rounded"
            >
              {mode === 'login' ? '회원가입' : '로그인'}
            </button>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-xs text-text-tertiary">
          계속하면{' '}
          <a href="/terms" className="text-text-tertiary hover:text-text-secondary underline">이용약관</a>
          {' '}및{' '}
          <a href="/privacy" className="text-text-tertiary hover:text-text-secondary underline">개인정보처리방침</a>
          에 동의하게 됩니다.
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal open={showForgotModal} onClose={() => setShowForgotModal(false)} title="비밀번호 찾기" size="sm">
        <form onSubmit={handleForgotPassword}>
          <p className="text-sm text-text-secondary mb-4">
            가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>
          <Input
            label="이메일"
            type="email"
            placeholder="you@example.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            autoComplete="email"
            required
            aria-required="true"
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowForgotModal(false)}>
              취소
            </Button>
            <Button size="sm" loading={loading} type="submit">
              재설정 링크 발송
            </Button>
          </div>
        </form>
      </Modal>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </main>
  )
}
