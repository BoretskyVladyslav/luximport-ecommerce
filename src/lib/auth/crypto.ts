import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

export function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function createOtp() {
    const n = randomBytes(4).readUInt32BE(0) % 1000000
    return String(n).padStart(6, '0')
}

export function sha256Hex(secret: string, value: string) {
    return createHmac('sha256', secret).update(value).digest('hex')
}

export function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${hash}`
}

export function verifyPassword(password: string, passwordHash: string) {
    const [salt, stored] = passwordHash.split(':')
    if (!salt || !stored) return false
    const derived = scryptSync(password, salt, 64)
    const storedBuf = Buffer.from(stored, 'hex')
    if (storedBuf.length !== derived.length) return false
    return timingSafeEqual(storedBuf, derived)
}

