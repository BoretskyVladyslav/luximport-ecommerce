'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/authStore'
import { useOrderStore } from '@/store/orderStore'
import { useHydration } from '@/hooks/useHydration'
import styles from './cart-sidebar.module.scss'

export function CartSidebar() {
    const { items, isOpen, toggleCart, removeItem, updateQuantity, clearCart, totalPrice, addItem } = useCartStore()
    const { isAuthenticated } = useAuthStore()
    const { addOrder } = useOrderStore()
    const isHydrated = useHydration()
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            toggleCart()
        }
    }, [pathname])

    const total = totalPrice()
    const FREE_SHIPPING_THRESHOLD = 2000
    const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
    const progressPercentage = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)

    const handleCheckout = () => {
        toggleCart()
        router.push('/checkout')
    }

    const handleAddUpsell = (id: string, name: string, price: number) => {
        addItem({
            _id: id,
            id: id,
            title: name,
            slug: { current: id },
            price: price,
            description: '',
            images: [],
            category: 'other',
            brand: 'Luximport',
            country: 'Italy',
            isBestseller: false,
        } as any)
    }

    return (
        <>
            {isOpen && (
                <div className={styles.overlay} onClick={toggleCart} />
            )}

            <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.header}>
                    <span className={styles.title}>Кошик</span>
                    <button className={styles.closeBtn} onClick={toggleCart}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.itemsContainer}>
                    {items.length > 0 && isHydrated && (
                        <div className={styles.shippingProgressWrapper}>
                            <div className={styles.shippingText}>
                                {amountToFreeShipping > 0
                                    ? `ЗАЛИШИЛОСЬ ${amountToFreeShipping.toLocaleString('uk-UA')} ₴ ДО БЕЗКОШТОВНОЇ ДОСТАВКИ`
                                    : 'БЕЗКОШТОВНА ДОСТАВКА АКТИВОВАНА'}
                            </div>
                            <div className={styles.progressBarBg}>
                                <div
                                    className={styles.progressBarFill}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {!isHydrated ? null : items.length === 0 ? (
                        <p className={styles.emptyState}>Кошик порожній</p>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className={styles.item}>
                                <div className={styles.itemImage}>IMG</div>
                                <div className={styles.itemDetails}>
                                    <span className={styles.itemTitle}>{item.title}</span>
                                    {item.wholesalePrice && item.wholesaleMinQuantity && item.quantity >= item.wholesaleMinQuantity ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className={styles.wholesaleTag}>Гуртова ціна</span>
                                            <span className={styles.oldPrice}>
                                                {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                                            </span>
                                            <span className={styles.wholesalePrice}>
                                                {(item.wholesalePrice * item.quantity).toLocaleString('uk-UA')} ₴
                                            </span>
                                        </div>
                                    ) : (
                                        <span className={styles.itemPrice}>
                                            {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                                        </span>
                                    )}
                                    <div className={styles.controls}>
                                        <div className={styles.qtyContainer}>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                −
                                            </button>
                                            <span className={styles.qtyValue}>{item.quantity}</span>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeItem(item.id)}
                                        >
                                            Видалити
                                        </button>
                                    </div>
                                    {/* Gamification logic */}
                                    {item.wholesalePrice && item.wholesaleMinQuantity && (
                                        item.quantity >= item.wholesaleMinQuantity ? (
                                            <div className={styles.successPrompt}>Оптова знижка застосована</div>
                                        ) : (
                                            <div className={styles.upsellPrompt}>
                                                Додайте ще {item.wholesaleMinQuantity - item.quantity} шт. для оптової ціни
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className={styles.footer}>
                        <div className={styles.totalContainer}>
                            <span className={styles.totalLabel}>Разом</span>
                            <span className={styles.totalValue}>
                                {total.toLocaleString('uk-UA')} ₴
                            </span>
                        </div>
                        <button className={styles.checkoutBtn} onClick={handleCheckout}>ОФОРМИТИ ЗАМОВЛЕННЯ</button>

                        <div className={styles.upsellContainer}>
                            <h4 className={styles.upsellTitle}>ІДЕАЛЬНО ПАСУЄ</h4>
                            <div className={styles.upsellItem}>
                                <span className={styles.upsellName}>Оливкова олія Трюфельна</span>
                                <button className={styles.upsellAddBtn} onClick={() => handleAddUpsell('upsell-1', 'Оливкова олія Трюфельна', 350)}>ДОДАТИ</button>
                            </div>
                            <div className={styles.upsellItem}>
                                <span className={styles.upsellName}>Артишоки на грилі в олії</span>
                                <button className={styles.upsellAddBtn} onClick={() => handleAddUpsell('upsell-2', 'Артишоки на грилі в олії', 280)}>ДОДАТИ</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
