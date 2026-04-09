import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from 'next-sanity'

const writeClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function safeEqualHex(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false
    const aa = a.trim()
    const bb = b.trim()
    if (aa.length !== bb.length) return false
    try {
        return crypto.timingSafeEqual(Buffer.from(aa, 'utf8'), Buffer.from(bb, 'utf8'))
    } catch {
        return false
    }
}

export async function POST(req: Request) {
    try {
        const secretKey = process.env.WAYFORPAY_SECRET_KEY
        const expectedMerchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT

        if (!secretKey || !expectedMerchantAccount) {
            return NextResponse.json({ error: 'Missing secret key' }, { status: 500 })
        }

        const rawBody = await req.text()

        let data: unknown
        try {
            data = JSON.parse(rawBody)
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        if (!isRecord(data)) {
            return NextResponse.json({ error: 'Payload must be a JSON object' }, { status: 400 })
        }

        const {
            merchantAccount,
            orderReference,
            amount,
            currency,
            authCode,
            cardPan,
            transactionStatus,
            reasonCode,
            merchantSignature,
        } = data

        if (typeof merchantAccount !== 'string' || merchantAccount.trim() !== expectedMerchantAccount) {
            return NextResponse.json({ error: 'Invalid merchantAccount' }, { status: 400 })
        }
        if (typeof orderReference !== 'string' || !orderReference.trim()) {
            return NextResponse.json({ error: 'Invalid orderReference' }, { status: 400 })
        }
        if (typeof merchantSignature !== 'string' || !merchantSignature) {
            return NextResponse.json({ error: 'Invalid merchantSignature' }, { status: 400 })
        }

        const signatureString = [
            merchantAccount,
            orderReference,
            amount,
            currency,
            authCode,
            cardPan,
            transactionStatus,
            reasonCode,
        ]
            .map((val) => (val !== undefined && val !== null ? String(val) : ''))
            .join(';')

        const expectedSignature = crypto.createHmac('md5', secretKey).update(signatureString).digest('hex')

        if (!safeEqualHex(expectedSignature, merchantSignature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        const ref = orderReference.trim()
        const sanityId = ref.split('_')[0]

        if (!sanityId) {
            return NextResponse.json({ error: 'Invalid orderReference' }, { status: 400 })
        }

        const orderDoc = (await writeClient.getDocument(sanityId)) as Record<string, unknown> | null
        if (!orderDoc || orderDoc._type !== 'order') {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const orderTotal = typeof orderDoc.totalAmount === 'number' ? orderDoc.totalAmount : NaN
        const paidAmount = typeof amount === 'number' ? amount : Number(amount)
        if (!Number.isFinite(orderTotal) || !Number.isFinite(paidAmount) || Math.abs(orderTotal - paidAmount) > 0.01) {
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        const txStatus = typeof transactionStatus === 'string' ? transactionStatus : ''
        const isApproved = txStatus === 'Approved'

        if (isApproved && orderDoc.isPaid !== true) {
            try {
                await writeClient
                    .patch(sanityId)
                    .set({ isPaid: true, status: 'processing' })
                    .commit()
            } catch (e) {
                const refreshed = (await writeClient.getDocument(sanityId)) as Record<string, unknown> | null
                const ok = refreshed && refreshed._type === 'order' && refreshed.isPaid === true
                if (!ok) {
                    console.error('Sanity patch (payment success) failed:', e)
                    return NextResponse.json({ error: 'Order update failed' }, { status: 500 })
                }
            }

            try {
                const baseUrl = process.env.NEXT_PUBLIC_DOMAIN
                if (!baseUrl) {
                    throw new Error('NEXT_PUBLIC_DOMAIN is not set')
                }
                if (baseUrl) {
                    const rawItems = orderDoc.items
                    const emailItems = Array.isArray(rawItems)
                        ? rawItems.map((raw, i) => {
                              if (!raw || typeof raw !== 'object') {
                                  return {
                                      id: `line-${i}`,
                                      title: '',
                                      price: 0,
                                      quantity: 0,
                                  }
                              }
                              const row = raw as Record<string, unknown>
                              const productId = typeof row.productId === 'string' ? row.productId : `line-${i}`
                              return {
                                  id: productId,
                                  title: typeof row.title === 'string' ? row.title : '',
                                  price: typeof row.price === 'number' && Number.isFinite(row.price) ? row.price : 0,
                                  quantity:
                                      typeof row.quantity === 'number' && Number.isFinite(row.quantity)
                                          ? row.quantity
                                          : 0,
                              }
                          })
                        : []

                    const emailRes = await fetch(`${baseUrl}/api/checkout/email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId: String(orderDoc.orderId ?? ''),
                            customerName: String(orderDoc.customerName ?? ''),
                            customerPhone: String(orderDoc.customerPhone ?? ''),
                            customerEmail: String(orderDoc.customerEmail ?? ''),
                            shippingAddress: String(orderDoc.shippingAddress ?? ''),
                            items: emailItems,
                            total: `${orderDoc.totalAmount} UAH`,
                            date: new Date().toLocaleDateString('uk-UA'),
                        }),
                    })
                    if (!emailRes.ok) {
                        const text = await emailRes.text().catch(() => '')
                        console.error('Email API returned', emailRes.status, text)
                    }
                }
            } catch (emailErr) {
                console.error('Webhook email trigger error:', emailErr)
            }
        }

        const time = Math.floor(Date.now() / 1000)
        const responseSignatureString = `${ref};accept;${time}`

        const responseSignature = crypto
            .createHmac('md5', secretKey)
            .update(responseSignatureString)
            .digest('hex')

        return NextResponse.json({
            orderReference: ref,
            status: 'accept',
            time,
            signature: responseSignature,
        })
    } catch (error) {
        console.error('payment webhook error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
