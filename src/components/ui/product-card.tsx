'use client'

import { Heart } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlistStore'
import { urlFor } from '@/lib/sanity'
import styles from './product-card.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1];

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
}

const imageVariants = {
    hover: { scale: 1.03, transition: { duration: 0.4, ease: premiumEase } }
}

interface ProductCardProps {
    index: number
    title?: string
    slug?: string
    price?: string
    wholesalePrice?: number
    wholesaleMinQuantity?: number
    category?: string
    origin?: string
    stock?: number
    image?: any
}

export function ProductCard({ index, title, slug, price, wholesalePrice, wholesaleMinQuantity, category, origin, stock, image }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem)
    const { items: wishlistItems, toggleItem } = useWishlistStore()

    const productId = slug ?? `product-${index}`
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
            wholesalePrice,
            wholesaleMinQuantity,
            slug: productId,
            description: '',
            images: image ? [urlFor(image).url()] : [],
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
        <motion.div
            className={styles.card}
            variants={itemVariants}
            layout
            whileHover="hover"
        >
            <div className={styles.imageWrapper}>
                {origin && (
                    <div className={styles.badgesContainer}>
                        <span className={styles.badge}>{origin}</span>
                    </div>
                )}
                {image ? (
                    <motion.div
                        style={{ position: 'relative', width: '100%', height: '100%' }}
                        variants={imageVariants}
                    >
                        <Image
                            src={urlFor(image).width(300).height(300).url()}
                            alt={productTitle}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </motion.div>
                ) : (
                    <div className={styles.imagePlaceholder}>IMG</div>
                )}
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
                {wholesalePrice !== undefined && wholesaleMinQuantity !== undefined && (
                    <>
                        <div className={styles.wholesaleBadge}>
                            {wholesalePrice} ₴ від {wholesaleMinQuantity} шт.
                        </div>
                        <div className={styles.savingsBadge}>
                            Економія {productPrice - wholesalePrice} ₴ / шт. при замовленні від {wholesaleMinQuantity} шт.
                        </div>
                    </>
                )}
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
        </motion.div>
    )
}
