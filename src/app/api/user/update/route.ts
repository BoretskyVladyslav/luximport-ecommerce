import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { sanityServer } from '@/lib/sanityServer'
import { getSessionUserIdFromRequestCookie } from '@/lib/auth/session'

const UpdateSchema = z.object({
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(0).max(40).optional(),
    address: z.string().trim().min(0).max(240).optional(),
})

export async function POST(req: Request) {
    try {
        if (!process.env.SANITY_API_TOKEN) {
            console.error('[SERVER_DEBUG]: missing env SANITY_API_TOKEN')
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' }, { status: 400 })
        }
        const cookieValue = cookies().get('li_session')?.value
        const userId = getSessionUserIdFromRequestCookie(cookieValue)
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

        const updated = await sanityServer
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

