import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sanityServer } from '@/lib/sanityServer'
import { normalizeEmail } from '@/lib/auth/crypto'

const RegisterSchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(1).max(40).optional(),
    password: z.string().min(8).max(200),
})

export async function POST(req: Request) {
    try {
        if (!process.env.SANITY_API_TOKEN) {
            console.error('[SERVER_DEBUG]: missing env SANITY_API_TOKEN')
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' }, { status: 400 })
        }
        if (!process.env.AUTH_SECRET) {
            console.error('[SERVER_DEBUG]: missing env AUTH_SECRET')
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' }, { status: 400 })
        }
        const json = await req.json().catch(() => null)
        const parsed = RegisterSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json({ message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }, { status: 400 })
        }

        const name = parsed.data.name.trim()
        const email = normalizeEmail(parsed.data.email)
        const phone = parsed.data.phone ? parsed.data.phone.trim() : undefined
        const passwordHash = await bcrypt.hash(parsed.data.password, 12)

        const existing = await sanityServer.fetch<{ _id: string } | null>(
            '*[_type == "user" && email == $email][0]{ _id }',
            { email }
        )

        if (existing?._id) {
            return NextResponse.json({ message: 'Користувач з таким email вже існує' }, { status: 400 })
        }

        const created = await sanityServer.create({
            _type: 'user',
            email,
            passwordHash,
            name,
            phone: phone ?? '',
            createdAt: new Date().toISOString(),
        })

        return NextResponse.json(
            {
                user: {
                    id: created._id as string,
                    name: (created as any).name ?? name,
                    email: (created as any).email ?? email,
                    phone: (created as any).phone ?? phone ?? '',
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[SERVER_DEBUG]:', error)
        return NextResponse.json({ message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }, { status: 400 })
    }
}

