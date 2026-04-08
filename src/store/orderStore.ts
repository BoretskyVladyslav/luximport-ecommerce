import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJsonStorage } from '@/store/persistStorage'
import type { OrderFulfillmentStatus, OrderPaymentStatus } from '@/types'

export interface OrderItem {
    id: string
    title: string
    price: number
    quantity: number
    wholesalePrice?: number
    wholesaleMinQuantity?: number
    imageUrl?: string
    images?: string[]
}

export interface Order {
    id: string
    date: string
    status: 'processing' | 'delivered' | 'cancelled'
    statusText: string
    total: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    shippingAddress: string
    items: OrderItem[]
    itemsCount?: number
    trackingNumber?: string
    fulfillment?: OrderFulfillmentStatus
    payment?: OrderPaymentStatus
    isPaid?: boolean
    sanityOrderStatus?: string
    sanityDocumentId?: string
    totalAmount?: number
}

interface OrderState {
    orders: Order[]
    lastOrder: Order | null
    addOrder: (order: Order) => void
    setLastOrder: (order: Order | null) => void
    clearOrders: () => void
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set) => ({
            orders: [],
            lastOrder: null,
            addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
            setLastOrder: (order) => set({ lastOrder: order }),
            clearOrders: () => set({ orders: [] }),
        }),
        {
            name: 'order-storage',
            storage: safeJsonStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (!state) return
                state.orders = Array.isArray(state.orders) ? state.orders : []
                state.lastOrder = state.lastOrder && typeof state.lastOrder === 'object' ? state.lastOrder : null
            },
        }
    )
)
