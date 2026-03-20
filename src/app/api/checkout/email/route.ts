import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import CustomerReceiptEmail from '@/emails/CustomerReceiptEmail';
import AdminNotificationEmail from '@/emails/AdminNotificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            orderId,
            customerName,
            customerPhone,
            customerEmail,
            shippingAddress,
            items,
            total,
            date
        } = body;

        const adminEmail = 'oljacenuk88@gmail.com';
        const fromAddress = 'Luximport <info@luximport.org>';

        const notifications = [];

        // Send Admin Notification
        const adminPromise = resend.emails.send({
            from: fromAddress,
            to: adminEmail,
            subject: `Нове замовлення ${orderId}`,
            react: AdminNotificationEmail({
                orderId,
                customerName,
                customerPhone,
                customerEmail,
                items,
                total,
                shippingAddress,
                date,
            }),
        });
        notifications.push(adminPromise);

        // Send Customer Receipt if email exists
        if (customerEmail) {
            const customerPromise = resend.emails.send({
                from: fromAddress,
                to: customerEmail,
                subject: `Підтвердження замовлення ${orderId}`,
                react: CustomerReceiptEmail({
                    orderId,
                    customerName,
                    items,
                    total,
                    shippingAddress,
                    date,
                }),
            });
            notifications.push(customerPromise);
        }

        // Wait for all emails to send, but don't fail if one fails (e.g., onboarding@resend.dev only sends to verified emails)
        const results = await Promise.allSettled(notifications);

        const errors = results.filter((result) => result.status === 'rejected');
        if (errors.length > 0) {
            console.error('Some emails failed to send:', errors);
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Email API error:', error);
        // Don't throw 500 so front-end UI continues, just return success: false
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 200 });
    }
}
