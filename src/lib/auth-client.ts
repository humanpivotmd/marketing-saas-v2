// ============================================
// 클라이언트 인증 헬퍼 (단일 출처)
// 모든 페이지에서 import 해서 사용
// ============================================

export function getToken(): string {
  return sessionStorage.getItem('token') || ''
}

export function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}
