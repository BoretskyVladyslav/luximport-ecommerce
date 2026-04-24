import { useLayoutEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'
import { toCents, fromCents } from '@/lib/money'
import { unitPriceForQuantity } from '@/lib/cart/pricing'
import { safeJsonStorage } from '@/store/persistStorage'

interface CartState {
    items: CartItem[]
    isOpen: boolean
    cartIssues: Record<string, { code: string; message: string }>
    stockWarning: string | null
    isValidating: boolean
    lastValidatedKey: string | null
    validateCart: () => Promise<void>
    hasBlockingIssues: () => boolean
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    openCart: () => void
    closeCart: () => void
    toggleCart: () => void
    clearCart: () => void
    totalPrice: () => number
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            cartIssues: {},
            stockWarning: null,
            isValidating: false,
            lastValidatedKey: null,
            validateCart: async () => {
                const items = get().items
                if (items.length === 0) {
                    set({ cartIssues: {}, stockWarning: null, lastValidatedKey: null, isValidating: false })
                    return
                }

                const key = items
                    .filter((i) => i && typeof i.id === 'string' && i.id.trim())
                    .map((i) => `${i.id}:${typeof i.quantity === 'number' && Number.isFinite(i.quantity) ? Math.max(1, Math.trunc(i.quantity)) : 1}`)
                    .sort()
                    .join('|')

                if (get().isValidating) return
                if (key && get().lastValidatedKey === key) return

                try {
                    set({ isValidating: true })
                    const res = await fetch('/api/cart/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            items: items
                                .filter((i) => i && typeof i.id === 'string' && i.id.trim() && typeof i.quantity === 'number' && i.quantity > 0)
                                .map((i) => ({
                                productId: i.id,
                                quantity: Math.max(1, Math.trunc(i.quantity)),
                                clientUnitPrice: typeof i.price === 'number' && Number.isFinite(i.price) ? i.price : 0,
                                clientWholesalePrice: i.wholesalePrice,
                                clientWholesaleMinQuantity: i.wholesaleMinQuantity,
                                clientPiecesPerBox: i.piecesPerBox,
                            })),
                        }),
                    })

                    const data: unknown = await res.json().catch(() => null)
                    const issues: Record<string, { code: string; message: string }> = {}
                    const nextItems: CartItem[] = [...items]
                    let removedOutOfStock = false
                    if (data && typeof data === 'object' && 'issues' in data && Array.isArray((data as any).issues)) {
                        for (const issue of (data as any).issues) {
                            const productId = issue?.productId
                            const code = issue?.code
                            if (typeof productId !== 'string' || !productId) continue
                            if (typeof code !== 'string' || !code) continue
                            if (code === 'NOT_FOUND') issues[productId] = { code, message: 'Товар більше не доступний для замовлення' }
                            else if (code === 'OUT_OF_STOCK') issues[productId] = { code, message: 'На жаль, цей товар закінчився' }
                            else if (code === 'INSUFFICIENT_STOCK') issues[productId] = { code, message: 'Недостатньо товару на складі' }
                            else if (code === 'PRICE_CHANGED') issues[productId] = { code, message: 'Ціна оновилась, перевірте кошик' }
                        }
                    }

                    if (data && typeof data === 'object' && 'lines' in data && Array.isArray((data as any).lines)) {
                        const byId = new Map<string, { stock: number | null }>()
                        for (const line of (data as any).lines) {
                            const pid = line?.productId
                            const stock = line?.stock
                            if (typeof pid !== 'string' || !pid) continue
                            const normalizedStock =
                                typeof stock === 'number' && Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : null
                            byId.set(pid, { stock: normalizedStock })
                        }

                        for (const item of nextItems) {
                            const s = byId.get(item.id)?.stock
                            item.countInStock = typeof s === 'number' ? s : undefined
                            if (typeof s === 'number' && s <= 0) {
                                removedOutOfStock = true
                            }
                        }
                    }

                    let filteredItems = nextItems
                    if (Object.values(issues).some((i) => i.code === 'OUT_OF_STOCK')) {
                        const outIds = new Set(
                            Object.entries(issues)
                                .filter(([, v]) => v.code === 'OUT_OF_STOCK')
                                .map(([id]) => id)
                        )
                        if (outIds.size > 0) {
                            filteredItems = nextItems.filter((i) => !outIds.has(i.id))
                            removedOutOfStock = true
                        }
                    }

                    const adjustedItems = filteredItems.map((i) => {
                        if (typeof i.countInStock === 'number') {
                            const max = Math.max(0, Math.trunc(i.countInStock))
                            if (max === 0) return i
                            if (i.quantity > max) return { ...i, quantity: max }
                        }
                        return i
                    })

                    set({
                        items: adjustedItems,
                        cartIssues: issues,
                        stockWarning: removedOutOfStock
                            ? 'Цей товар щойно закінчився і був видалений з активного замовлення.'
                            : null,
                        isValidating: false,
                        lastValidatedKey: adjustedItems
                            .filter((i) => i && typeof i.id === 'string' && i.id.trim())
                            .map((i) => `${i.id}:${typeof i.quantity === 'number' && Number.isFinite(i.quantity) ? Math.max(1, Math.trunc(i.quantity)) : 1}`)
                            .sort()
                            .join('|'),
                    })
                } catch {
                    const issues: Record<string, { code: string; message: string }> = {}
                    for (const i of get().items) {
                        issues[i.id] = { code: 'VALIDATION_UNAVAILABLE', message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }
                    }
                    set({ cartIssues: issues, stockWarning: null, isValidating: false, lastValidatedKey: key })
                }
            },
            hasBlockingIssues: () => {
                const issues = get().cartIssues
                return Object.values(issues).some((i) => i.code !== 'PRICE_CHANGED')
            },
            addItem: (product) => {
                const currentItems = get().items
                const existingItem = currentItems.find((item) => item.id === product.id)
                const normalizedCountInStock =
                    typeof product.countInStock === 'number' && Number.isFinite(product.countInStock)
                        ? Math.max(0, Math.trunc(product.countInStock))
                        : null
                if (normalizedCountInStock !== null && normalizedCountInStock <= 0) return
                if (existingItem) {
                    if (normalizedCountInStock !== null && existingItem.quantity >= normalizedCountInStock) return
                    set({
                        items: currentItems.map((item) =>
                            item.id === product.id
                                ? {
                                      ...item,
                                      quantity: item.quantity + 1,
                                      countInStock:
                                          normalizedCountInStock !== null
                                              ? normalizedCountInStock
                                              : item.countInStock ?? undefined,
                                  }
                                : item
                        ),
                        isOpen: true,
                    })
                } else {
                    set({
                        items: [
                            ...currentItems,
                            {
                                ...product,
                                countInStock: normalizedCountInStock ?? undefined,
                                piecesPerBox:
                                    typeof product.piecesPerBox === 'number' && Number.isFinite(product.piecesPerBox) && product.piecesPerBox > 0
                                        ? Math.trunc(product.piecesPerBox)
                                        : undefined,
                                quantity: 1,
                            },
                        ],
                        isOpen: true,
                    })
                }
            },
            removeItem: (id) => {
                set({ items: get().items.filter((item) => item.id !== id) })
            },
            updateQuantity: (id, quantity) => {
                const item = get().items.find((i) => i.id === id)
                if (!item) return
                if (quantity < 1) {
                    set({ items: get().items.filter((i) => i.id !== id) })
                    return
                }
                const max =
                    typeof item.countInStock === 'number' && Number.isFinite(item.countInStock)
                        ? Math.max(0, Math.trunc(item.countInStock))
                        : null
                const isIncrement = quantity > item.quantity
                if (isIncrement && max !== null && quantity > max) return
                set({
                    items: get().items.map((item) =>
                        item.id === id ? { ...item, quantity } : item
                    ),
                })
            },
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            toggleCart: () => set({ isOpen: !get().isOpen }),
            clearCart: () => set({ items: [], cartIssues: {}, stockWarning: null, isValidating: false, lastValidatedKey: null }),
            totalPrice: () => {
                const cents = get().items.reduce((total, item) => {
                    const unit = unitPriceForQuantity({
                        price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0,
                        wholesalePrice: item.wholesalePrice ?? null,
                        wholesaleMinQuantity: item.wholesaleMinQuantity ?? null,
                        piecesPerBox: item.piecesPerBox ?? null,
                        quantity: typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? item.quantity : 1,
                    })
                    const qty = typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? item.quantity : 1
                    return total + toCents(unit) * qty
                }, 0)
                return fromCents(cents)
            },
        }),
        {
            name: 'luximport-cart-storage',
            storage: safeJsonStorage(() => localStorage),
            partialize: (state) => ({ items: state.items, isOpen: state.isOpen }),
            onRehydrateStorage: () => (state) => {
                if (!state) return
                const sanitized = Array.isArray(state.items)
                    ? state.items
                          .filter((i) => i && typeof i === 'object' && typeof (i as any).id === 'string' && (i as any).id.trim())
                          .map((raw) => {
                              const i = raw as any
                              const price = typeof i.price === 'number' && Number.isFinite(i.price) ? i.price : 0
                              const quantity = typeof i.quantity === 'number' && Number.isFinite(i.quantity) ? Math.max(1, Math.trunc(i.quantity)) : 1
                              const countInStock =
                                  typeof i.countInStock === 'number' && Number.isFinite(i.countInStock) ? Math.max(0, Math.trunc(i.countInStock)) : undefined
                              const piecesPerBox =
                                  typeof i.piecesPerBox === 'number' && Number.isFinite(i.piecesPerBox) && i.piecesPerBox > 0
                                      ? Math.trunc(i.piecesPerBox)
                                      : undefined
                              return { ...i, price, quantity, countInStock, piecesPerBox }
                          })
                    : []
                state.items = sanitized
                state.isValidating = false
                state.lastValidatedKey = null
            },
        }
    )
)

function getServerCartSnapshot(): CartState {
    return {
        items: [],
        isOpen: false,
        cartIssues: {},
        stockWarning: null,
        isValidating: false,
        lastValidatedKey: null,
        validateCart: async () => {},
        hasBlockingIssues: () => false,
        addItem: () => {},
        removeItem: () => {},
        updateQuantity: () => {},
        openCart: () => {},
        closeCart: () => {},
        toggleCart: () => {},
        clearCart: () => {},
        totalPrice: () => 0,
    }
}

export function useStore<T>(selector: (state: CartState) => T, equalityFn?: (a: T, b: T) => boolean): T {
    const [mounted, setMounted] = useState(false)
    useLayoutEffect(() => {
        setMounted(true)
    }, [])
    const fromStore = useCartStore(selector, equalityFn)
    return mounted ? fromStore : selector(getServerCartSnapshot())
}
