import { NextResponse } from 'next/server'
import { sendOrderEmails, type OrderEmailLine } from '@/lib/send-order-emails'

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseEmailItems(raw: unknown): OrderEmailLine[] | null {
    if (!Array.isArray(raw)) return null
    const out: OrderEmailLine[] = []
    for (let i = 0; i < raw.length; i++) {
        const row = raw[i]
        if (!row || typeof row !== 'object' || Array.isArray(row)) return null
        const o = row as Record<string, unknown>
        const id = typeof o.id === 'string' ? o.id : `line-${i}`
        const title = typeof o.title === 'string' ? o.title : ''
        const price = typeof o.price === 'number' && Number.isFinite(o.price) ? o.price : 0
        const quantity =
            typeof o.quantity === 'number' && Number.isFinite(o.quantity) ? Math.max(0, Math.trunc(o.quantity)) : 0
        out.push({ id, title, price, quantity })
    }
    return out
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
        const parsedItems = parseEmailItems(items)
        if (!parsedItems) {
            return NextResponse.json({ success: false, error: 'items must be an array of line objects' }, { status: 400 })
        }
        if (typeof total !== 'string' && typeof total !== 'number') {
            return NextResponse.json({ success: false, error: 'Invalid total' }, { status: 400 })
        }
        if (date !== undefined && date !== null && typeof date !== 'string') {
            return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 })
        }

        if (!process.env.RESEND_API_KEY) {
            console.error('[ORDER_EMAIL] RESEND_API_KEY is not set')
            return NextResponse.json({ success: false, error: 'Email not configured' }, { status: 503 })
        }

        const totalFormatted = String(total)
        const dateFormatted = typeof date === 'string' && date.trim() ? date.trim() : new Date().toLocaleDateString('uk-UA', { dateStyle: 'long' })

        try {
            await sendOrderEmails({
                orderId: orderId.trim(),
                customerName: customerName.trim(),
                customerEmail: typeof customerEmail === 'string' ? customerEmail : '',
                customerPhone,
                shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : '',
                items: parsedItems,
                totalFormatted,
                dateFormatted,
            })
        } catch (err) {
            console.error('[ORDER_EMAIL]', err)
            return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Email API error:', error)
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
    }
}
