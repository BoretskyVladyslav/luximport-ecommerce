'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ProductCard } from '@/components/ui/product-card'
import styles from './page.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1]

const categories = ['КАВА ТА ЧАЙ', 'СОЛОДОЩІ', 'БАКАЛІЯ']

const filterCategories = ['Всі', ...categories]

export function ClientCatalog({ products }: { products: any[] }) {
    const [activeCategory, setActiveCategory] = useState('Всі')
    const [visibleCount, setVisibleCount] = useState(20)
    const [sortOrder, setSortOrder] = useState('default')

    const filteredData = useMemo(() => {
        let data = activeCategory === 'Всі'
            ? products
            : products.filter((p) => p.category === activeCategory)

        if (sortOrder === 'price-asc') {
            data = [...data].sort((a, b) => a.price - b.price)
        } else if (sortOrder === 'price-desc') {
            data = [...data].sort((a, b) => b.price - a.price)
        } else if (sortOrder === 'name-asc') {
            data = [...data].sort((a, b) => a.title.localeCompare(b.title))
        }

        return data
    }, [activeCategory, sortOrder, products])

    const visibleData = filteredData.slice(0, visibleCount)

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
                <span className={styles.countInfo}>
                    Всього товарів: {filteredData.length}
                </span>
                <div className={styles.sortWrapper}>
                    <span className={styles.sortLabel}>СОРТУВАННЯ:</span>
                    <select
                        className={styles.sortSelect}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
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
                    <p className={styles.filterTitle}>Категорії</p>
                    <ul className={styles.filterList}>
                        {filterCategories.map((cat) => {
                            const count = cat === 'Всі'
                                ? products.length
                                : products.filter(p => p.category === cat).length

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
                </motion.aside>

                <div>
                    <motion.div
                        className={styles.grid}
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        initial="hidden"
                        animate="show"
                    >
                        {visibleData.map((product, index) => (
                            <ProductCard
                                key={product._id}
                                index={index}
                                title={product.title}
                                slug={product.slug?.current || product.slug}
                                price={`${product.price} ₴`}
                                wholesalePrice={product.wholesalePrice}
                                wholesaleMinQuantity={product.wholesaleMinQuantity}
                                category={product.category}
                                image={product.image}
                            />
                        ))}
                    </motion.div>

                    {visibleCount < filteredData.length && (
                        <div className={styles.loadMoreContainer}>
                            <button
                                className={styles.loadMoreButton}
                                onClick={() => setVisibleCount((prev) => Math.min(prev + 20, filteredData.length))}
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
