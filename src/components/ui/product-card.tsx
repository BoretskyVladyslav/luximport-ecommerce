'use client'

import { Heart } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlistStore'
import styles from './product-card.module.scss'

interface ProductCardProps {
    index: number
    title?: string
    price?: string
    category?: string
    origin?: string
    stock?: number
}

export function ProductCard({ index, title, price, category, origin, stock }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem)
    const { items: wishlistItems, toggleItem } = useWishlistStore()

    const productId = `product-${index}`
    const productTitle = title ?? `Товар Приклад #${index + 1}`
    const productPrice = typeof price === 'string'
        ? parseFloat(price.replace(/[^0-9.]/g, ''))
        : 100 * (index + 1)
    const productCategory = category ?? 'КАТЕГОРІЯ'

    const isLiked = wishlistItems.some((item) => item.id === productId)

    const handleAddToCart = () => {
        addItem({
            id: productId,
            title: productTitle,
            price: productPrice,
            slug: productId,
            description: '',
            images: [],
            category: productCategory,
        })
    }

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation()
        toggleItem({
            id: productId,
            title: productTitle,
            price: productPrice,
            category: productCategory,
        })
    }

    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                {origin && (
                    <div className={styles.badgesContainer}>
                        <span className={styles.badge}>{origin}</span>
                    </div>
                )}
                <div className={styles.imagePlaceholder}>IMG</div>
                <button
                    className={`${styles.likeBtn} ${isLiked ? styles.likeBtnActive : ''}`}
                    onClick={handleToggleWishlist}
                >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className={styles.content}>
                <div className={styles.category}>{productCategory}</div>
                <h3 className={styles.title}>{productTitle}</h3>
                {stock !== undefined && stock < 5 && (
                    <div className={styles.stockWarning}>Залишилось лише {stock} шт.</div>
                )}
                <div className={styles.footer}>
                    <span className={styles.price}>{price ?? `${100 * (index + 1)} ₴`}</span>
                    <button className={styles.addButton} onClick={handleAddToCart}>
                        ДОДАТИ
                    </button>
                </div>
            </div>
        </div>
    )
}
