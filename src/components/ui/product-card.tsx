'use client'

import { Heart } from 'lucide-react'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlistStore'
import { useHydration } from '@/hooks/useHydration'
import { urlFor } from '@/lib/sanity'
import styles from './product-card.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1];

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase } }
}

interface ProductCardProps {
    id: string
    index: number
    title?: string
    slug?: string
    price?: string
    wholesalePrice?: number
    wholesaleMinQuantity?: number
    piecesPerBox?: number
    weight?: string
    category?: string
    origin?: string
    stock?: number
    image?: any
}

export function ProductCard({ id, index, title, slug, price, wholesalePrice, wholesaleMinQuantity, piecesPerBox, weight, category, origin, stock, image }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem)
    const { items: wishlistItems, toggleItem } = useWishlistStore()

    const productId = id
    const productTitle = title ?? `Товар Приклад #${index + 1}`
    const parsedFromString =
        typeof price === 'string' ? parseFloat(price.replace(/[^0-9.]/g, '')) : NaN
    const productPrice =
        typeof price === 'number' && Number.isFinite(price)
            ? price
            : Number.isFinite(parsedFromString)
              ? parsedFromString
              : 0
    const productCategory = category ?? 'КАТЕГОРІЯ'
    const hasWholesale =
        wholesalePrice !== undefined &&
        wholesaleMinQuantity !== undefined &&
        Number.isFinite(wholesalePrice) &&
        Number.isFinite(wholesaleMinQuantity)
    const wholesaleSaving =
        hasWholesale && wholesalePrice !== undefined
            ? productPrice - wholesalePrice
            : NaN

    const isHydrated = useHydration()

    const isLiked = isHydrated && wishlistItems.some((item) => item.id === productId)

    const countInStock = typeof stock === 'number' && Number.isFinite(stock) ? stock : null
    const isOutOfStock = typeof countInStock === 'number' && countInStock <= 0

    const handleAddToCart = () => {
        if (isOutOfStock) return
        addItem({
            id: productId,
            title: productTitle,
            price: productPrice,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
            countInStock,
            slug: slug ?? '',
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
            images: image ? [urlFor(image).url()] : [],
        })
    }

    return (
        <motion.div
            className={styles.card}
            variants={itemVariants}
            layout
            whileHover="hover"
            style={{ willChange: 'transform, opacity' }}
        >
            <div className={styles.imageWrapper}>
                {(origin || isOutOfStock) && (
                    <div className={styles.badgesContainer}>
                        {origin && <span className={styles.badge}>{origin}</span>}
                        {isOutOfStock && <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>Закінчився</span>}
                    </div>
                )}
                {image ? (
                    <div className={styles.imageContainer}>
                        <Image
                            src={urlFor(image).width(600).height(600).fit('fillmax').bg('ffffff').format('webp').quality(90).url()}
                            alt={productTitle}
                            fill
                            style={{ objectFit: 'contain', objectPosition: 'center' }}
                            className={isOutOfStock ? 'grayscale blur-[1px]' : undefined}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                ) : (
                    <div className={`${styles.imagePlaceholder} ${isOutOfStock ? 'grayscale blur-[1px]' : ''}`}>Немає фото</div>
                )}
                {isOutOfStock && (
                    <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/50">
                        <div className="rounded-md border border-white/30 bg-black/60 px-4 py-2 text-center font-body text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white">
                            НЕМАЄ В НАЯВНОСТІ
                        </div>
                    </div>
                )}
                <button
                    className={`${styles.likeBtn} ${isLiked ? styles.likeBtnActive : ''}`}
                    onClick={handleToggleWishlist}
                >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className={styles.content}>
                <div className={styles.category}>
                    {productCategory}{weight && <span className={styles.weight}> • {weight}</span>}
                </div>
                <h3 className={`${styles.title} ${isOutOfStock ? 'opacity-60' : ''}`}>{productTitle}</h3>
                {piecesPerBox !== undefined && (
                    <div className={styles.boxQty}>В ящику: {piecesPerBox} шт.</div>
                )}
                {hasWholesale && (
                    <>
                        <div className={styles.wholesaleBadge}>
                            {wholesalePrice} ₴ від {wholesaleMinQuantity} шт.
                        </div>
                        {Number.isFinite(wholesaleSaving) && wholesaleSaving > 0 && (
                            <div className={styles.savingsBadge}>
                                Економія {wholesaleSaving.toFixed(2)} ₴ / шт. при замовленні від{' '}
                                {piecesPerBox ?? wholesaleMinQuantity} шт.
                            </div>
                        )}
                    </>
                )}
                {stock !== undefined && stock < 5 && (
                    <div className={styles.stockWarning}>Залишилось лише {stock} шт.</div>
                )}
                <div className={styles.footer}>
                    <span className={`${styles.price} ${isOutOfStock ? 'opacity-60' : ''}`}>
                        {typeof price === 'string' && price.trim() !== ''
                            ? price
                            : Number.isFinite(productPrice) && productPrice > 0
                              ? `${productPrice} ₴`
                              : 'Ціну уточнюйте'}
                    </span>
                    <button
                        className={`${styles.addButton} ${isOutOfStock ? 'opacity-80' : ''}`}
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                    >
                        {isOutOfStock ? 'Немає в наявності' : 'ДОДАТИ'}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
