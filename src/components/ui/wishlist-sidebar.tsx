'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useStore } from '@/store/cart'
import { useHydration } from '@/hooks/useHydration'
import Image from 'next/image'
import styles from './wishlist-sidebar.module.scss'

export function WishlistSidebar() {
    const { items, isOpen, closeWishlist, toggleItem } = useWishlistStore()
    const addItem = useStore((state) => state.addItem)
    const isHydrated = useHydration()
    const pathname = usePathname()
    const prevPathnameRef = useRef<string | null>(null)

    useEffect(() => {
        const prev = prevPathnameRef.current
        prevPathnameRef.current = pathname
        if (!prev) return
        if (prev !== pathname && isOpen) closeWishlist()
    }, [pathname, isOpen, closeWishlist])

    const handleAddToCart = (item: { id: string; title: string; price: number; category: string }) => {
        addItem({
            id: item.id,
            title: item.title,
            price: item.price,
            slug: { current: item.id },
            description: '',
            images: [],
            category: item.category,
        } as any)
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
                    <div style={{ display: isHydrated ? 'contents' : 'none' }}>
                        {items.length === 0 ? (
                            <p className={styles.emptyState}>Список обраного порожній</p>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className={styles.item}>
                                    <div className={styles.itemImage}>
                                        {item.images && item.images.length > 0 ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <Image
                                                    src={item.images[0]}
                                                    alt={item.title}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    sizes="80px"
                                                />
                                            </div>
                                        ) : (
                                            'IMG'
                                        )}
                                    </div>
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
            </div>
        </>
    )
}
