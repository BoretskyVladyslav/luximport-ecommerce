import * as React from 'react'
import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components'

export interface AdminOrderLine {
    id: string
    title: string
    price: number
    quantity: number
}

export interface AdminOrderNotificationProps {
    orderId: string
    customerName: string
    customerPhone: string
    customerEmail: string
    shippingAddress: string
    items: AdminOrderLine[]
    total: string
    date: string
}

export function AdminOrderNotification({
    orderId,
    customerName,
    customerPhone,
    customerEmail,
    shippingAddress,
    items,
    total,
    date,
}: AdminOrderNotificationProps) {
    const lines = items
        .map((i) => `${i.title} x${i.quantity} — ${(i.price * i.quantity).toLocaleString('uk-UA')} ₴`)
        .join('\n')

    return (
        <Html lang="uk">
            <Head />
            <Preview>Замовлення {orderId}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>{orderId}</Heading>
                    <Text style={meta}>{date}</Text>
                    <Hr style={hr} />
                    <Text style={label}>Клієнт</Text>
                    <Text style={value}>{customerName}</Text>
                    <Text style={value}>{customerPhone}</Text>
                    {customerEmail ? <Text style={value}>{customerEmail}</Text> : null}
                    <Hr style={hr} />
                    <Text style={label}>Доставка</Text>
                    <Text style={value}>{shippingAddress || '—'}</Text>
                    <Hr style={hr} />
                    <Text style={label}>Товари</Text>
                    <Text style={mono}>{lines || '—'}</Text>
                    <Hr style={hr} />
                    <Text style={totalAmount}>{total}</Text>
                </Container>
            </Body>
        </Html>
    )
}

export default AdminOrderNotification

const main = {
    backgroundColor: '#f4f4f5',
    fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
    padding: '24px 12px',
}

const container = {
    margin: '0 auto',
    maxWidth: '520px',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '6px',
    border: '1px solid #e4e4e7',
}

const h1 = {
    color: '#18181b',
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 4px',
}

const meta = {
    color: '#71717a',
    fontSize: '12px',
    margin: '0 0 16px',
}

const hr = {
    borderColor: '#e4e4e7',
    margin: '16px 0',
}

const label = {
    color: '#71717a',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    margin: '0 0 6px',
}

const value = {
    color: '#27272a',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 4px',
}

const mono = {
    color: '#27272a',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0',
    whiteSpace: 'pre-wrap' as const,
}

const totalAmount = {
    color: '#18181b',
    fontSize: '16px',
    fontWeight: '700',
    margin: '0',
}
