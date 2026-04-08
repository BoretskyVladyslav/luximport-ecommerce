'use client'

import { useState, useMemo } from 'react'
import { ProductCard } from '@/components/ui/product-card'
import {
    type CatalogCategory,
    collectDescendantIds,
    compareSortOrder,
    listDescendantsPreorder,
} from '@/lib/catalog-tree'
import type { CatalogProduct } from '@/lib/sanity-queries'
import styles from '@/app/(storefront)/catalog/page.module.scss'

interface CatalogFeedProps {
    products: CatalogProduct[]
    categories: CatalogCategory[]
    subcategories?: CatalogCategory[]
}

export function CatalogFeed({ products, categories = [], subcategories = [] }: CatalogFeedProps) {
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
    const [expandedMainIds, setExpandedMainIds] = useState<string[]>([])
    const [visibleCount, setVisibleCount] = useState(20)
    const [catalogSortKey, setCatalogSortKey] = useState('default')

    const roots = useMemo(
        () => categories.filter((c) => !c.parent?._id).sort(compareSortOrder),
        [categories]
    )

    const toggleGroup = (id: string) => {
        setExpandedMainIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const filteredData = useMemo(() => {
        let data = !activeCategoryId
            ? products
            : (() => {
                  const idSet = new Set(collectDescendantIds(activeCategoryId, categories, subcategories))
                  return products.filter((p) => p.categories?.some((c) => idSet.has(c._id)))
              })()

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
        }

        return data
    }, [products, activeCategoryId, categories, subcategories, catalogSortKey])

    const visibleData = filteredData.slice(0, visibleCount)

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Каталог</h1>
                    <p className={styles.meta}>Всі товари</p>
                </div>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.countInfo}>
                    Показано {visibleData.length} з {filteredData.length}
                </div>
                <div className={styles.sortWrapper}>
                    <span className={styles.sortLabel}>Сортувати:</span>
                    <select
                        className={styles.sortSelect}
                        value={catalogSortKey}
                        onChange={(e) => setCatalogSortKey(e.target.value)}
                    >
                        <option value="default">За замовчуванням</option>
                        <option value="price-asc">Від дешевих</option>
                        <option value="price-desc">Від дорогих</option>
                    </select>
                </div>
            </div>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <div className={styles.categoryGroup} style={{ marginBottom: '1rem' }}>
                        <div
                            className={`${styles.mainCategory} ${!activeCategoryId ? styles.mainCategoryActive : ''}`}
                            onClick={() => {
                                setActiveCategoryId(null)
                                setVisibleCount(20)
                            }}
                        >
                            <span>Всі товари</span>
                        </div>
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
                            <div key={main._id} className={styles.categoryGroup} style={{ marginBottom: '1rem' }}>
                                <div
                                    className={`${styles.mainCategory} ${isActive ? styles.mainCategoryActive : ''}`}
                                >
                                    <span
                                        onClick={() => {
                                            setActiveCategoryId(main._id)
                                            setVisibleCount(20)
                                        }}
                                        style={{ flexGrow: 1 }}
                                    >
                                        {main.title}
                                    </span>
                                    {nested.length > 0 && (
                                        <span
                                            onClick={() => toggleGroup(main._id)}
                                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                                        >
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{
                                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease',
                                                }}
                                            >
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </span>
                                    )}
                                </div>

                                <div
                                    style={{
                                        maxHeight: isExpanded ? '500px' : '0',
                                        overflow: 'hidden',
                                        transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                        opacity: isExpanded ? 1 : 0,
                                    }}
                                >
                                    <ul className={styles.subList}>
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
                                    </ul>
                                </div>
                            </div>
                        )
                    })}
                </aside>

                <main>
                    <div className={styles.grid}>
                        {visibleData.map((product, index) => (
                            <ProductCard
                                key={product._id}
                                id={product._id}
                                index={index}
                                slug={(product.slug ?? undefined) || product._id}
                                title={product.title ?? ''}
                                price={
                                    typeof product.price === 'number' && Number.isFinite(product.price)
                                        ? `${product.price} ₴`
                                        : '—'
                                }
                                wholesalePrice={product.wholesalePrice}
                                wholesaleMinQuantity={product.wholesaleMinQuantity}
                                piecesPerBox={product.piecesPerBox}
                                weight={product.weight}
                                category={product.categories?.[0]?.title || 'Без категорії'}
                                origin={product.origin}
                                stock={product.stock}
                                image={product.image}
                            />
                        ))}
                    </div>

                    {visibleCount < filteredData.length && (
                        <div className={styles.loadMoreContainer}>
                            <button
                                className={styles.loadMoreButton}
                                onClick={() => setVisibleCount((prev) => prev + 20)}
                            >
                                ПОКАЗАТИ ЩЕ
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
