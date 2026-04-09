import { createHmac, timingSafeEqual } from 'crypto'

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
    void userId
}

export function clearSessionCookie() {
    return
}

export function getSessionUserIdFromRequestCookie(cookieValue: string | undefined) {
    void cookieValue
    return null
}

export function getSessionUserId() {
    return null
}

