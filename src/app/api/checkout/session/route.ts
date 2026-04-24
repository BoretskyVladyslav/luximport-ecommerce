import { NextResponse } from 'next/server'
import { getCorrelationId } from '@/lib/api-errors'

export async function POST(req: Request) {
    const correlationId = getCorrelationId(req)
    const cookieHeader = req.headers.get('cookie') ?? ''
    try {
        const body = await req.json().catch(() => null)
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return NextResponse.json(
                { code: 'CHECKOUT_INVALID_BODY', message: 'Некоректні дані.', correlationId },
                { status: 400 }
            )
        }

        const createOrderRes = await fetch(new URL('/api/checkout/create-order', req.url), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-correlation-id': correlationId,
                ...(cookieHeader ? { cookie: cookieHeader } : {}),
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        })
        const createdOrder = await createOrderRes.json().catch(() => null)
        if (!createOrderRes.ok) {
            return NextResponse.json(
                {
                    code: createdOrder?.code || 'CHECKOUT_CREATE_ORDER_FAILED',
                    message: createdOrder?.message || 'Помилка при створенні замовлення.',
                    correlationId,
                },
                { status: createOrderRes.status || 400 }
            )
        }

        const orderReference = typeof createdOrder?.sanityDocumentId === 'string' ? createdOrder.sanityDocumentId : ''
        if (!orderReference) {
            return NextResponse.json(
                { code: 'CHECKOUT_CREATE_ORDER_FAILED', message: 'Не вдалося створити замовлення.', correlationId },
                { status: 400 }
            )
        }

        const b = body as Record<string, unknown>
        const paymentRes = await fetch(new URL('/api/payment/init', req.url), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-correlation-id': correlationId,
                ...(cookieHeader ? { cookie: cookieHeader } : {}),
            },
            body: JSON.stringify({
                orderReference,
                amount: b.totalAmount,
                productName: Array.isArray(b.items) ? b.items.map((i: any) => String(i?.title || 'Товар')) : [],
                productCount: Array.isArray(b.items)
                    ? b.items.map((i: any) => (typeof i?.quantity === 'number' ? i.quantity : 1))
                    : [],
                productPrice: Array.isArray(b.items)
                    ? b.items.map((i: any) => {
                          const threshold = i?.piecesPerBox ?? i?.wholesaleMinQuantity
                          const isWholesale = typeof threshold === 'number' && i?.quantity >= threshold
                          const price = isWholesale ? i?.wholesalePrice : i?.price
                          return typeof price === 'number' ? price : 0
                      })
                    : [],
            }),
            cache: 'no-store',
        })

        const paymentData = await paymentRes.json().catch(() => null)
        if (!paymentRes.ok || !paymentData || typeof paymentData !== 'object') {
            return NextResponse.json(
                {
                    code: paymentData?.code || 'PAYMENT_INIT_FAILED',
                    message: paymentData?.message || 'Не вдалося ініціалізувати оплату.',
                    correlationId,
                },
                { status: paymentRes.status || 400 }
            )
        }

        return NextResponse.json({
            success: true,
            sanityDocumentId: orderReference,
            paymentData,
            correlationId,
        })
    } catch {
        return NextResponse.json(
            { code: 'CHECKOUT_SESSION_FAILED', message: 'Внутрішня помилка checkout-сесії.', correlationId },
            { status: 500 }
        )
    }
}

