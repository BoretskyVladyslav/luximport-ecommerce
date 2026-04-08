'use client'

import { motion } from 'framer-motion'
import { ProductCard } from '@/components/ui/product-card'
import type { CategoryGridProduct } from '@/lib/sanity-queries'

const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
}

export function CategoryProductGrid({ products }: { products: CategoryGridProduct[] }) {
    return (
        <motion.div
            className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-48px' }}
            variants={listVariants}
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
                    category={product.category ?? 'Без категорії'}
                    origin={product.origin}
                    stock={product.stock}
                    image={product.image}
                />
            ))}
        </motion.div>
    )
}
