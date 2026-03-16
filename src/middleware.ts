import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/studio')) {
        const basicAuth = request.headers.get('authorization')
        if (basicAuth) {
            const authValue = basicAuth.split(' ')[1]
            const [user, pwd] = atob(authValue).split(':')

            const validUser = process.env.STUDIO_ADMIN_USER || 'admin'
            const validPass = process.env.STUDIO_ADMIN_PASS || 'luximport_secure'

            if (user === validUser && pwd === validPass) {
                return NextResponse.next()
            }
        }

        return new NextResponse('Auth Required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: '/studio/:path*',
}
