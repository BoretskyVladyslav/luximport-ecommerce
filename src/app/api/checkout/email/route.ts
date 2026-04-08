import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import CustomerReceiptEmail from '@/emails/CustomerReceiptEmail'
import AdminNotificationEmail from '@/emails/AdminNotificationEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export async function POST(req: Request) {
    try {
        let body: unknown
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
        }

        if (!isRecord(body)) {
            return NextResponse.json({ success: false, error: 'Body must be a JSON object' }, { status: 400 })
        }

        const orderId = body.orderId
        const customerName = body.customerName
        const customerPhone = body.customerPhone
        const customerEmail = body.customerEmail
        const shippingAddress = body.shippingAddress
        const items = body.items
        const total = body.total
        const date = body.date

        if (typeof orderId !== 'string' || !orderId.trim()) {
            return NextResponse.json({ success: false, error: 'Invalid orderId' }, { status: 400 })
        }
        if (typeof customerName !== 'string' || !customerName.trim()) {
            return NextResponse.json({ success: false, error: 'Invalid customerName' }, { status: 400 })
        }
        if (typeof customerPhone !== 'string') {
            return NextResponse.json({ success: false, error: 'Invalid customerPhone' }, { status: 400 })
        }
        if (!Array.isArray(items)) {
            return NextResponse.json({ success: false, error: 'items must be an array' }, { status: 400 })
        }
        if (typeof total !== 'string' && typeof total !== 'number') {
            return NextResponse.json({ success: false, error: 'Invalid total' }, { status: 400 })
        }
        if (date !== undefined && date !== null && typeof date !== 'string') {
            return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 })
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set')
            return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 503 })
        }

        const adminEmail = 'oljacenuk88@gmail.com'
        const fromAddress = 'Luximport <info@luximport.org>'

        const notifications: Promise<unknown>[] = []

        const adminPromise = resend.emails.send({
            from: fromAddress,
            to: adminEmail,
            subject: `Нове замовлення ${orderId}`,
            react: AdminNotificationEmail({
                orderId,
                customerName,
                customerPhone,
                customerEmail: typeof customerEmail === 'string' ? customerEmail : '',
                items,
                total: String(total),
                shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : '',
                date: typeof date === 'string' ? date : '',
            }),
        })
        notifications.push(adminPromise)

        if (typeof customerEmail === 'string' && customerEmail.trim()) {
            const customerPromise = resend.emails.send({
                from: fromAddress,
                to: customerEmail.trim(),
                subject: `Підтвердження замовлення ${orderId}`,
                react: CustomerReceiptEmail({
                    orderId,
                    customerName,
                    items,
                    total: String(total),
                    shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : '',
                    date: typeof date === 'string' ? date : '',
                }),
            })
            notifications.push(customerPromise)
        }

        const results = await Promise.allSettled(notifications)

        const errors = results.filter((result) => result.status === 'rejected')
        if (errors.length > 0) {
            console.error('Some emails failed to send:', errors)
        }

        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('Email API error:', error)
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
    }
}
