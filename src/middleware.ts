import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

function b64urlToBytes(input: string) {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
    const raw = atob(base64 + pad)
    const out = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
    return out
}

function safeJsonParse(input: string): unknown {
    try {
        return JSON.parse(input)
    } catch {
        return null
    }
}

async function hmacSha256Base64Url(secret: string, data: string) {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
    const bytes = new Uint8Array(sig)
    let bin = ''
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function hasNextAuthJwt(request: NextRequest): Promise<boolean> {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
    if (!secret) return false
    try {
        const token = await getToken({ req: request, secret })
        if (!token) return false
        const id = typeof token.id === 'string' ? token.id.trim() : ''
        const sub = typeof token.sub === 'string' ? token.sub.trim() : ''
        return Boolean(id || sub)
    } catch {
        return false
    }
}

async function isAuthenticated(request: NextRequest) {
    const secret = process.env.AUTH_SECRET
    if (!secret) return false
    const token = request.cookies.get('li_session')?.value
    if (!token) return false
    const parts = token.split('.')
    if (parts.length !== 2) return false
    const [body, sig] = parts
    if (!body || !sig) return false
    const expected = await hmacSha256Base64Url(secret, body)
    if (sig !== expected) return false
    const payloadRaw = new TextDecoder().decode(b64urlToBytes(body))
    const payload = safeJsonParse(payloadRaw)
    if (!payload || typeof payload !== 'object') return false
    const p = payload as Record<string, unknown>
    if (typeof p.userId !== 'string') return false
    if (typeof p.exp !== 'number') return false
    if (Date.now() > p.exp) return false
    return true
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/account/login', request.url))
    }

    const authedLi = await isAuthenticated(request)
    const authedJwt = await hasNextAuthJwt(request)
    const authed = authedLi || authedJwt

    const isLogin = pathname === '/account/login'
    const isRegister = pathname === '/account/register'
    const isProfile = pathname === '/account/profile'
    const referer = request.headers.get('referer') || ''
    const isWayForPayReturn = /wayforpay\.com/i.test(referer)

    if ((isLogin || isRegister) && authed) {
        return NextResponse.redirect(new URL('/account/profile', request.url))
    }

    if (isProfile && !authed) {
        if (isWayForPayReturn) {
            return NextResponse.next()
        }
        const url = new URL('/account/login', request.url)
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
