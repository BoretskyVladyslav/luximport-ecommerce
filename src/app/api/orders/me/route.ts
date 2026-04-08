import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sanityServer } from '@/lib/sanityServer'
import { getSessionUserIdFromRequestCookie } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type OrderRow = {
    _id: string
    orderId: string | null
    status: string | null
    totalAmount: number | null
    shippingAddress: string | null
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
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

        const orders = await sanityServer.fetch<OrderRow[]>(
            `*[_type == "order" && user._ref == $userId] | order(_createdAt desc) {
                _id,
                orderId,
                status,
                totalAmount,
                shippingAddress,
                customerName,
                customerEmail,
                customerPhone,
                _createdAt
            }`,
            { userId }
        )

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

