import Card from '@/components/ui/Card'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <nav className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-b border-[rgba(240,246,252,0.1)]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <a href="/landing" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">MarketingFlow</span>
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-16">
        <Card padding="lg" className="shadow-lg border-2 border-[rgba(240,246,252,0.15)]">
          <h1 className="text-3xl font-bold text-text-primary mb-8">개인정보처리방침</h1>

          <div className="space-y-8 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">1. 수집하는 개인정보 항목</h2>
              <p>MarketingFlow는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>필수: 이메일 주소, 이름, 비밀번호 (암호화 저장)</li>
                <li>선택: 프로필 이미지, 업종 정보</li>
                <li>자동 수집: IP 주소, 브라우저 정보, 서비스 이용 기록</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">2. 개인정보의 수집 및 이용 목적</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 관리: 회원 식별, 가입 확인, 본인 인증</li>
                <li>서비스 제공: AI 콘텐츠 생성, 키워드 분석, 발행 서비스</li>
                <li>결제 처리: 유료 플랜 구독, 결제 내역 관리</li>
                <li>서비스 개선: 이용 통계 분석, 서비스 품질 향상</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">3. 개인정보의 보유 및 이용 기간</h2>
              <p>회원 탈퇴 시 지체 없이 파기하며, 관련 법률에 따라 일정 기간 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>결제 기록: 5년 (전자상거래법)</li>
                <li>서비스 이용 기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">4. 개인정보의 제3자 제공</h2>
              <p>MarketingFlow는 원칙적으로 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 법률에 특별한 규정이 있는 경우는 예외로 합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">5. 개인정보의 안전성 확보 조치</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>비밀번호 암호화 (bcrypt)</li>
                <li>데이터 전송 시 SSL/TLS 암호화</li>
                <li>접근 권한 최소화 및 관리</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">6. 문의처</h2>
              <p>개인정보 관련 문의: support@marketingflow.kr</p>
            </section>

            <p className="text-xs text-text-tertiary pt-4 border-t border-[rgba(240,246,252,0.1)]">
              시행일: 2026년 3월 23일
            </p>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <a href="/landing" className="text-sm text-text-link hover:underline">
            &larr; 홈으로 돌아가기
          </a>
        </div>
      </main>
    </div>
  )
}
