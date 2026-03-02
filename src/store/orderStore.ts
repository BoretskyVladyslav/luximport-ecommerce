import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface OrderItem {
    id: string
    title: string
    price: number
    quantity: number
    wholesalePrice?: number
    wholesaleMinQuantity?: number
}

export interface Order {
    id: string
    date: string
    status: 'processing' | 'delivered' | 'cancelled'
    statusText: string
    total: string
    customerName: string
    customerPhone: string
    shippingAddress: string
    items: OrderItem[]
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
            storage: createJSONStorage(() => localStorage),
        }
    )
)
