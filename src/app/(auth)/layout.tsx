export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-6 sm:p-6 relative overflow-hidden">
      {/* Background gradient effects */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.03] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-accent-primary) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.02] pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-accent-secondary) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-[420px] shrink-0">
        {children}
      </div>
    </div>
  )
}
