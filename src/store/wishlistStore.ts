import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeJsonStorage } from '@/store/persistStorage'

interface WishlistItem {
    id: string
    title: string
    price: number
    category: string
    images?: string[]
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
            storage: safeJsonStorage(() => localStorage),
            partialize: (state) => ({ items: state.items }),
            onRehydrateStorage: () => (state) => {
                if (!state) return
                const raw = Array.isArray(state.items) ? state.items : []
                const sanitized = raw
                    .filter((i) => i && typeof i === 'object')
                    .map((i: any) => ({
                        id: typeof i.id === 'string' ? i.id : '',
                        title: typeof i.title === 'string' ? i.title : '',
                        price: typeof i.price === 'number' && Number.isFinite(i.price) ? i.price : 0,
                        category: typeof i.category === 'string' ? i.category : '',
                        images: Array.isArray(i.images) ? i.images.filter((x: any) => typeof x === 'string') : undefined,
                    }))
                    .filter((i) => i.id.trim() && i.title.trim() && i.category.trim())
                state.items = sanitized
                state.isOpen = false
            },
        }
    )
)
