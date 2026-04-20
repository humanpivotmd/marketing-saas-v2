'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authHeaders, getToken } from '@/lib/auth-client'
import React from 'react'

export interface BusinessProfile {
  business_type: string
  selected_channels: string[]
  target_audience: string
  target_gender: string
  fixed_keywords: string[]
  blog_category: string
  industry_id: string
  company_name: string
  service_name: string
  writing_tone: string
}

interface BusinessProfileContextValue {
  profile: BusinessProfile | null
  isSetup: boolean
  loading: boolean
  refresh: () => Promise<void>
}

const BusinessProfileContext = createContext<BusinessProfileContextValue>({
  profile: null,
  isSetup: false,
  loading: true,
  refresh: async () => {},
})

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    try {
      const res = await fetch('/api/mypage/business-profile', { headers: authHeaders() })
      const data = await res.json()
      if (data.success && data.data) {
        setProfile(data.data)
        const p = data.data
        const done = !!(p.business_type && p.selected_channels?.length > 0 && p.company_name)
        localStorage.setItem('business_setup', done ? 'done' : 'needed')
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const isSetup = profile
    ? !!(profile.business_type && profile.selected_channels?.length > 0 && profile.company_name)
    : false

  return React.createElement(
    BusinessProfileContext.Provider,
    { value: { profile, isSetup, loading, refresh: fetchProfile } },
    children
  )
}

export function useBusinessProfile() {
  return useContext(BusinessProfileContext)
}
