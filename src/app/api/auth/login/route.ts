import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyCredentials } from '@/lib/auth/verifyCredentials'
import { setSessionCookie } from '@/lib/auth/session'

const LoginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(200),
})

export async function POST(req: Request) {
    try {
        if (!process.env.AUTH_SECRET) {
            return NextResponse.json(
                { message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' },
                { status: 400 }
            )
        }
        const json = await req.json().catch(() => null)
        const parsed = LoginSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                { message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' },
                { status: 400 }
            )
        }

        const email = parsed.data.email
        const password = parsed.data.password
        const row = await verifyCredentials(email, password)
        if (!row) {
            return NextResponse.json({ message: 'Невірний email або пароль' }, { status: 400 })
        }

        setSessionCookie(row.id)

        return NextResponse.json({
            user: {
                id: row.id,
                name: row.name,
                email: row.email,
                phone: row.phone,
            },
        })
    } catch {
        return NextResponse.json(
            { message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' },
            { status: 400 }
        )
    }
}
