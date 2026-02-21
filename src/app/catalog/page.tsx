"use client"

import { useState } from 'react'
import { ProductCard } from '@/components/ui/product-card'
import styles from './page.module.scss'

const categoryPool = ['Кава та чай', 'Солодощі', 'Бакалія', "М'ясо та сири"]

const allProducts = Array.from({ length: 300 }, (_, i) => ({
    id: i + 1,
    title: `ITEM ${(i + 1).toString().padStart(3, '0')}`,
    price: `${(i * 7 + 20) % 80 + 20} UAH`,
    category: categoryPool[i % categoryPool.length],
}))

const filterCategories = ['Всі', ...categoryPool]

export default function CatalogPage() {
    const [activeCategory, setActiveCategory] = useState('Всі')
    const [visibleCount, setVisibleCount] = useState(20)

    const filteredData =
        activeCategory === 'Всі'
            ? allProducts
            : allProducts.filter((p) => p.category === activeCategory)

    const visibleData = filteredData.slice(0, visibleCount)

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>КАТАЛОГ</h1>
                <span className={styles.meta}>СЕЛЕКЦІЯ ПРЕМІУМ</span>
            </div>

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
                        {visibleData.map(({ id, title, price, category }) => (
                            <ProductCard
                                key={id}
                                index={id - 1}
                                title={title}
                                price={price}
                                category={category}
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
        </div>
    )
}
