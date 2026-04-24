export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'

export type OrderState = {
    status: FulfillmentStatus
    paymentStatus: PaymentStatus
    isPaid: boolean
}

export const ORDER_STATE_PENDING: OrderState = {
    status: 'pending',
    paymentStatus: 'pending',
    isPaid: false,
}

export const ORDER_STATE_PAID: OrderState = {
    status: 'processing',
    paymentStatus: 'paid',
    isPaid: true,
}

export const ORDER_STATE_PAYMENT_FAILED: OrderState = {
    status: 'pending',
    paymentStatus: 'failed',
    isPaid: false,
}

export function paymentEventKey(orderReference: string, transactionStatus: string): string {
    return `${orderReference.trim()}::${transactionStatus.trim()}`
}

