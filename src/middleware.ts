import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

function nextWithPathname(request: NextRequest, pathname: string) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)
    return NextResponse.next({
        request: { headers: requestHeaders },
    })
}

function hasValidSessionToken(token: unknown): boolean {
    if (!token || typeof token !== 'object') return false
    const t = token as Record<string, unknown>
    const id = typeof t.id === 'string' ? t.id.trim() : ''
    const sub = typeof t.sub === 'string' ? t.sub.trim() : ''
    return Boolean(id || sub)
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    if (!secret) {
        return nextWithPathname(request, pathname)
    }
    const token = await getToken({ req: request, secret })
    const authed = hasValidSessionToken(token)

    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/account/login', request.url))
    }

    const isAccountLogin = pathname === '/account/login'
    const isAccountRegister = pathname === '/account/register'
    const isAuthPublicPage = isAccountLogin || isAccountRegister

    if (authed && isAuthPublicPage) {
        return NextResponse.redirect(new URL('/account/profile', request.url))
    }

    if (!authed && pathname.startsWith('/account/') && !isAuthPublicPage) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return nextWithPathname(request, pathname)
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
