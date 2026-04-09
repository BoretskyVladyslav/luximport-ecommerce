'use client'

import { ProfileOrderCard, type ProfileOrderLine } from './ProfileOrderCard'
import type { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types'

export type OrderCardVm = {
    id: string
    date: string
    total: string
    itemsCount: number
    fulfillment: OrderFulfillmentStatus
    payment: OrderPaymentStatus
    canPay: boolean
    isPaidDisplay: boolean
    isCancelled: boolean
    trackingNumber?: string
    lines: ProfileOrderLine[]
    sanityDocumentId?: string
}

export default function OrdersListClient(props: {
    items: OrderCardVm[]
    onOrdersInvalidate: () => void
    onProfilePay: (sanityDocumentId: string) => void
    paymentLoadingOrderId: string | null
    wayforpayReady: boolean
}) {
    const { items, onOrdersInvalidate, onProfilePay, paymentLoadingOrderId, wayforpayReady } = props

    return (
        <div className="flex flex-col gap-4">
            {items.map((order) => (
                <div key={order.id} className="rounded-lg border border-stone-200 bg-white px-6 py-6">
                    <ProfileOrderCard
                        id={order.id}
                        date={order.date}
                        total={order.total}
                        itemsCount={order.itemsCount}
                        fulfillment={order.fulfillment}
                        payment={order.payment}
                        canPay={order.canPay}
                        isPaidDisplay={order.isPaidDisplay}
                        isCancelled={order.isCancelled}
                        trackingNumber={order.trackingNumber}
                        lines={order.lines}
                        sanityDocumentId={order.sanityDocumentId}
                        onOrdersInvalidate={onOrdersInvalidate}
                        onProfilePay={onProfilePay}
                        profilePayInProgress={
                            paymentLoadingOrderId !== null && paymentLoadingOrderId === order.sanityDocumentId
                        }
                        wayforpayReady={wayforpayReady}
                    />
                </div>
            ))}
        </div>
    )
}

