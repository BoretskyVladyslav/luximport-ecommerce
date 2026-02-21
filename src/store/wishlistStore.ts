import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface WishlistItem {
    id: string
    title: string
    price: number
    category: string
}

interface WishlistState {
    items: WishlistItem[]
    isOpen: boolean
    toggleItem: (item: WishlistItem) => void
    openWishlist: () => void
    closeWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            toggleItem: (item) => {
                const exists = get().items.find((i) => i.id === item.id)
                if (exists) {
                    set({ items: get().items.filter((i) => i.id !== item.id) })
                } else {
                    set({ items: [...get().items, item] })
                }
            },
            openWishlist: () => set({ isOpen: true }),
            closeWishlist: () => set({ isOpen: false }),
        }),
        {
            name: 'wishlist-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
