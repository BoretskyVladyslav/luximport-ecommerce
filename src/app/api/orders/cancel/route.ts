import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from 'next-sanity'

export const dynamic = 'force-dynamic'

type OrderLine = { productId?: string; quantity?: number }

export async function POST(req: Request) {
    try {
        if (!process.env.SANITY_API_TOKEN) {
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний.' }, { status: 503 })
        }
        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
        if (!secret) {
            return NextResponse.json({ message: 'Необхідна авторизація.' }, { status: 401 })
        }
        const token = await getToken({ req: req as any, secret })
        const userIdRaw = (token as any)?.id ?? (token as any)?.sub
        const userId = typeof userIdRaw === 'string' && userIdRaw.trim() ? userIdRaw.trim() : null
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

        const doc = (await writeClient.getDocument(orderId)) as Record<string, unknown> | null
        if (!doc || doc._type !== 'order') {
            return NextResponse.json({ message: 'Замовлення не знайдено.' }, { status: 404 })
        }

        const userRef = doc.user as { _ref?: string } | undefined
        const ownerRef = typeof userRef?._ref === 'string' ? userRef._ref : ''
        if (ownerRef !== userId) {
            return NextResponse.json({ message: 'Доступ заборонено.' }, { status: 403 })
        }

        const fulfillment = typeof doc.status === 'string' ? doc.status : 'pending'
        const payment = typeof doc.paymentStatus === 'string' ? doc.paymentStatus : 'pending'
        if (fulfillment === 'cancelled') {
            return NextResponse.json({ success: true })
        }
        if (fulfillment !== 'pending') {
            return NextResponse.json({ message: 'Це замовлення вже не можна скасувати.' }, { status: 409 })
        }
        if (payment !== 'pending') {
            return NextResponse.json({ message: 'Скасування недоступне для цього замовлення.' }, { status: 409 })
        }

        const rawItems = doc.items
        const lines: OrderLine[] = Array.isArray(rawItems) ? (rawItems as OrderLine[]) : []

        try {
            await writeClient.patch(orderId).set({ status: 'cancelled' }).commit()
        } catch {
            return NextResponse.json({ message: 'Не вдалося скасувати замовлення.' }, { status: 500 })
        }

        try {
            await Promise.all(
                lines.map((item) => {
                    const pid = typeof item.productId === 'string' ? item.productId.trim() : ''
                    const qty =
                        typeof item.quantity === 'number' && Number.isFinite(item.quantity)
                            ? Math.max(0, Math.trunc(item.quantity))
                            : 0
                    if (!pid || qty <= 0) {
                        return Promise.resolve()
                    }
                    return writeClient.patch(pid).inc({ stock: qty }).commit()
                })
            )
        } catch (e) {
            console.error('[orders/cancel] stock restore', e)
            return NextResponse.json({ message: 'Не вдалося повернути товари на склад.' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('[orders/cancel]', e)
        return NextResponse.json({ message: 'Внутрішня помилка.' }, { status: 500 })
    }
}
