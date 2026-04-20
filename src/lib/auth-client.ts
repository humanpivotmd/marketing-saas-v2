// ============================================
// 클라이언트 인증 헬퍼 (단일 출처)
// 모든 페이지에서 import 해서 사용
// ============================================

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  // localStorage 우선, sessionStorage fallback (마이그레이션 호환)
  return localStorage.getItem('token') || sessionStorage.getItem('token') || ''
}

export function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}
