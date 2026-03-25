// 기본 HTML sanitization — 스크립트 태그 및 이벤트 핸들러 제거
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
}

// 프롬프트 인젝션 방지 — 시스템 지시 무시 시도 감지
export function sanitizePromptInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  const blocked = [
    /ignore.*previous.*instructions/i,
    /ignore.*above/i,
    /disregard.*instructions/i,
    /forget.*everything/i,
    /system\s*prompt/i,
  ]
  let cleaned = input
  for (const pattern of blocked) {
    cleaned = cleaned.replace(pattern, '[blocked]')
  }
  return cleaned.slice(0, 2000) // 최대 2000자 제한
}
