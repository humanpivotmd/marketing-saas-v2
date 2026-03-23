import crypto from 'crypto'
import { ValidationError } from './errors'

// --- AES-256-GCM Encryption ---
function getEncryptKey(): Buffer {
  const keySource = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET
  if (!keySource) throw new Error('ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.')
  return crypto.createHash('sha256').update(keySource).digest()
}

export function encrypt(text: string): string {
  const key = getEncryptKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return iv.toString('hex') + ':' + tag + ':' + encrypted
}

export function decrypt(data: string): string {
  const parts = data.split(':')
  if (parts.length !== 3) {
    throw new ValidationError('잘못된 암호화 데이터 형식입니다.')
  }
  const [ivHex, tagHex, encrypted] = parts
  if (!ivHex || !tagHex || !encrypted) {
    throw new ValidationError('잘못된 암호화 데이터 형식입니다.')
  }
  const key = getEncryptKey()
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
