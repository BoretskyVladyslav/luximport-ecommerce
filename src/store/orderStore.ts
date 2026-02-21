import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface OrderItem {
    id: string
    title: string
    price: number
    quantity: number
}

export interface Order {
    id: string
    date: string
    status: 'processing' | 'delivered' | 'cancelled'
    statusText: string
    total: string
    items: OrderItem[]
}

interface OrderState {
    orders: Order[]
    addOrder: (order: Order) => void
    clearOrders: () => void
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set) => ({
            orders: [],
            addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
            clearOrders: () => set({ orders: [] }),
        }),
        {
            name: 'order-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
