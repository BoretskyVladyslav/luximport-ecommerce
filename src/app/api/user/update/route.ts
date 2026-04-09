import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'
import { createClient } from 'next-sanity'

const UpdateSchema = z.object({
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(0).max(40).optional(),
    address: z.string().trim().min(0).max(240).optional(),
})

export async function POST(req: Request) {
    try {
        if (!process.env.SANITY_API_WRITE_TOKEN) {
            console.error('[SERVER_DEBUG]: missing env SANITY_API_WRITE_TOKEN')
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' }, { status: 400 })
        }
        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
        if (!secret) {
            return NextResponse.json({ message: 'Будь ласка, увійдіть у акаунт' }, { status: 401 })
        }
        const token = await getToken({ req: req as any, secret })
        const userIdRaw = (token as any)?.id ?? (token as any)?.sub
        const userId = typeof userIdRaw === 'string' && userIdRaw.trim() ? userIdRaw.trim() : null
        if (!userId) {
            return NextResponse.json({ message: 'Будь ласка, увійдіть у акаунт' }, { status: 401 })
        }

        const json = await req.json().catch(() => null)
        const parsed = UpdateSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json({ message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }, { status: 400 })
        }

        const firstName = parsed.data.firstName?.trim()
        const lastName = parsed.data.lastName?.trim()
        const phone = parsed.data.phone?.trim()
        const address = parsed.data.address?.trim()
        const name =
            firstName || lastName
                ? [firstName ?? '', lastName ?? ''].join(' ').replace(/\s+/g, ' ').trim()
                : undefined

        const patch: Record<string, unknown> = {}
        if (firstName !== undefined) patch.firstName = firstName
        if (lastName !== undefined) patch.lastName = lastName
        if (phone !== undefined) patch.phone = phone
        if (address !== undefined) patch.address = address
        if (name !== undefined) patch.name = name

        const sanityWrite = createClient({
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
            apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-17',
            token: process.env.SANITY_API_WRITE_TOKEN,
            useCdn: false,
        })

        const updated = await sanityWrite
            .patch(userId)
            .set(patch)
            .commit<{ _id: string; email?: string | null; name?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null; address?: string | null }>()

        return NextResponse.json({
            user: {
                id: updated._id,
                email: updated.email ?? '',
                name: updated.name ?? '',
                firstName: (updated as any).firstName ?? '',
                lastName: (updated as any).lastName ?? '',
                phone: updated.phone ?? '',
                address: updated.address ?? '',
            },
        })
    } catch (error) {
        console.error('[SERVER_DEBUG]:', error)
        return NextResponse.json({ message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }, { status: 400 })
    }
}

