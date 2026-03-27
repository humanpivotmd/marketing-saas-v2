'use client'

import { useState, useCallback } from 'react'

export interface Toast {
  message: string
  variant: 'success' | 'error'
}

interface UseAsyncActionReturn {
  loading: boolean
  toast: Toast | null
  clearToast: () => void
  showToast: (message: string, variant?: 'success' | 'error') => void
  run: <T>(
    fn: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
    }
  ) => Promise<T | undefined>
}

export function useAsyncAction(initialLoading = false): UseAsyncActionReturn {
  const [loading, setLoading] = useState(initialLoading)
  const [toast, setToast] = useState<Toast | null>(null)

  const clearToast = useCallback(() => setToast(null), [])
  const showToast = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ message, variant })
  }, [])

  const run = useCallback(async <T>(
    fn: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | undefined> => {
    setLoading(true)
    try {
      const result = await fn()
      if (options?.successMessage) {
        setToast({ message: options.successMessage, variant: 'success' })
      }
      options?.onSuccess?.(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setToast({
        message: options?.errorMessage || error.message || '오류가 발생했습니다.',
        variant: 'error',
      })
      options?.onError?.(error)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, toast, clearToast, showToast, run }
}
