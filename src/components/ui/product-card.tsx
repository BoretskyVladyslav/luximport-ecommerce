'use client'

import { Heart } from 'lucide-react'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlistStore'
import { useHydration } from '@/hooks/useHydration'
import { urlFor } from '@/lib/sanity'
import styles from './product-card.module.scss'

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
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
    const addItem = useStore((state) => state.addItem)
    const openCart = useStore((state) => state.openCart)
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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (process.env.NODE_ENV !== 'production') {
            console.log('ADD_TO_CART_CLICKED', productId)
        }
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
        openCart()
    }

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault()
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
            className={`${styles.card} min-w-0`}
            variants={itemVariants}
            layout
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
                            className={isOutOfStock ? 'grayscale blur-sm' : undefined}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>
                ) : (
                    <div className={`${styles.imagePlaceholder} ${isOutOfStock ? 'grayscale blur-[1px]' : ''}`}>Немає фото</div>
                )}
                {isOutOfStock && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                        <div className="rounded-md bg-black/70 px-5 py-2 text-center font-body text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white">
                            РОЗПРОДАНО
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    className={`${styles.likeBtn} ${isLiked ? styles.likeBtnActive : ''} top-3 right-3 sm:top-4 sm:right-4`}
                    onClick={handleToggleWishlist}
                >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
            </div>
            <div className={`${styles.content} px-3 pb-3 sm:px-6 sm:pb-6`}>
                <div className={`${styles.category} max-w-full truncate`}>
                    {productCategory}{weight && <span className={styles.weight}> • {weight}</span>}
                </div>
                <h3 className={`${styles.title} ${isOutOfStock ? 'opacity-60' : ''} max-w-full break-words text-[0.82rem] leading-snug sm:text-sm`}>
                    {productTitle}
                </h3>
                {piecesPerBox !== undefined && (
                    <div className={`${styles.boxQty} text-[0.55rem] sm:text-[0.6rem]`}>В ящику: {piecesPerBox} шт.</div>
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
                <div className={`${styles.footer} gap-2`}>
                    <span className={`${styles.price} ${isOutOfStock ? 'opacity-60' : ''} min-w-0 truncate text-[1.05rem] sm:text-[1.2rem]`}>
                        {typeof price === 'string' && price.trim() !== ''
                            ? price
                            : Number.isFinite(productPrice) && productPrice > 0
                              ? `${productPrice} ₴`
                              : 'Ціну уточнюйте'}
                    </span>
                    <button
                        type="button"
                        className={`${styles.addButton} ${isOutOfStock ? 'opacity-80' : ''} shrink-0 whitespace-nowrap px-2 py-2 text-[0.65rem] sm:px-4 sm:py-2 sm:text-[0.7rem]`}
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
