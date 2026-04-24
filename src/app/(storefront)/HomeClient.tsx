'use client'

import { motion } from 'framer-motion'
import { HeroSlider } from '@/components/ui/hero-slider'
import { BrandSlider } from '@/components/ui/BrandSlider'
import { Marquee } from '@/components/ui/marquee'
import { ProductCard } from '@/components/ui/product-card'
import type { HomeTeaserProduct } from '@/lib/sanity-queries'
import styles from './page.module.scss'

const premiumEase = [0.25, 0.1, 0.25, 1]

export function HomePageFrame({ children }: { children: React.ReactNode }) {
    return (
        <main>
            <HeroSlider />
            <BrandSlider />

            <Marquee />

            <section className={styles.advantagesSection}>
                <div className={styles.advantagesGrid}>
                    <motion.div
                        className={styles.advantageEditorial}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.8, ease: premiumEase, delay: 0 }}
                    >
                        <span className={styles.advantageNumber}>01</span>
                        <div className={styles.advantageContent}>
                            <h3 className={styles.advantageTitle}>ШВИДКА ДОСТАВКА</h3>
                            <p className={styles.advantageText}>
                                Ми дбаємо про те, щоб ваше замовлення прибуло вчасно та в ідеальному стані.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.advantageEditorial}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.8, ease: premiumEase, delay: 0.2 }}
                    >
                        <span className={styles.advantageNumber}>02</span>
                        <div className={styles.advantageContent}>
                            <h3 className={styles.advantageTitle}>ПРЕМІАЛЬНА ЯКІСТЬ</h3>
                            <p className={styles.advantageText}>
                                Тільки перевірені постачальники та сертифіковані продукти з Європи.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        className={styles.advantageEditorial}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.8, ease: premiumEase, delay: 0.4 }}
                    >
                        <span className={styles.advantageNumber}>03</span>
                        <div className={styles.advantageContent}>
                            <h3 className={styles.advantageTitle}>ПІДТРИМКА КЛІЄНТІВ</h3>
                            <p className={styles.advantageText}>
                                Наші менеджери завжди готові допомогти вам з вибором та оформленням замовлення.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {children}
        </main>
    )
}

export function HomeBestSellers({ products }: { products: HomeTeaserProduct[] }) {
    return (
        <section className={styles.bestSellersSection}>
            <motion.div
                className={styles.bestSellersHeader}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, ease: premiumEase }}
            >
                <p className={styles.bestSellersMeta}>SEASONAL SELECTION</p>
                <h2 className={styles.bestSellersTitle}>ХІТИ ПРОДАЖУ</h2>
            </motion.div>
            <motion.div
                className={styles.bestSellersGrid}
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.1 } },
                }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
            >
                {products.map((product, index) => (
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
                        category={product.category}
                        image={product.image}
                        stock={product.stock}
                    />
                ))}
            </motion.div>
        </section>
    )
}
