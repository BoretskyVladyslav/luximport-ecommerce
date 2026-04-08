import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { client } from '@/lib/sanity'
import { getSessionUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        if (!process.env.SANITY_API_TOKEN) {
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний.' }, { status: 503 })
        }

        const userId = getSessionUserId()
        if (!userId) {
            return NextResponse.json({ message: 'Необхідна авторизація.' }, { status: 401 })
        }

        let body: unknown
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ message: 'Некоректні дані.' }, { status: 400 })
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ message: 'Некоректні дані.' }, { status: 400 })
        }
        const orderIdRaw = (body as Record<string, unknown>).orderId
        if (typeof orderIdRaw !== 'string' || !orderIdRaw.trim()) {
            return NextResponse.json({ message: 'Некоректний ідентифікатор замовлення.' }, { status: 400 })
        }
        const orderId = orderIdRaw.trim()

        const writeClient = createClient({
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
            apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-17',
            token: process.env.SANITY_API_TOKEN,
            useCdn: false,
        })

        let doc: Record<string, unknown> | null
        try {
            doc = (await client.getDocument(orderId)) as Record<string, unknown> | null
        } catch (e) {
            console.error('[orders/sync-payment] Sanity error:', e)
            return NextResponse.json({ message: 'Не вдалося перевірити замовлення.' }, { status: 500 })
        }

        if (!doc || doc._type !== 'order') {
            return NextResponse.json({ message: 'Замовлення не знайдено.' }, { status: 404 })
        }

        const userRef = doc.user as { _ref?: string } | undefined
        const ownerRef = typeof userRef?._ref === 'string' ? userRef._ref : ''
        if (ownerRef !== userId) {
            return NextResponse.json({ message: 'Доступ заборонено.' }, { status: 403 })
        }

        try {
            await writeClient.patch(orderId).set({ isPaid: true, status: 'processing' }).commit()
        } catch (e) {
            console.error('[orders/sync-payment] Sanity error:', e)
            return NextResponse.json({ message: 'Не вдалося оновити замовлення.' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('[orders/sync-payment]', e)
        return NextResponse.json({ message: 'Внутрішня помилка.' }, { status: 500 })
    }
}
