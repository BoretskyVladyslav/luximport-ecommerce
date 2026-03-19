import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import Image from 'next/image'
import { client, urlFor } from '@/lib/sanity'
import { AddToCartButton } from '@/components/ui/AddToCartButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ProductData {
    _id: string
    title: string
    slug: { current: string }
    price: number
    wholesalePrice?: number
    wholesaleMinQuantity?: number
    piecesPerBox?: number
    category?: string
    origin?: string
    stock?: number
    description?: string
    image?: any
    sku?: string
    brand?: string
    /** Stored as a string like "165г", "1.5кг" — unit already included */
    weight?: string
}

const PRODUCT_QUERY = `*[_type == "product" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  price,
  wholesalePrice,
  wholesaleMinQuantity,
  piecesPerBox,
  category,
  origin,
  stock,
  description,
  image,
  sku,
  brand,
  weight
}`

async function getProduct(slug: string): Promise<ProductData | null> {
    return client.fetch(PRODUCT_QUERY, { slug }, { cache: 'no-store' })
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string }
}): Promise<Metadata> {
    const product = await getProduct(params.slug)
    if (!product) return {}
    return {
        title: `${product.title} | Luximport`,
        description: product.description ?? undefined,
    }
}

export default async function ProductPage({
    params,
}: {
    params: { slug: string }
}) {
    const product = await getProduct(params.slug)

    if (!product) {
        notFound()
    }

    const imageUrl = product.image ? urlFor(product.image).width(600).height(600).fit('fillmax').bg('ffffff').format('webp').quality(90).url() : null

    return (
        <main className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                <div className="relative w-full aspect-square overflow-hidden bg-stone-100 rounded-lg">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover object-center w-full h-full"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-stone-300">
                            No image
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center gap-6">
                    {product.brand && (
                        <p className="text-xs uppercase tracking-widest text-stone-400">{product.brand}</p>
                    )}
                    <h1 className="font-serif text-3xl font-light tracking-wide text-stone-900">
                        {product.title}
                    </h1>
                    {product.origin && (
                        <span className="inline-block w-fit border border-stone-200 px-3 py-1 text-xs uppercase tracking-widest text-stone-500">
                            {product.origin}
                        </span>
                    )}
                    {product.description && (
                        <p className="text-sm leading-relaxed text-stone-500">{product.description}</p>
                    )}

                    <div className="border-t border-stone-100 pt-6">
                        <p className="text-2xl font-light text-stone-900">{product.price} ₴</p>
                        {product.wholesalePrice !== undefined && product.wholesaleMinQuantity !== undefined && (
                            <p className="mt-1 text-xs text-stone-400">
                                {product.wholesalePrice} ₴ від {product.wholesaleMinQuantity} шт.
                            </p>
                        )}
                    </div>

                    {product.stock !== undefined && product.stock < 5 && product.stock > 0 && (
                        <p className="text-xs text-amber-600 uppercase tracking-widest">
                            Залишилось лише {product.stock} шт.
                        </p>
                    )}

                    {product.stock === 0 && (
                        <p className="text-xs text-red-500 uppercase tracking-widest">Немає в наявності</p>
                    )}

                    <AddToCartButton
                        id={product._id}
                        title={product.title}
                        slug={product.slug?.current ?? ''}
                        price={product.price}
                        wholesalePrice={product.wholesalePrice}
                        wholesaleMinQuantity={product.wholesaleMinQuantity}
                        piecesPerBox={product.piecesPerBox}
                        category={product.category}
                        image={product.image}
                    />

                    <div className="border-t border-stone-100 pt-4 text-xs text-stone-400 space-y-1">
                        {product.sku && <p>Артикул: {product.sku}</p>}
                        {product.weight && <p>Вага/Об&apos;єм: {product.weight}</p>}
                        {product.piecesPerBox && <p>В ящику: {product.piecesPerBox} шт.</p>}
                    </div>
                </div>
            </div>
        </main>
    )
}
