export class AppError extends Error {
  public statusCode: number
  public code: string

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export class AuthError extends AppError {
  constructor(message: string = '인증이 필요합니다.') {
    super(message, 401, 'AUTH_REQUIRED')
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '권한이 없습니다.') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '리소스를 찾을 수 없습니다.') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '입력값이 올바르지 않습니다.') {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class UsageLimitError extends AppError {
  constructor(message: string = '사용량 한도를 초과했습니다.') {
    super(message, 403, 'USAGE_LIMIT_EXCEEDED')
    this.name = 'UsageLimitError'
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  const message = process.env.NODE_ENV === 'production'
    ? '서버 오류가 발생했습니다.'
    : error instanceof Error ? error.message : '알 수 없는 오류'

  console.error('[API Error]', error)

  return Response.json(
    { success: false, error: message, code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
