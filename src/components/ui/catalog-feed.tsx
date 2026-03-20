'use client'

import { useState, useMemo } from 'react'
import { ProductCard } from '@/components/ui/product-card'
import styles from '@/app/(storefront)/catalog/page.module.scss'

interface Category {
    _id: string
    title: string
    slug: string
    parent?: { _id: string, title: string }
}

interface Product {
    _id: string
    title: string
    price: number
    wholesalePrice?: number
    categories?: { _id: string, title: string, slug: string }[]
    origin?: string
    stock?: number
    image?: any
}

interface CatalogFeedProps {
    products: Product[]
    categories: Category[]
}

export function CatalogFeed({ products, categories = [] }: CatalogFeedProps) {
    const [activeCategoryId, setActiveCategoryId] = useState('all')
    const [openGroups, setOpenGroups] = useState<string[]>([])
    const [visibleCount, setVisibleCount] = useState(20)

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

    const toggleGroup = (categoryTitle: string) => {
        setOpenGroups((prev) =>
            prev.includes(categoryTitle)
                ? prev.filter((title) => title !== categoryTitle)
                : [...prev, categoryTitle]
        )
    }

    const handleSelectCategory = (categoryTitle: string) => {
        setActiveCategoryId(categoryTitle)
        setVisibleCount(20)
    }

    const filteredData = useMemo(() => {
        if (activeCategoryId === 'all') return products

        const activeGroup = exactHierarchy.find(g => g.title === activeCategoryId);
        
        const childTitles = activeGroup ? activeGroup.children : [];

        return products.filter((p) => {
            return p.categories?.some((c) => {
                const title = c.title?.trim() || '';
                const isMatch = (t: string) => t.toLowerCase() === title.toLowerCase() || 
                                       title.toLowerCase().includes(t.toLowerCase().substring(0, 5));
                return isMatch(activeCategoryId) || childTitles.some(isMatch);
            });
        });
    }, [products, activeCategoryId])

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
                    <select className={styles.sortSelect}>
                        <option value="newest">За замовчуванням</option>
                        <option value="price-asc">Від дешевих</option>
                        <option value="price-desc">Від дорогих</option>
                    </select>
                </div>
            </div>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <div className={styles.categoryGroup} style={{ marginBottom: '1rem' }}>
                        <div 
                            className={`${styles.mainCategory} ${activeCategoryId === 'all' ? styles.mainCategoryActive : ''}`}
                            onClick={() => handleSelectCategory('all')}
                        >
                            <span>Всі товари</span>
                        </div>
                    </div>

                    {exactHierarchy.map((group) => (
                        <div key={group.title} className={styles.categoryGroup} style={{ marginBottom: '1rem' }}>
                            <div 
                                className={`${styles.mainCategory} ${activeCategoryId === group.title ? styles.mainCategoryActive : ''}`}
                            >
                                <span onClick={() => handleSelectCategory(group.title)} style={{ flexGrow: 1 }}>
                                    {group.title}
                                </span>
                                {group.children.length > 0 && (
                                    <span 
                                        onClick={() => toggleGroup(group.title)} 
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
                                                transform: openGroups.includes(group.title) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s ease'
                                            }}
                                        >
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </span>
                                )}
                            </div>

                            <div 
                                style={{
                                    maxHeight: openGroups.includes(group.title) ? '500px' : '0',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                    opacity: openGroups.includes(group.title) ? 1 : 0
                                }}
                            >
                                <ul className={styles.subList}>
                                    {group.children.map((subTitle) => (
                                        <li 
                                            key={subTitle}
                                            className={`${styles.subItem} ${activeCategoryId === subTitle ? styles.subItemActive : ''}`}
                                            onClick={() => handleSelectCategory(subTitle)}
                                        >
                                            {subTitle}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </aside>

                <main>
                    <div className={styles.grid}>
                        {visibleData.map((product, index) => (
                            <ProductCard
                                key={product._id}
                                index={index}
                                slug={product._id}
                                title={product.title}
                                price={`${product.price} ₴`}
                                wholesalePrice={product.wholesalePrice}
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
 
