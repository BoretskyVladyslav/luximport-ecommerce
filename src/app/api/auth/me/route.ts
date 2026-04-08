import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sanityServer } from '@/lib/sanityServer'
import { getSessionUserIdFromRequestCookie } from '@/lib/auth/session'

type UserRow = {
    _id: string
    email: string | null
    name: string | null
    phone: string | null
}

export async function GET() {
    try {
        const cookieValue = cookies().get('li_session')?.value
        const userId = getSessionUserIdFromRequestCookie(cookieValue)
        if (!userId) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        const user = await sanityServer.fetch<UserRow | null>(
            '*[_type == "user" && _id == $id][0]{ _id, email, name, phone }',
            { id: userId }
        )

        if (!user?._id) {
            return NextResponse.json({ user: null }, { status: 200 })
        }

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name ?? '',
                email: user.email ?? '',
                phone: user.phone ?? '',
            },
        })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

