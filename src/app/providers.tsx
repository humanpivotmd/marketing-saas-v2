'use client'

import { ReactNode } from 'react'
import { UserProvider } from '@/features/member/hooks/useUser'
// Note: useUser.tsx (JSX 포함)

export default function Providers({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>
}
