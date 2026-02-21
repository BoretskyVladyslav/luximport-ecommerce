'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cart'
import { useHydration } from '@/hooks/useHydration'
import styles from './wishlist-sidebar.module.scss'

export function WishlistSidebar() {
    const { items, isOpen, closeWishlist, toggleItem } = useWishlistStore()
    const addItem = useCartStore((state) => state.addItem)
    const isHydrated = useHydration()
    const pathname = usePathname()

    useEffect(() => {
        if (isOpen) {
            closeWishlist()
        }
    }, [pathname])

    const handleAddToCart = (item: { id: string; title: string; price: number; category: string }) => {
        addItem({
            id: item.id,
            title: item.title,
            price: item.price,
            slug: item.id,
            description: '',
            images: [],
            category: item.category,
        })
        toggleItem(item)
    }

    return (
        <>
            {isOpen && (
                <div className={styles.overlay} onClick={closeWishlist} />
            )}

            <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.header}>
                    <span className={styles.title}>Обране</span>
                    <button className={styles.closeBtn} onClick={closeWishlist}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.itemsContainer}>
                    {!isHydrated ? null : items.length === 0 ? (
                        <p className={styles.emptyState}>Список обраного порожній</p>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className={styles.item}>
                                <div className={styles.itemImage}>IMG</div>
                                <div className={styles.itemDetails}>
                                    <span className={styles.itemTitle}>{item.title}</span>
                                    <span className={styles.itemPrice}>
                                        {item.price.toLocaleString('uk-UA')} ₴
                                    </span>
                                    <div className={styles.controls}>
                                        <button
                                            className={styles.addToCartBtn}
                                            onClick={() => handleAddToCart(item)}
                                        >
                                            В КОШИК
                                        </button>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => toggleItem(item)}
                                        >
                                            Видалити
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
