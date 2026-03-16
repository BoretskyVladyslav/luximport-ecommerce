import { NextResponse } from 'next/server'
import crypto from 'crypto'
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
        const secretKey = process.env.WAYFORPAY_SECRET_KEY

        if (!secretKey) {
            return NextResponse.json({ error: 'Missing secret key' }, { status: 500 })
        }

        const rawBody = await req.text()
        const data = JSON.parse(rawBody)

        const {
            merchantAccount,
            orderReference,
            amount,
            currency,
            authCode,
            cardPan,
            transactionStatus,
            reasonCode,
            merchantSignature
        } = data

        const signatureString = [
            merchantAccount,
            orderReference,
            amount,
            currency,
            authCode,
            cardPan,
            transactionStatus,
            reasonCode
        ].map(val => val !== undefined && val !== null ? String(val) : '').join(';')

        const expectedSignature = crypto
            .createHmac('md5', secretKey)
            .update(signatureString)
            .digest('hex')

        if (expectedSignature !== merchantSignature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        if (transactionStatus === 'Approved') {
            // Step 1: Mark order as Paid
            await sanityClient.patch(orderReference).set({ status: 'paid' }).commit()

            // Step 2: Fetch the order details to decrement stock and send email
            const orderDoc = await sanityClient.getDocument(orderReference)

            if (orderDoc) {
                // Decrement inventory
                if (orderDoc.items && Array.isArray(orderDoc.items)) {
                    for (const item of orderDoc.items) {
                        if (item.productId && item.quantity) {
                            try {
                                await sanityClient.patch(item.productId).dec({ stock: item.quantity }).commit()
                            } catch (e) {
                                console.error(`Error decrementing stock for product ${item.productId}:`, e)
                            }
                        }
                    }
                }

                // Step 3: Send Confirmation & Admin Emails
                try {
                    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
                    const domain = process.env.NEXT_PUBLIC_DOMAIN || req.headers.get('host')
                    await fetch(`${protocol}://${domain}/api/checkout/email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId: orderDoc.orderId,
                            customerName: orderDoc.customerName,
                            customerPhone: orderDoc.customerPhone,
                            customerEmail: orderDoc.customerEmail || '',
                            shippingAddress: orderDoc.shippingAddress,
                            items: orderDoc.items,
                            total: `${orderDoc.totalAmount} UAH`,
                            date: new Date().toLocaleDateString('uk-UA'),
                        }),
                    })
                } catch (emailErr) {
                    console.error('Webhook email trigger error:', emailErr)
                }
            }
        }

        const time = Math.floor(Date.now() / 1000)
        const responseSignatureString = `${orderReference};accept;${time}`

        const responseSignature = crypto
            .createHmac('md5', secretKey)
            .update(responseSignatureString)
            .digest('hex')

        return NextResponse.json({
            orderReference,
            status: 'accept',
            time,
            signature: responseSignature
        })

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
