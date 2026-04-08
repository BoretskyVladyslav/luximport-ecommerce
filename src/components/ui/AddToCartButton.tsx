'use client'

import { useCartStore } from '@/store/cart'
import { urlFor } from '@/lib/sanity'

interface Props {
    id: string
    title: string
    slug: string
    price: number
    wholesalePrice?: number
    wholesaleMinQuantity?: number
    piecesPerBox?: number
    countInStock?: number | null
    category?: string
    image?: any
}

export function AddToCartButton({ id, title, slug, price, wholesalePrice, wholesaleMinQuantity, piecesPerBox, countInStock, category, image }: Props) {
    const addItem = useCartStore((state) => state.addItem)

    const isOutOfStock = typeof countInStock === 'number' && countInStock <= 0

    const handleAdd = () => {
        if (isOutOfStock) return
        addItem({
            id,
            title,
            slug,
            price,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
            countInStock,
            description: '',
            images: image ? [urlFor(image).url()] : [],
            category: category ?? '',
        })
    }

    return (
        <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="w-full border border-stone-900 bg-stone-900 px-6 py-4 text-xs uppercase tracking-widest text-white transition-colors hover:bg-stone-700 active:bg-black disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-200 disabled:text-stone-600 disabled:hover:bg-stone-200"
        >
            {isOutOfStock ? 'Немає в наявності' : 'Додати в кошик'}
        </button>
    )
}
