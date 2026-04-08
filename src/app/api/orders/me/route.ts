import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sanityServer } from '@/lib/sanityServer'
import { getSessionUserIdFromRequestCookie } from '@/lib/auth/session'
import { GROQ_USER_ORDERS_BY_USER_REF } from '@/lib/sanity-queries'

export const dynamic = 'force-dynamic'

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

export async function GET() {
    try {
        const cookieValue = cookies().get('li_session')?.value
        const userId = getSessionUserIdFromRequestCookie(cookieValue)
        if (!userId) {
            return NextResponse.json(
                { orders: [] },
                { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
            )
        }

        const orders = await sanityServer.fetch<OrderRow[]>(GROQ_USER_ORDERS_BY_USER_REF, { userId })

        return NextResponse.json(
            { orders },
            { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
    } catch (error) {
        console.error('[SERVER_DEBUG]:', error)
        return NextResponse.json(
            { orders: [] },
            { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
    }
}

