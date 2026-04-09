export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getToken } from 'next-auth/jwt'
import { sanityServer } from '@/lib/sanityServer'
import { GROQ_USER_ORDERS_BY_USER_REF } from '@/lib/sanity-queries'

type OrderLineRow = {
    productId?: string
    title?: string
    quantity?: number
    price?: number
    image?: unknown
}

type OrderRow = {
    _id: string
    orderId: string | null
    status: string | null
    isPaid: boolean
    paymentStatus: string | null
    trackingNumber: string | null
    totalAmount: number | null
    shippingAddress: string | null
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    itemsCount: number | null
    items: OrderLineRow[] | null
    _createdAt: string
}

export async function GET(req: Request) {
    try {
        const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
        if (!secret) {
            return new Response(JSON.stringify([]), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' },
            })
        }
        const token = await getToken({ req: req as any, secret })
        const userIdRaw = (token as any)?.id ?? (token as any)?.sub
        const userId = typeof userIdRaw === 'string' && userIdRaw.trim() ? userIdRaw.trim() : null
        if (!userId) {
            return new Response(JSON.stringify([]), {
                status: 401,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' },
            })
        }

        const orders = await sanityServer.fetch<OrderRow[]>(
            GROQ_USER_ORDERS_BY_USER_REF,
            { userId },
            { cache: 'no-store', next: { revalidate: 0 } }
        )

        return new Response(JSON.stringify({ orders }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' },
        })
    } catch (error) {
        console.error('[SERVER_DEBUG]:', error)
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, max-age=0' },
        })
    }
}

