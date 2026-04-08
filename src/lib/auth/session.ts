import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'li_session'

type SessionPayload = {
    userId: string
    exp: number
}

function b64urlEncode(input: string) {
    return Buffer.from(input).toString('base64url')
}

function b64urlDecode(input: string) {
    return Buffer.from(input, 'base64url').toString('utf8')
}

function sign(secret: string, data: string) {
    return createHmac('sha256', secret).update(data).digest('base64url')
}

export function createSessionToken(payload: SessionPayload, secret: string) {
    const body = b64urlEncode(JSON.stringify(payload))
    const sig = sign(secret, body)
    return `${body}.${sig}`
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [body, sig] = parts
    if (!body || !sig) return null
    const expected = sign(secret, body)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
    let parsed: unknown
    try {
        parsed = JSON.parse(b64urlDecode(body))
    } catch {
        return null
    }
    if (!parsed || typeof parsed !== 'object') return null
    const p = parsed as Record<string, unknown>
    if (typeof p.userId !== 'string') return null
    if (typeof p.exp !== 'number') return null
    if (Date.now() > p.exp) return null
    return { userId: p.userId, exp: p.exp }
}

export function setSessionCookie(userId: string) {
    const secret = process.env.AUTH_SECRET
    if (!secret) throw new Error('AUTH_SECRET is required')
    const exp = Date.now() + 1000 * 60 * 60 * 24 * 14
    const token = createSessionToken({ userId, exp }, secret)
    cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: new Date(exp),
    })
}

export function clearSessionCookie() {
    cookies().set(COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        expires: new Date(0),
    })
}

export function getSessionUserIdFromRequestCookie(cookieValue: string | undefined) {
    const secret = process.env.AUTH_SECRET
    if (!secret) return null
    if (!cookieValue) return null
    const payload = verifySessionToken(cookieValue, secret)
    return payload?.userId ?? null
}

export function getSessionUserId() {
    const cookieValue = cookies().get(COOKIE_NAME)?.value
    return getSessionUserIdFromRequestCookie(cookieValue)
}

