'use client';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function LoginPreviewPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-accent-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">MarketingFlow</h1>
          <p className="text-sm text-text-secondary mt-1">
            Content automation for Naver top ranking
          </p>
        </div>

        <Card>
          <div className="space-y-5">
            {/* Social Login */}
            <div className="space-y-3">
              <button className="w-full h-11 flex items-center justify-center gap-3 bg-white rounded-lg text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.62z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.99 8.99 0 009 18z" fill="#34A853"/>
                  <path d="M3.97 10.71A5.41 5.41 0 013.68 9c0-.59.1-1.17.29-1.71V4.96H.96A8.99 8.99 0 000 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 00.96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button className="w-full h-11 flex items-center justify-center gap-3 bg-[#FEE500] rounded-lg text-sm font-medium text-[#191919] hover:bg-[#FDD835] transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M9 1C4.58 1 1 3.87 1 7.39c0 2.27 1.5 4.26 3.77 5.38-.16.59-.6 2.14-.68 2.47-.1.42.15.41.32.3.13-.09 2.08-1.41 2.92-1.98.54.08 1.1.12 1.67.12 4.42 0 8-2.87 8-6.29S13.42 1 9 1z" fill="#191919"/>
                </svg>
                Continue with Kakao
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(240,246,252,0.1)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-bg-secondary px-3 text-text-tertiary">or</span>
              </div>
            </div>

            {/* Email Login */}
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
              />
            </div>

            <Button fullWidth>
              Log In
            </Button>

            <div className="flex items-center justify-between">
              <a href="#" className="text-xs text-text-link hover:underline">
                Forgot password?
              </a>
              <a href="#" className="text-xs text-text-link hover:underline">
                Create account
              </a>
            </div>
          </div>
        </Card>

        {/* Signup CTA */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <a href="#" className="text-text-link font-medium hover:underline">
              Start free
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-text-tertiary">
            By continuing, you agree to our{' '}
            <a href="#" className="text-text-tertiary hover:text-text-secondary underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-text-tertiary hover:text-text-secondary underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
