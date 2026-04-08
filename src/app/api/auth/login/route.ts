import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sanityServer } from '@/lib/sanityServer'
import { normalizeEmail } from '@/lib/auth/crypto'
import { setSessionCookie } from '@/lib/auth/session'

const LoginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(200),
})

type UserRow = {
    _id: string
    email: string | null
    name: string | null
    phone: string | null
    passwordHash: string | null
}

export async function POST(req: Request) {
    try {
        if (!process.env.AUTH_SECRET) {
            console.error('[SERVER_DEBUG]: missing env AUTH_SECRET')
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' }, { status: 400 })
        }
        const json = await req.json().catch(() => null)
        const parsed = LoginSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json({ message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }, { status: 400 })
        }

        const email = normalizeEmail(parsed.data.email)
        const password = parsed.data.password

        const user = await sanityServer.fetch<UserRow | null>(
            '*[_type == "user" && email == $email][0]{ _id, email, name, phone, passwordHash }',
            { email }
        )

        if (!user?._id || !user.passwordHash) {
            return NextResponse.json({ message: 'Невірний email або пароль' }, { status: 400 })
        }

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) {
            return NextResponse.json({ message: 'Невірний email або пароль' }, { status: 400 })
        }

        setSessionCookie(user._id)

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name ?? '',
                email: user.email ?? email,
                phone: user.phone ?? '',
            },
        })
    } catch (error) {
        console.error('[SERVER_DEBUG]:', error)
        return NextResponse.json({ message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }, { status: 400 })
    }
}

