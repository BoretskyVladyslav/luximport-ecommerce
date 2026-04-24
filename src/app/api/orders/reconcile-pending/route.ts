import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        if (!process.env.SANITY_API_TOKEN) {
            return NextResponse.json({ success: false, message: 'SANITY token missing' }, { status: 503 })
        }
        const writeClient = createClient({
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
            apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-17',
            token: process.env.SANITY_API_TOKEN,
            useCdn: false,
        })

        const stuckOrders = await writeClient.fetch<Array<{ _id: string; _updatedAt: string }>>(
            `*[_type == "order" && paymentStatus == "pending" && dateTime(_updatedAt) < dateTime(now()) - 60 * 30]{
                _id,
                _updatedAt
            }`
        )

        await Promise.all(
            stuckOrders.map((o) =>
                writeClient
                    .patch(o._id)
                    .set({ paymentStatus: 'failed' })
                    .commit()
            )
        )

        return NextResponse.json({ success: true, processed: stuckOrders.length })
    } catch (error) {
        console.error('[RECONCILE_PENDING]', error)
        return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 })
    }
}

