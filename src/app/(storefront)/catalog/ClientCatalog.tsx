'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductCard } from '@/components/ui/product-card'
import { ChevronRight } from 'lucide-react'
import {
    type CatalogCategory,
    collectDescendantIds,
    compareSortOrder,
    listDescendantsPreorder,
} from '@/lib/catalog-tree'
import type { CatalogProduct } from '@/lib/sanity-queries'
import styles from './page.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1]

export function ClientCatalog({
    products,
    categories,
    subcategories,
}: {
    products: CatalogProduct[]
    categories: CatalogCategory[]
    subcategories: CatalogCategory[]
}) {
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
    const [expandedMainIds, setExpandedMainIds] = useState<string[]>([])
    const [visibleCount, setVisibleCount] = useState(20)
    const [catalogSortKey, setCatalogSortKey] = useState('default')

    const roots = useMemo(
        () => categories.filter((c) => !c.parent?._id).sort(compareSortOrder),
        [categories]
    )

    const filteredData = useMemo(() => {
        let data = products

        if (activeCategoryId) {
            const idSet = new Set(
                collectDescendantIds(activeCategoryId, categories, subcategories)
            )
            data = products.filter((p) =>
                p.categories?.some((c) => idSet.has(c._id))
            )
        }

        if (catalogSortKey === 'price-asc') {
            data = [...data].sort((a, b) => {
                const pa =
                    typeof a.price === 'number' && Number.isFinite(a.price) ? a.price : Number.POSITIVE_INFINITY
                const pb =
                    typeof b.price === 'number' && Number.isFinite(b.price) ? b.price : Number.POSITIVE_INFINITY
                return pa - pb
            })
        } else if (catalogSortKey === 'price-desc') {
            data = [...data].sort((a, b) => {
                const pa =
                    typeof a.price === 'number' && Number.isFinite(a.price) ? a.price : Number.NEGATIVE_INFINITY
                const pb =
                    typeof b.price === 'number' && Number.isFinite(b.price) ? b.price : Number.NEGATIVE_INFINITY
                return pb - pa
            })
        } else if (catalogSortKey === 'name-asc') {
            data = [...data].sort((a, b) =>
                String(a.title ?? '').localeCompare(String(b.title ?? ''), 'uk')
            )
        }

        return data
    }, [activeCategoryId, catalogSortKey, products, categories, subcategories])

    const visibleData = filteredData.slice(0, visibleCount)

    const toggleMainCat = (id: string) => {
        setExpandedMainIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: premiumEase }}
                >
                    КАТАЛОГ
                </motion.h1>
                <motion.span
                    className={styles.meta}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: premiumEase, delay: 0.1 }}
                >
                    PREMIUM SELECTION
                </motion.span>
            </div>

            <motion.div
                className={styles.toolbar}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: premiumEase, delay: 0.2 }}
            >
                <div className={styles.countInfo}>
                    Всього товарів: <strong>{filteredData.length}</strong>
                </div>
                <div className={styles.sortWrapper}>
                    <span className={styles.sortLabel}>СОРТУВАННЯ:</span>
                    <select
                        className={styles.sortSelect}
                        value={catalogSortKey}
                        onChange={(e) => setCatalogSortKey(e.target.value)}
                    >
                        <option value='default'>За замовчуванням</option>
                        <option value='price-asc'>Від дешевих до дорогих</option>
                        <option value='price-desc'>Від дорогих до дешевих</option>
                        <option value='name-asc'>За назвою (А-Я)</option>
                    </select>
                </div>
            </motion.div>

            <div className={styles.layout}>
                <motion.aside
                    className={styles.sidebar}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: premiumEase, delay: 0.3 }}
                >
                    <div
                        className={`${styles.mainCategory} ${!activeCategoryId ? styles.mainCategoryActive : ''}`}
                        onClick={() => {
                            setActiveCategoryId(null)
                            setVisibleCount(20)
                        }}
                    >
                        <span>Всі товари</span>
                    </div>

                    {roots.map((main) => {
                        const nested = listDescendantsPreorder(
                            main._id,
                            categories,
                            subcategories,
                            0
                        )
                        const isExpanded = expandedMainIds.includes(main._id)
                        const desc = new Set(
                            collectDescendantIds(main._id, categories, subcategories)
                        )
                        const isActive =
                            !!activeCategoryId &&
                            (activeCategoryId === main._id || desc.has(activeCategoryId))

                        return (
                            <div key={main._id} className={styles.categoryGroup}>
                                <div
                                    className={`${styles.mainCategory} ${isActive ? styles.mainCategoryActive : ''}`}
                                >
                                    <span
                                        onClick={() => {
                                            setActiveCategoryId(main._id)
                                            setVisibleCount(20)
                                        }}
                                    >
                                        {main.title}
                                    </span>
                                    {nested.length > 0 && (
                                        <button
                                            className={`${styles.toggleBtn} ${isExpanded ? styles.toggleBtnOpen : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleMainCat(main._id)
                                            }}
                                            aria-label={isExpanded ? 'Згорнути' : 'Розгорнути'}
                                        >
                                            <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                                <AnimatePresence>
                                    {isExpanded && nested.length > 0 && (
                                        <motion.ul
                                            className={styles.subList}
                                            initial={{ opacity: 0, scaleY: 0.98 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            exit={{ opacity: 0, scaleY: 0.98 }}
                                            transition={{ duration: 0.18, ease: premiumEase }}
                                            style={{ willChange: 'transform, opacity' }}
                                        >
                                            {nested.map(({ node: child, depth }) => (
                                                <li
                                                    key={child._id}
                                                    className={`${styles.subItem} ${activeCategoryId === child._id ? styles.subItemActive : ''}`}
                                                    style={{ paddingLeft: `${0.5 + depth * 0.65}rem` }}
                                                    onClick={() => {
                                                        setActiveCategoryId(child._id)
                                                        setVisibleCount(20)
                                                    }}
                                                >
                                                    {child.title}
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </motion.aside>

                <div className={styles.catalogContent}>
                    <motion.div
                        className={styles.grid}
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
                        }}
                        initial='hidden'
                        animate='show'
                    >
                        {visibleData.map((product, index) => (
                            <ProductCard
                                key={product._id}
                                id={product._id}
                                index={index}
                                title={product.title ?? ''}
                                slug={product.slug ?? undefined}
                                price={
                                    typeof product.price === 'number' && Number.isFinite(product.price)
                                        ? `${product.price} ₴`
                                        : '—'
                                }
                                wholesalePrice={product.wholesalePrice}
                                wholesaleMinQuantity={product.wholesaleMinQuantity}
                                piecesPerBox={product.piecesPerBox}
                                weight={product.weight}
                                category={product.categories?.[0]?.title ?? 'Без категорії'}
                                image={product.image}
                            />
                        ))}
                    </motion.div>

                    {visibleCount < filteredData.length && (
                        <div className={styles.loadMoreContainer}>
                            <button
                                className={styles.loadMoreButton}
                                onClick={() =>
                                    setVisibleCount((prev) =>
                                        Math.min(prev + 20, filteredData.length)
                                    )
                                }
                            >
                                ПОКАЗАТИ БІЛЬШЕ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
