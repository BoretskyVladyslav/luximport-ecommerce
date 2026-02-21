'use client'

import { useState } from 'react'
import { ProductCard } from '@/components/ui/product-card'
import styles from '@/app/catalog/page.module.scss'

interface Product {
    _id: string
    title: string
    price: number
    category: string
    origin?: string
    stock?: number
}

interface CatalogFeedProps {
    products: Product[]
}

const filterCategories = ['Всі', 'Кава та чай', 'Солодощі', 'Бакалія', "М'ясо та сири"]

export function CatalogFeed({ products }: CatalogFeedProps) {
    const [activeCategory, setActiveCategory] = useState('Всі')
    const [visibleCount, setVisibleCount] = useState(20)

    const filteredData =
        activeCategory === 'Всі'
            ? products
            : products.filter((p) => p.category === activeCategory)

    const visibleData = filteredData.slice(0, visibleCount)

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <p className={styles.filterTitle}>Категорії</p>
                <ul className={styles.filterList}>
                    {filterCategories.map((cat) => (
                        <li
                            key={cat}
                            className={`${styles.filterItem} ${activeCategory === cat ? styles.filterItemActive : ''}`}
                            onClick={() => {
                                setActiveCategory(cat)
                                setVisibleCount(20)
                            }}
                        >
                            {cat}
                        </li>
                    ))}
                </ul>
            </aside>

            <div>
                <div className={styles.grid}>
                    {visibleData.map((product, index) => (
                        <ProductCard
                            key={product._id}
                            index={index}
                            title={product.title}
                            price={`${product.price} ₴`}
                            category={product.category}
                            origin={product.origin}
                            stock={product.stock}
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
            </div>
        </div>
    )
}
