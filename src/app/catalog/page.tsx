'use client'

import { useState, useMemo } from 'react'
import { ProductCard } from '@/components/ui/product-card'
import styles from './page.module.scss'

const categories = ['Кава та чай', 'Солодощі', 'Бакалія', 'М\'ясо та сири']
const mockNames = [
    'Artisanal Pasta', 'Truffle Oil Gold', 'Aged Parmigiano', 'Sicilian Olives',
    'Balsamic Vinegar', 'Espresso Beans', 'Dark Chocolate', 'Cured Salami',
    'Green Matcha', 'Wild Honey'
]

const mockProducts = Array.from({ length: 100 }, (_, i) => ({
    _id: `prod-${i}`,
    title: `${mockNames[i % mockNames.length]} ${i + 1}`,
    price: 100 + (i * 15) % 1500,
    category: categories[i % categories.length],
}))

const filterCategories = ['Всі', ...categories]

export default function CatalogPage() {
    const [activeCategory, setActiveCategory] = useState('Всі')
    const [visibleCount, setVisibleCount] = useState(20)
    const [sortOrder, setSortOrder] = useState('default')

    const filteredData = useMemo(() => {
        let data = activeCategory === 'Всі'
            ? mockProducts
            : mockProducts.filter((p) => p.category === activeCategory)

        if (sortOrder === 'price-asc') {
            data = [...data].sort((a, b) => a.price - b.price)
        } else if (sortOrder === 'price-desc') {
            data = [...data].sort((a, b) => b.price - a.price)
        } else if (sortOrder === 'name-asc') {
            data = [...data].sort((a, b) => a.title.localeCompare(b.title))
        }

        return data
    }, [activeCategory, sortOrder])

    const visibleData = filteredData.slice(0, visibleCount)

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>КАТАЛОГ</h1>
                <span className={styles.meta}>СЕЛЕКЦІЯ ПРЕМІУМ</span>
            </div>

            <div className={styles.toolbar}>
                <span className={styles.countInfo}>
                    Всього товарів: {filteredData.length}
                </span>
                <div className={styles.sortWrapper}>
                    <span className={styles.sortLabel}>СОРТУВАТИ:</span>
                    <select
                        className={styles.sortSelect}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value='default'>За замовчуванням</option>
                        <option value='price-asc'>Ціна (за зростанням)</option>
                        <option value='price-desc'>Ціна (за спаданням)</option>
                        <option value='name-asc'>Назва (А-Я)</option>
                    </select>
                </div>
            </div>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <p className={styles.filterTitle}>Категорії</p>
                    <ul className={styles.filterList}>
                        {filterCategories.map((cat) => {
                            const count = cat === 'Всі'
                                ? mockProducts.length
                                : mockProducts.filter(p => p.category === cat).length

                            return (
                                <li
                                    key={cat}
                                    className={`${styles.filterItem} ${activeCategory === cat ? styles.filterItemActive : ''}`}
                                    onClick={() => {
                                        setActiveCategory(cat)
                                        setVisibleCount(20)
                                    }}
                                >
                                    {cat} <span className={styles.categoryCount}>({count})</span>
                                </li>
                            )
                        })}
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
                            />
                        ))}
                    </div>

                    {visibleCount < filteredData.length && (
                        <div className={styles.loadMoreContainer}>
                            <button
                                className={styles.loadMoreButton}
                                onClick={() => setVisibleCount((prev) => Math.min(prev + 20, filteredData.length))}
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
