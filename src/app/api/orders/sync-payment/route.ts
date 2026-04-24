import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { client } from '@/lib/sanity'
import { getToken } from 'next-auth/jwt'
import { ORDER_STATE_PAID } from '@/lib/order-lifecycle'
import { revalidateUserOrders } from '@/lib/order-revalidation'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

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
            const txRefRaw = (body as Record<string, unknown>).transactionReference
            const transactionReference = typeof txRefRaw === 'string' ? txRefRaw.trim() : ''
            if (transactionReference) {
                const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT?.trim()
                const secretKey = process.env.WAYFORPAY_SECRET_KEY?.trim()
                if (merchantAccount && secretKey) {
                    const reqTime = Math.floor(Date.now() / 1000)
                    const signBase = [merchantAccount, transactionReference, String(reqTime)].join(';')
                    const merchantSignature = crypto.createHmac('md5', secretKey).update(signBase).digest('hex')
                    const statusRes = await fetch('https://api.wayforpay.com/api', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionType: 'CHECK_STATUS',
                            merchantAccount,
                            orderReference: transactionReference,
                            apiVersion: 1,
                            time: reqTime,
                            merchantSignature,
                        }),
                    }).catch(() => null)
                    const statusData = await statusRes?.json().catch(() => null)
                    const txStatus = typeof statusData?.transactionStatus === 'string' ? statusData.transactionStatus : ''
                    const approved = txStatus === 'Approved'
                    if (!approved) {
                        return NextResponse.json({ message: 'Оплата ще не підтверджена.' }, { status: 409 })
                    }
                }
            }
            await writeClient
                .patch(orderId)
                .set({
                    isPaid: ORDER_STATE_PAID.isPaid,
                    status: ORDER_STATE_PAID.status,
                    paymentStatus: ORDER_STATE_PAID.paymentStatus,
                })
                .commit()
        } catch (e) {
            console.error('[orders/sync-payment] Sanity error:', e)
            return NextResponse.json({ message: 'Не вдалося оновити замовлення.' }, { status: 500 })
        }

        revalidateUserOrders(userId)
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('[orders/sync-payment]', e)
        return NextResponse.json({ message: 'Внутрішня помилка.' }, { status: 500 })
    }
}
