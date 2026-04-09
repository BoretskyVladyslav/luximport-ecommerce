import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { sanityServer as client } from '@/lib/sanityServer'
import { buildWayforpayPurchasePayload, WAYFORPAY_GOOGLE_PAY } from '@/lib/wayforpay-purchase'

export const dynamic = 'force-dynamic'

type OrderLine = {
    productId?: string
    title?: string
    quantity?: number
    price?: number
}

function linesFromOrder(doc: Record<string, unknown>, orderReference: string, totalAmount: number) {
    const raw = doc.items
    const items: OrderLine[] = Array.isArray(raw) ? (raw as OrderLine[]) : []
    const names: string[] = []
    const counts: number[] = []
    const prices: number[] = []
    for (let i = 0; i < items.length; i++) {
        const row = items[i]
        const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : `Позиція ${i + 1}`
        const qty =
            typeof row.quantity === 'number' && Number.isFinite(row.quantity) ? Math.trunc(row.quantity) : 0
        if (qty <= 0) continue
        const unit =
            typeof row.price === 'number' && Number.isFinite(row.price) && row.price >= 0 ? row.price : 0
        names.push(title)
        counts.push(qty)
        prices.push(unit)
    }
    if (names.length === 0) {
        return {
            productNames: [`Замовлення ${orderReference}`],
            productCounts: [1],
            productPrices: [totalAmount],
        }
    }
    const sum = names.reduce((acc, _, idx) => acc + counts[idx] * prices[idx], 0)
    if (!Number.isFinite(sum) || Math.abs(sum - totalAmount) > 0.02) {
        return {
            productNames: [`Замовлення ${orderReference}`],
            productCounts: [1],
            productPrices: [totalAmount],
        }
    }
    return { productNames: names, productCounts: counts, productPrices: prices }
}

export async function POST(req: Request) {
    try {
        const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT
        const secretKey = process.env.WAYFORPAY_SECRET_KEY
        const domain = process.env.NEXT_PUBLIC_DOMAIN

        if (!merchantAccount || !secretKey || !domain) {
            return NextResponse.json({ error: 'Missing payment environment variables' }, { status: 500 })
        }

        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
        if (!secret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const token = await getToken({ req: req as any, secret })
        const userIdRaw = (token as any)?.id ?? (token as any)?.sub
        const userId = typeof userIdRaw === 'string' && userIdRaw.trim() ? userIdRaw.trim() : null
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let body: unknown
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
        }
        const orderIdRaw = (body as Record<string, unknown>).orderId
        if (typeof orderIdRaw !== 'string' || !orderIdRaw.trim()) {
            return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 })
        }
        const orderId = orderIdRaw.trim()

        const order = (await client.getDocument(orderId)) as Record<string, unknown> | null
        if (!order || order._type !== 'order') {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const userRef = order.user as { _ref?: string } | undefined
        const ownerRef = typeof userRef?._ref === 'string' ? userRef._ref : ''
        if (ownerRef !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const payment = typeof order.paymentStatus === 'string' ? order.paymentStatus : 'pending'
        if (order.isPaid === true || payment === 'paid') {
            return NextResponse.json({ error: 'Order is already paid' }, { status: 409 })
        }

        if (order.status !== 'pending') {
            return NextResponse.json({ error: 'Order cannot be paid' }, { status: 409 })
        }

        if (payment !== 'pending' && payment !== 'failed') {
            return NextResponse.json({ error: 'Order is already paid or closed' }, { status: 409 })
        }

        const sanityId = typeof order._id === 'string' ? order._id : orderId
        const retryReference = `${sanityId}_${Date.now()}`

        const totalAmount =
            typeof order.totalAmount === 'number' && Number.isFinite(order.totalAmount) ? order.totalAmount : NaN
        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 })
        }

        const displayRef =
            typeof order.orderId === 'string' && order.orderId.trim() ? order.orderId.trim() : sanityId
        const currencyRaw = order.currency
        const currency =
            typeof currencyRaw === 'string' && currencyRaw.trim() ? currencyRaw.trim() : 'UAH'

        const { productNames, productCounts, productPrices } = linesFromOrder(order, displayRef, totalAmount)

        const payload = buildWayforpayPurchasePayload({
            merchantAccount,
            secretKey,
            domain,
            orderReference: retryReference,
            amount: totalAmount,
            currency,
            productNames,
            productCounts,
            productPrices,
        })

        return NextResponse.json({
            success: true,
            signature: payload.merchantSignature,
            retryReference: payload.orderReference,
            orderDetails: {
                merchantAccount: payload.merchantAccount,
                merchantDomainName: payload.merchantDomainName,
                orderDate: payload.orderDate,
                amount: payload.amount,
                currency: payload.currency,
                productName: payload.productName,
                productCount: payload.productCount,
                productPrice: payload.productPrice,
                returnUrl: `${domain}/api/wayforpay/return`,
                serviceUrl: `${domain}/api/payment/webhook`,
                googlePay: WAYFORPAY_GOOGLE_PAY,
            },
        })
    } catch (e) {
        console.error('payment/generate-retry error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
