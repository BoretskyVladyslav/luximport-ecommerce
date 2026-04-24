export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { sanityServer } from '@/lib/sanityServer'

type UserRow = {
    _id: string
    email: string | null
    name: string | null
    firstName?: string | null
    lastName?: string | null
    phone: string | null
    address: string | null
}

export async function GET(req: Request) {
    try {
        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
        if (!secret) {
            return NextResponse.json({ user: null }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
        }
        const token = await getToken({ req: req as any, secret })
        const userIdRaw = (token as any)?.id ?? (token as any)?.sub
        const userId = typeof userIdRaw === 'string' && userIdRaw.trim() ? userIdRaw.trim() : null
        if (!userId) {
            return NextResponse.json({ user: null }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
        }

        const user = await sanityServer.fetch<UserRow | null>(
            '*[_type == "user" && _id == $id][0]{ _id, email, name, firstName, lastName, phone, address }',
            { id: userId },
            { cache: 'no-store' }
        )

        if (!user?._id) {
            return NextResponse.json({ user: null }, { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } })
        }

        return NextResponse.json(
            {
                user: {
                    id: user._id,
                    email: user.email ?? '',
                    name: user.name ?? '',
                    firstName: (user as any).firstName ?? '',
                    lastName: (user as any).lastName ?? '',
                    phone: user.phone ?? '',
                    address: user.address ?? '',
                },
            },
            { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
    } catch (error) {
        console.error('[API_USER_ME]:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

