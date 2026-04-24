import { NextResponse } from 'next/server'
import { sanityServer } from '@/lib/sanityServer'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const rawRef = url.searchParams.get('order')?.trim() || ''
        const orderRef = rawRef.split('_')[0]?.trim() || ''
        if (!orderRef) {
            return NextResponse.json({ found: false }, { status: 200 })
        }

        const order = await sanityServer.fetch<{
            _id: string
            orderId?: string
            status?: string
            paymentStatus?: string
            isPaid?: boolean
        } | null>(
            `*[_type == "order" && (_id == $orderRef || orderId == $orderRef)][0]{
                _id,
                orderId,
                status,
                paymentStatus,
                isPaid
            }`,
            { orderRef },
            { cache: 'no-store', next: { revalidate: 0 } }
        )

        if (!order) return NextResponse.json({ found: false }, { status: 200 })
        return NextResponse.json(
            {
                found: true,
                order: {
                    id: order._id,
                    orderId: order.orderId ?? order._id,
                    status: order.status ?? 'pending',
                    paymentStatus: order.paymentStatus ?? 'pending',
                    isPaid: order.isPaid === true,
                },
            },
            { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
    } catch {
        return NextResponse.json({ found: false }, { status: 200 })
    }
}

