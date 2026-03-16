import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartState {
    items: CartItem[]
    isOpen: boolean
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    toggleCart: () => void
    clearCart: () => void
    totalPrice: () => number
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            addItem: (product) => {
                const currentItems = get().items
                const existingItem = currentItems.find((item) => item.id === product.id)
                if (existingItem) {
                    set({
                        items: currentItems.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                        isOpen: true,
                    })
                } else {
                    set({ items: [...currentItems, { ...product, quantity: 1 }], isOpen: true })
                }
            },
            removeItem: (id) => {
                set({ items: get().items.filter((item) => item.id !== id) })
            },
            updateQuantity: (id, quantity) => {
                if (quantity < 1) return
                set({
                    items: get().items.map((item) =>
                        item.id === id ? { ...item, quantity } : item
                    ),
                })
            },
            toggleCart: () => set({ isOpen: !get().isOpen }),
            clearCart: () => set({ items: [] }),
            totalPrice: () => {
                return get().items.reduce((total, item) => {
                    const threshold = item.piecesPerBox ?? item.wholesaleMinQuantity
                    const priceToUse =
                        threshold &&
                            item.wholesalePrice &&
                            item.quantity >= threshold
                            ? item.wholesalePrice
                            : item.price
                    return total + priceToUse * item.quantity
                }, 0)
            },
        }),
        {
            name: 'luximport-cart',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
