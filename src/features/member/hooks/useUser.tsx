'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface UserData {
  id: string
  email: string
  name: string
  role: string
  plan_id: string | null
  onboarding_done: boolean
  [key: string]: unknown
}

interface UserContextValue {
  user: UserData | null
  isLoading: boolean
  setUser: (user: UserData) => void
  updateUser: (partial: Partial<UserData>) => void
  clearUser: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 초기화: sessionStorage에서 복원
  useEffect(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (savedUser) {
      try { setUserState(JSON.parse(savedUser)) } catch { /* ignore */ }
    }
    setIsLoading(false)
  }, [])

  const setUser = useCallback((newUser: UserData) => {
    setUserState(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }, [])

  const updateUser = useCallback((partial: Partial<UserData>) => {
    setUserState(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearUser = useCallback(() => {
    setUserState(null)
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')
  }, [])

  return (
    <UserContext.Provider value={{ user, isLoading, setUser, updateUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
