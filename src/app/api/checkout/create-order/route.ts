import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            orderId,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            items,
            totalAmount,
        } = body

        if (!orderId || !customerName || !customerPhone || !items || !totalAmount) {
            return NextResponse.json(
                { error: 'Missing required order fields' },
                { status: 400 }
            )
        }

        const sanityOrder = {
            _type: 'order',
            orderId,
            status: 'pending',
            customerName,
            customerEmail: customerEmail || '',
            customerPhone,
            shippingAddress,
            totalAmount,
            items: items.map((item: any) => ({
                _key: item.id || Math.random().toString(36).substring(7),
                productId: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
            })),
        }

        // Create the document in Sanity
        const createdDocument = await sanityClient.create(sanityOrder)

        // Return the auto-generated Sanity document ID (_id) to use as the WayForPay orderReference
        return NextResponse.json({ success: true, sanityDocumentId: createdDocument._id })

    } catch (error) {
        console.error('Error creating pending order:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
