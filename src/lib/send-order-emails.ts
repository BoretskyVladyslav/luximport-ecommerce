import React from 'react'
import { getResend } from '@/lib/resend'
import { CustomerReceiptEmail } from '@/components/emails/CustomerReceiptEmail'
import { AdminOrderNotification } from '@/components/emails/AdminOrderNotification'

export type OrderEmailLine = {
    id: string
    title: string
    price: number
    quantity: number
}

export type SendOrderEmailsInput = {
    orderId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    shippingAddress: string
    items: OrderEmailLine[]
    totalFormatted: string
    dateFormatted: string
}

export async function sendOrderEmails(input: SendOrderEmailsInput): Promise<void> {
    const resend = getResend()
    if (!resend) {
        console.error('[ORDER_EMAIL] RESEND_API_KEY is not configured')
        return
    }
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'Luximport <info@luximport.org>'
    const base = (process.env.NEXT_PUBLIC_DOMAIN || '').replace(/\/$/, '')
    const profileUrl = `${base}/account/profile`
    const tasks: Promise<unknown>[] = []
    const adminTo = process.env.ADMIN_EMAIL?.trim()
    if (adminTo) {
        tasks.push(
            resend.emails.send({
                from: fromAddress,
                to: adminTo,
                subject: `Нове замовлення ${input.orderId}`,
                react: React.createElement(AdminOrderNotification, {
                    orderId: input.orderId,
                    customerName: input.customerName,
                    customerPhone: input.customerPhone,
                    customerEmail: input.customerEmail,
                    shippingAddress: input.shippingAddress,
                    items: input.items,
                    total: input.totalFormatted,
                    date: input.dateFormatted,
                }),
            })
        )
    } else {
        console.error('[ORDER_EMAIL] ADMIN_EMAIL is not set; admin notification skipped')
    }
    const customerTo = input.customerEmail.trim()
    if (customerTo) {
        tasks.push(
            resend.emails.send({
                from: fromAddress,
                to: customerTo,
                subject: `Підтвердження замовлення ${input.orderId}`,
                react: React.createElement(CustomerReceiptEmail, {
                    orderId: input.orderId,
                    customerName: input.customerName,
                    items: input.items,
                    total: input.totalFormatted,
                    profileUrl,
                    shippingAddress: input.shippingAddress,
                    date: input.dateFormatted,
                }),
            })
        )
    }
    if (tasks.length === 0) return
    await Promise.all(tasks)
}
