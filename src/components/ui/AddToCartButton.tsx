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
    category?: string
    image?: any
}

export function AddToCartButton({ id, title, slug, price, wholesalePrice, wholesaleMinQuantity, piecesPerBox, category, image }: Props) {
    const addItem = useCartStore((state) => state.addItem)

    const handleAdd = () => {
        addItem({
            id,
            title,
            slug,
            price,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
            description: '',
            images: image ? [urlFor(image).url()] : [],
            category: category ?? '',
        })
    }

    return (
        <button
            onClick={handleAdd}
            className="w-full border border-stone-900 bg-stone-900 px-6 py-4 text-xs uppercase tracking-widest text-white transition-colors hover:bg-stone-700 active:bg-black"
        >
            Додати в кошик
        </button>
    )
}
