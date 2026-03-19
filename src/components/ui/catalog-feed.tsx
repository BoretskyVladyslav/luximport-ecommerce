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

    const hierarchy = useMemo(() => {
        const ALLOWED_CATEGORIES = ["Гарячі нопої", "Молочна продукція", "Бакалія", "Снеки"];
        
        const mainCategories = categories.filter((c) => {
            if (c.parent) return false;
            const title = c.title?.trim();
            // Allow strict matches plus the common typo variation explicitly requested
            return ALLOWED_CATEGORIES.includes(title) || title === "Гарячі напої";
        });

        // Remove duplicates by picking the first occurrence of each allowed category name
        const uniqueMainCategories = [];
        const seenTitles = new Set();
        
        for (const cat of mainCategories) {
            // Standardize title for comparison (e.g. treat "Гарячі напої" as "Гарячі нопої" for grouping)
            let standardTitle = cat.title.trim();
            if (standardTitle === "Гарячі напої") standardTitle = "Гарячі нопої";
            
            if (!seenTitles.has(standardTitle)) {
                seenTitles.add(standardTitle);
                uniqueMainCategories.push({
                    ...cat,
                    title: standardTitle // Ensure it displays exactly as requested
                });
            }
        }

        const subCategories = categories.filter((c) => c.parent);

        return uniqueMainCategories.map((main) => ({
            ...main,
            children: subCategories.filter((sub) => sub.parent?._id === main._id),
        }));
    }, [categories]);

    const toggleGroup = (categoryId: string) => {
        setOpenGroups((prev) =>
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        )
    }

    const handleSelectCategory = (categoryId: string) => {
        setActiveCategoryId(categoryId)
        setVisibleCount(20)
    }

    const filteredData = useMemo(() => {
        if (activeCategoryId === 'all') return products

        return products.filter((p) =>
            p.categories?.some((c) => c._id === activeCategoryId)
        )
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

                    {hierarchy.map((group) => (
                        <div key={group._id} className={styles.categoryGroup} style={{ marginBottom: '1rem' }}>
                            <div 
                                className={`${styles.mainCategory} ${activeCategoryId === group._id ? styles.mainCategoryActive : ''}`}
                            >
                                <span onClick={() => handleSelectCategory(group._id)} style={{ flexGrow: 1 }}>
                                    {group.title}
                                </span>
                                {group.children.length > 0 && (
                                    <span 
                                        onClick={() => toggleGroup(group._id)} 
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
                                                transform: openGroups.includes(group._id) ? 'rotate(90deg)' : 'rotate(0deg)',
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
                                    maxHeight: openGroups.includes(group._id) ? '500px' : '0',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                    opacity: openGroups.includes(group._id) ? 1 : 0
                                }}
                            >
                                <ul className={styles.subList}>
                                    {group.children.map((sub) => (
                                        <li 
                                            key={sub._id}
                                            className={`${styles.subItem} ${activeCategoryId === sub._id ? styles.subItemActive : ''}`}
                                            onClick={() => handleSelectCategory(sub._id)}
                                        >
                                            {sub.title}
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
 
