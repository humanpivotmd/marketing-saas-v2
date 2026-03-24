import Card from '@/components/ui/Card'

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-text-primary mb-8">이용약관</h1>

          <div className="space-y-8 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">제1조 (목적)</h2>
              <p>이 약관은 MarketingFlow(이하 &quot;서비스&quot;)가 제공하는 콘텐츠 자동화 서비스의 이용 조건 및 절차, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">제2조 (정의)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>&quot;회원&quot;이란 서비스에 가입하여 이용 계약을 체결한 자를 말합니다.</li>
                <li>&quot;콘텐츠&quot;란 서비스를 통해 생성된 텍스트, 이미지 등의 창작물을 말합니다.</li>
                <li>&quot;플랜&quot;이란 서비스의 이용 범위를 정한 요금제를 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">제3조 (서비스 이용)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>서비스는 AI를 활용한 콘텐츠 생성 보조 도구이며, 생성된 콘텐츠의 정확성을 보장하지 않습니다.</li>
                <li>회원은 생성된 콘텐츠를 검토 후 사용할 책임이 있습니다.</li>
                <li>서비스를 통해 생성된 콘텐츠의 저작권은 회원에게 귀속됩니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">제4조 (요금 및 결제)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>무료 플랜은 별도의 결제 없이 이용할 수 있습니다.</li>
                <li>유료 플랜은 월간 또는 연간 단위로 결제됩니다.</li>
                <li>결제일로부터 7일 이내 환불을 요청할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">제5조 (금지 행위)</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>서비스를 이용한 불법 콘텐츠 생성</li>
                <li>타인의 계정 무단 사용</li>
                <li>서비스 시스템에 대한 무단 접근 또는 방해</li>
                <li>자동화 도구를 이용한 과도한 요청</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">제6조 (면책)</h2>
              <p>서비스는 천재지변, 시스템 장애 등 불가항력적인 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다. AI 생성 콘텐츠의 정확성, 적법성에 대한 최종 책임은 사용자에게 있습니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">제7조 (분쟁 해결)</h2>
              <p>서비스 이용과 관련한 분쟁은 대한민국 법률에 따르며, 관할 법원은 서울중앙지방법원으로 합니다.</p>
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
