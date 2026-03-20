'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProductCard } from '@/components/ui/product-card'
import { ChevronRight } from 'lucide-react'
import styles from './page.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1]

interface Category {
    _id: string
    title: string
    slug: string
    parent?: { _id: string; title: string }
}

export function ClientCatalog({ products, categories }: { products: any[]; categories: Category[] }) {
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
    const [expandedMainCats, setExpandedMainCats] = useState<string[]>([])
    const [visibleCount, setVisibleCount] = useState(20)
    const [sortOrder, setSortOrder] = useState('default')

    const exactHierarchy = [
        {
            title: "Кондитерські вироби",
            children: [
                "Печиво Dr. Gerard",
                "Желейні цукерки",
                "Драже",
                "Батончики",
                "Вафлі та печиво",
                "Шоколадні цукерки",
                "Шоколадні пасти (креми)"
            ]
        },
        {
            title: "Гарячі напої",
            children: [
                "Кава",
                "Капучіно",
                "Чай"
            ]
        },
        {
            title: "Бакалія",
            children: [
                "Соуси та Кетчупи",
                "Консерви",
                "Олія",
                "Консервація"
            ]
        },
        {
            title: "Молочна продукція",
            children: [
                "Молоко"
            ]
        },
        {
            title: "Снеки",
            children: [
                "Горіхи"
            ]
        }
    ];

    const filteredData = useMemo(() => {
        let data = products;

        if (activeCategoryId) {
            const activeGroup = exactHierarchy.find(g => g.title === activeCategoryId);
            const childTitles = activeGroup ? activeGroup.children : [];
            const activeLower = activeCategoryId.toLowerCase().trim();

            data = products.filter((p) => {
                return p.categories?.some((c: any) => {
                    const title = c.title?.toLowerCase().trim() || '';
                    if (!title) return false;
                    
                    const isDirectMatch = title === activeLower || title.includes(activeLower) || activeLower.includes(title);
                    
                    const isChildMatch = childTitles.some(ct => {
                        const ctLower = ct.toLowerCase().trim();
                        return title === ctLower || title.includes(ctLower) || ctLower.includes(title);
                    });
                    
                    return isDirectMatch || isChildMatch;
                });
            });
        }

        if (sortOrder === 'price-asc') {
            data = [...data].sort((a, b) => a.price - b.price)
        } else if (sortOrder === 'price-desc') {
            data = [...data].sort((a, b) => b.price - a.price)
        } else if (sortOrder === 'name-asc') {
            data = [...data].sort((a, b) => a.title.localeCompare(b.title))
        }

        return data
    }, [activeCategoryId, sortOrder, products])

    const visibleData = filteredData.slice(0, visibleCount)

    const toggleMainCat = (id: string) => {
        setExpandedMainCats(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
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
                    <div
                        className={`${styles.mainCategory} ${!activeCategoryId ? styles.mainCategoryActive : ''}`}
                        onClick={() => {
                            setActiveCategoryId(null)
                            setVisibleCount(20)
                        }}
                    >
                        <span>Всі товари</span>
                    </div>

                    {exactHierarchy.map((main) => {
                        const subs = main.children;
                        const isExpanded = expandedMainCats.includes(main.title)
                        const isActive = activeCategoryId === main.title || subs.includes(activeCategoryId)

                        return (
                            <div key={main.title} className={styles.categoryGroup}>
                                <div className={`${styles.mainCategory} ${isActive ? styles.mainCategoryActive : ''}`}>
                                    <span
                                        onClick={() => {
                                            setActiveCategoryId(main.title)
                                            setVisibleCount(20)
                                        }}
                                    >
                                        {main.title}
                                    </span>
                                    {subs.length > 0 && (
                                        <button
                                            className={`${styles.toggleBtn} ${isExpanded ? styles.toggleBtnOpen : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleMainCat(main.title)
                                            }}
                                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                        >
                                            <ChevronRight size={12} />
                                        </button>
                                    )}
                                </div>
                                <AnimatePresence>
                                    {isExpanded && subs.length > 0 && (
                                        <motion.ul
                                            className={styles.subList}
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: premiumEase }}
                                        >
                                            {subs.map(subTitle => (
                                                <li
                                                    key={subTitle}
                                                    className={`${styles.subItem} ${activeCategoryId === subTitle ? styles.subItemActive : ''}`}
                                                    onClick={() => {
                                                        setActiveCategoryId(subTitle)
                                                        setVisibleCount(20)
                                                    }}
                                                >
                                                    {subTitle}
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
                                slug={product.slug}
                                price={`${product.price} ₴`}
                                wholesalePrice={product.wholesalePrice}
                                wholesaleMinQuantity={product.wholesaleMinQuantity}
                                piecesPerBox={product.piecesPerBox}
                                weight={product.weight}
                                category={product.categories?.[0]?.title}
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
