import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useState } from 'react'

export interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image: string
}

interface CartState {
    items: CartItem[]
    addItem: (item: Omit<CartItem, 'quantity'>) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                const existing = get().items.find((i) => i.id === item.id)
                if (existing) {
                    set({
                        items: get().items.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    })
                } else {
                    set({ items: [...get().items, { ...item, quantity: 1 }] })
                }
            },

            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) })
            },

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    set({ items: get().items.filter((i) => i.id !== id) })
                    return
                }
                set({
                    items: get().items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                })
            },

            clearCart: () => {
                set({ items: [] })
            },
        }),
        {
            name: 'luximport-cart',
        }
    )
)

export function useStore<T>(selector: (state: CartState) => T): T {
    const [isHydrated, setIsHydrated] = useState(false)
    const storeValue = useCartStore(selector)
    const defaultValue = selector({
        items: [],
        addItem: () => { },
        removeItem: () => { },
        updateQuantity: () => { },
        clearCart: () => { },
    })

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    return isHydrated ? storeValue : defaultValue
}
