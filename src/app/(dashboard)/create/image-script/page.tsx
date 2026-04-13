'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ImageScriptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id') || ''

  useEffect(() => {
    router.replace(`/create/channel-write?project_id=${projectId}`)
  }, [projectId, router])

  return null
}
