// ============================================
// 페이지네이션 공통 유틸 (단일 출처)
// ============================================

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export function parsePagination(url: URL, defaults?: {
  defaultLimit?: number
  maxLimit?: number
}): PaginationParams {
  const defaultLimit = defaults?.defaultLimit ?? 20
  const maxLimit = defaults?.maxLimit ?? 100

  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1)
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit)) || defaultLimit), maxLimit)
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

export function paginatedResponse(
  data: unknown[],
  count: number | null,
  params: { page: number; limit: number }
): Response {
  const total = count || 0
  return Response.json({
    success: true,
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  })
}
