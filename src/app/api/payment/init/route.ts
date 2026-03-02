import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const merchantAccount = process.env.WAYFORPAY_MERCHANT_ACCOUNT
        const secretKey = process.env.WAYFORPAY_SECRET_KEY
        const domain = process.env.NEXT_PUBLIC_DOMAIN

        if (!merchantAccount || !secretKey || !domain) {
            return NextResponse.json(
                { error: 'Missing payment environment variables' },
                { status: 500 }
            )
        }

        const body = await req.json()
        const { orderReference, amount, currency = 'UAH', productName, productCount, productPrice } = body

        if (!orderReference || !amount || !productName || !productCount || !productPrice) {
            return NextResponse.json(
                { error: 'Missing required payload fields' },
                { status: 400 }
            )
        }

        const orderDate = Math.floor(Date.now() / 1000).toString()

        const signatureString = [
            merchantAccount,
            domain,
            orderReference,
            orderDate,
            amount,
            currency,
            Array.isArray(productName) ? productName.join(';') : productName,
            Array.isArray(productCount) ? productCount.join(';') : productCount,
            Array.isArray(productPrice) ? productPrice.join(';') : productPrice
        ].join(';')

        const merchantSignature = crypto
            .createHmac('md5', secretKey)
            .update(signatureString)
            .digest('hex')

        return NextResponse.json({
            merchantAccount,
            merchantDomainName: domain,
            orderReference,
            orderDate,
            amount,
            currency,
            productName: Array.isArray(productName) ? productName : [productName],
            productCount: Array.isArray(productCount) ? productCount : [productCount],
            productPrice: Array.isArray(productPrice) ? productPrice : [productPrice],
            merchantSignature,
            returnUrl: `${domain}/checkout/success`,
            serviceUrl: `${domain}/api/payment/webhook`
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error during payment initialization' },
            { status: 500 }
        )
    }
}
