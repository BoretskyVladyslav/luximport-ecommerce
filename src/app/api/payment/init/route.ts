import { NextResponse } from 'next/server'
import { buildWayforpayPurchasePayload } from '@/lib/wayforpay-purchase'
import { errorResponse, getCorrelationId } from '@/lib/api-errors'

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
    const correlationId = getCorrelationId(req)
    try {
        let body: unknown
        try {
            body = await req.json()
        } catch {
            return errorResponse('Invalid JSON body', 400, 'PAYMENT_INVALID_JSON', correlationId)
        }

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return errorResponse('Body must be a JSON object', 400, 'PAYMENT_INVALID_BODY', correlationId)
        }

        const b = body as Record<string, unknown>
        const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT?.trim()
        const secretKey = process.env.WAYFORPAY_SECRET_KEY?.trim()
        const domain = process.env.NEXT_PUBLIC_DOMAIN?.trim()

        if (!merchantAccount || !secretKey || !domain) {
            return errorResponse('Missing payment environment variables', 500, 'PAYMENT_ENV_INVALID', correlationId)
        }

        const { orderReference, amount, currency = 'UAH', productName, productCount, productPrice } = b

        if (typeof orderReference !== 'string' || !orderReference.trim()) {
            return errorResponse('Invalid orderReference', 400, 'PAYMENT_INVALID_ORDER_REFERENCE', correlationId)
        }
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return errorResponse('amount must be a finite number > 0', 400, 'PAYMENT_INVALID_AMOUNT', correlationId)
        }
        if (typeof currency !== 'string' || !currency.trim()) {
            return errorResponse('Invalid currency', 400, 'PAYMENT_INVALID_CURRENCY', correlationId)
        }

        const names = toStringArray('productName', productName)
        if (names.ok === false) {
            return errorResponse(names.error, 400, 'PAYMENT_INVALID_PRODUCT_NAME', correlationId)
        }
        const counts = toNumberArray('productCount', productCount)
        if (counts.ok === false) {
            return errorResponse(counts.error, 400, 'PAYMENT_INVALID_PRODUCT_COUNT', correlationId)
        }
        const prices = toNumberArray('productPrice', productPrice)
        if (prices.ok === false) {
            return errorResponse(prices.error, 400, 'PAYMENT_INVALID_PRODUCT_PRICE', correlationId)
        }

        const n = names.arr.length
        if (counts.arr.length !== n || prices.arr.length !== n) {
            return errorResponse(
                'productName, productCount, and productPrice must have the same length',
                400,
                'PAYMENT_ITEMS_LENGTH_MISMATCH',
                correlationId
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
        console.info('[PAYMENT_INIT_PAYLOAD]', {
            correlationId,
            orderReference: payload.orderReference,
            merchantAccount: payload.merchantAccount,
            merchantDomainName: payload.merchantDomainName,
            merchantTransactionType: (payload as any).merchantTransactionType,
            hasGooglePay: payload.googlePay === '1',
        })

        return NextResponse.json({
            ...payload,
            correlationId,
            returnUrl: `${domain}/api/wayforpay/return`,
            serviceUrl: `${domain}/api/payment/webhook`,
        })
    } catch (error) {
        console.error('[PAYMENT_INIT_FAILED]', { correlationId, error })
        return errorResponse(
            'Internal server error during payment initialization',
            500,
            'PAYMENT_INIT_FAILED',
            correlationId
        )
    }
}
