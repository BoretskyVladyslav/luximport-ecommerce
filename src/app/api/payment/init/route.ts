import { NextResponse } from 'next/server'
import { buildWayforpayPurchasePayload } from '@/lib/wayforpay-purchase'

function toNumberArray(label: string, v: unknown): { ok: true; arr: number[] } | { ok: false; error: string } {
    if (Array.isArray(v)) {
        const out: number[] = []
        for (let i = 0; i < v.length; i++) {
            const n = v[i]
            if (typeof n !== 'number' || !Number.isFinite(n)) {
                return { ok: false, error: `${label}[${i}] must be a finite number` }
            }
            out.push(n)
        }
        return { ok: true, arr: out }
    }
    if (typeof v === 'number' && Number.isFinite(v)) {
        return { ok: true, arr: [v] }
    }
    return { ok: false, error: `${label} must be a number or array of numbers` }
}

function toStringArray(label: string, v: unknown): { ok: true; arr: string[] } | { ok: false; error: string } {
    if (Array.isArray(v)) {
        const out: string[] = []
        for (let i = 0; i < v.length; i++) {
            const s = v[i]
            if (typeof s !== 'string' || !s.trim()) {
                return { ok: false, error: `${label}[${i}] must be a non-empty string` }
            }
            out.push(s.trim())
        }
        return { ok: true, arr: out }
    }
    if (typeof v === 'string' && v.trim()) {
        return { ok: true, arr: [v.trim()] }
    }
    return { ok: false, error: `${label} must be a string or array of strings` }
}

export async function POST(req: Request) {
    try {
        let body: unknown
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
        }

        const b = body as Record<string, unknown>
        const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT
        const secretKey = process.env.WAYFORPAY_SECRET_KEY
        const domain = process.env.NEXT_PUBLIC_DOMAIN

        if (!merchantAccount || !secretKey || !domain) {
            return NextResponse.json({ error: 'Missing payment environment variables' }, { status: 500 })
        }

        const { orderReference, amount, currency = 'UAH', productName, productCount, productPrice } = b

        if (typeof orderReference !== 'string' || !orderReference.trim()) {
            return NextResponse.json({ error: 'Invalid orderReference' }, { status: 400 })
        }
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ error: 'amount must be a finite number > 0' }, { status: 400 })
        }
        if (typeof currency !== 'string' || !currency.trim()) {
            return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
        }

        const names = toStringArray('productName', productName)
        if (names.ok === false) {
            return NextResponse.json({ error: names.error }, { status: 400 })
        }
        const counts = toNumberArray('productCount', productCount)
        if (counts.ok === false) {
            return NextResponse.json({ error: counts.error }, { status: 400 })
        }
        const prices = toNumberArray('productPrice', productPrice)
        if (prices.ok === false) {
            return NextResponse.json({ error: prices.error }, { status: 400 })
        }

        const n = names.arr.length
        if (counts.arr.length !== n || prices.arr.length !== n) {
            return NextResponse.json(
                { error: 'productName, productCount, and productPrice must have the same length' },
                { status: 400 }
            )
        }

        const payload = buildWayforpayPurchasePayload({
            merchantAccount,
            secretKey,
            domain,
            orderReference: orderReference.trim(),
            amount,
            currency: currency.trim(),
            productNames: names.arr,
            productCounts: counts.arr,
            productPrices: prices.arr,
        })

        return NextResponse.json({
            ...payload,
            returnUrl: `${domain}/api/wayforpay/return`,
            serviceUrl: `${domain}/api/payment/webhook`,
        })
    } catch (error) {
        console.error('payment/init error:', error)
        return NextResponse.json(
            { error: 'Internal server error during payment initialization' },
            { status: 500 }
        )
    }
}
