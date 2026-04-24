import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from 'next-sanity'
import { errorResponse, getCorrelationId } from '@/lib/api-errors'
import { ORDER_STATE_PAID, ORDER_STATE_PAYMENT_FAILED, paymentEventKey } from '@/lib/order-lifecycle'
import { revalidateUserOrders } from '@/lib/order-revalidation'

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
    const correlationId = getCorrelationId(req)
    try {
        const secretKey = process.env.WAYFORPAY_SECRET_KEY?.trim()
        const expectedMerchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT?.trim()

        if (!secretKey || !expectedMerchantAccount) {
            return errorResponse('Missing secret key', 500, 'PAYMENT_ENV_INVALID', correlationId)
        }

        const rawBody = await req.text()

        let data: unknown
        try {
            data = JSON.parse(rawBody)
        } catch {
            return errorResponse('Invalid JSON body', 400, 'PAYMENT_WEBHOOK_INVALID_JSON', correlationId)
        }

        if (!isRecord(data)) {
            return errorResponse('Payload must be a JSON object', 400, 'PAYMENT_WEBHOOK_INVALID_BODY', correlationId)
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
            return errorResponse('Invalid merchantAccount', 400, 'PAYMENT_WEBHOOK_INVALID_MERCHANT', correlationId)
        }
        if (typeof orderReference !== 'string' || !orderReference.trim()) {
            return errorResponse('Invalid orderReference', 400, 'PAYMENT_WEBHOOK_INVALID_ORDER_REFERENCE', correlationId)
        }
        if (typeof merchantSignature !== 'string' || !merchantSignature) {
            return errorResponse('Invalid merchantSignature', 400, 'PAYMENT_WEBHOOK_INVALID_SIGNATURE', correlationId)
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
            console.error('[PAYMENT_WEBHOOK_SIGNATURE_MISMATCH]', {
                correlationId,
                orderReference: typeof orderReference === 'string' ? orderReference : '',
                transactionStatus: typeof transactionStatus === 'string' ? transactionStatus : '',
                merchantAccount: typeof merchantAccount === 'string' ? merchantAccount : '',
                expectedMerchantAccount,
                receivedSignatureLength: merchantSignature.length,
                expectedSignatureLength: expectedSignature.length,
            })
            return errorResponse('Invalid signature', 400, 'PAYMENT_WEBHOOK_SIGNATURE_MISMATCH', correlationId)
        }

        const ref = orderReference.trim()
        const sanityId = ref.split('_')[0]

        if (!sanityId) {
            return errorResponse('Invalid orderReference', 400, 'PAYMENT_WEBHOOK_INVALID_ORDER_REFERENCE', correlationId)
        }

        const orderDoc = (await writeClient.getDocument(sanityId)) as Record<string, unknown> | null
        if (!orderDoc || orderDoc._type !== 'order') {
            return errorResponse('Order not found', 404, 'PAYMENT_WEBHOOK_ORDER_NOT_FOUND', correlationId)
        }

        const orderTotal = typeof orderDoc.totalAmount === 'number' ? orderDoc.totalAmount : NaN
        const paidAmount = typeof amount === 'number' ? amount : Number(amount)
        if (!Number.isFinite(orderTotal) || !Number.isFinite(paidAmount) || Math.abs(orderTotal - paidAmount) > 0.01) {
            return errorResponse('Amount mismatch', 400, 'PAYMENT_WEBHOOK_AMOUNT_MISMATCH', correlationId)
        }

        const txStatus = typeof transactionStatus === 'string' ? transactionStatus : ''
        const isApproved = txStatus === 'Approved'
        const eventKey = paymentEventKey(ref, txStatus || 'unknown')

        if (isApproved && orderDoc.isPaid !== true) {
            try {
                await writeClient
                    .patch(sanityId)
                    .set({
                        isPaid: ORDER_STATE_PAID.isPaid,
                        status: ORDER_STATE_PAID.status,
                        paymentStatus: ORDER_STATE_PAID.paymentStatus,
                        lastPaymentEventKey: eventKey,
                    } as any)
                    .commit()
                console.info('[PAYMENT_WEBHOOK_APPLIED_APPROVED]', { correlationId, sanityId, eventKey })
            } catch (e) {
                const refreshed = (await writeClient.getDocument(sanityId)) as Record<string, unknown> | null
                const ok = refreshed && refreshed._type === 'order' && refreshed.isPaid === true
                if (!ok) {
                    console.error('Sanity patch (payment success) failed:', e)
                    return errorResponse('Order update failed', 500, 'PAYMENT_WEBHOOK_ORDER_UPDATE_FAILED', correlationId)
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
                        console.error('[PAYMENT_WEBHOOK_EMAIL_FAILED]', { correlationId, status: emailRes.status, text })
                    }
                }
            } catch (emailErr) {
                console.error('[PAYMENT_WEBHOOK_EMAIL_TRIGGER_FAILED]', { correlationId, error: emailErr })
            }
        } else if (!isApproved) {
            await writeClient
                .patch(sanityId)
                .set({
                    isPaid: ORDER_STATE_PAYMENT_FAILED.isPaid,
                    paymentStatus: ORDER_STATE_PAYMENT_FAILED.paymentStatus,
                    lastPaymentEventKey: eventKey,
                } as any)
                .commit()
            console.info('[PAYMENT_WEBHOOK_APPLIED_FAILED]', { correlationId, sanityId, eventKey, txStatus })
        }

        const userRef = orderDoc.user as { _ref?: string } | undefined
        const userId = typeof userRef?._ref === 'string' ? userRef._ref : null
        revalidateUserOrders(userId)

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
            correlationId,
        })
    } catch (error) {
        console.error('[PAYMENT_WEBHOOK_FAILED]', { correlationId, error })
        return errorResponse('Internal Server Error', 500, 'PAYMENT_WEBHOOK_FAILED', correlationId)
    }
}
