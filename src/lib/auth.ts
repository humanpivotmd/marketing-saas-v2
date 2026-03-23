import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { AuthError, ForbiddenError } from './errors'

const BCRYPT_ROUNDS = 12

// --- JWT Token Payload ---
export interface TokenPayload {
  id: string
  userId: string
  email: string
  name: string
  role: string
  plan: string
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.')
  return secret
}

// --- JWT Token Verification ---
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as TokenPayload
  return decoded
}

// --- JWT Token Signing ---
export function signToken(
  payload: Omit<TokenPayload, 'userId'> & { userId?: string },
  expiresIn: string = '7d'
): string {
  const fullPayload = {
    ...payload,
    userId: payload.userId || payload.id,
  }
  return jwt.sign(fullPayload, getJwtSecret(), { expiresIn } as jwt.SignOptions)
}

// --- Password Hashing ---
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

// --- Password Comparison ---
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// --- Extract Auth User from Request ---
export async function getAuthUser(req: Request): Promise<TokenPayload | null> {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return null
    return verifyToken(token)
  } catch {
    return null
  }
}

// --- Require Auth (throws on failure) ---
export async function requireAuth(req: Request): Promise<TokenPayload> {
  const user = await getAuthUser(req)
  if (!user) {
    throw new AuthError()
  }
  return user
}

// --- Require Admin ---
export function requireAdmin(user: TokenPayload): void {
  if (!['admin', 'super_admin'].includes(user.role)) {
    throw new ForbiddenError('관리자 권한이 필요합니다.')
  }
}
