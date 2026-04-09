import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { client, urlFor } from '@/lib/sanity'
import { PRODUCT_BY_SLUG_QUERY, type ProductDetail } from '@/lib/sanity-queries'
import { AddToCartButton } from '@/components/ui/AddToCartButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function portableTextToPlainText(value: unknown): string | null {
    if (!Array.isArray(value)) return null
    const text = value
        .flatMap((block) => {
            if (!block || typeof block !== 'object') return []
            const children = (block as { _type?: string; children?: unknown[] }).children
            if (!Array.isArray(children)) return []
            return children
                .map((child) => {
                    if (!child || typeof child !== 'object') return ''
                    return typeof (child as { text?: unknown }).text === 'string' ? (child as { text: string }).text : ''
                })
                .filter(Boolean)
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    return text.length ? text : null
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
    try {
        const doc = await client.fetch<ProductDetail | null>(
            PRODUCT_BY_SLUG_QUERY,
            { slug },
            { cache: 'no-store' }
        )
        if (!doc?.slug?.current) {
            return null
        }
        return doc
    } catch (e) {
        console.error('getProduct fetch failed', e)
        return null
    }
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string }
}): Promise<Metadata> {
    const product = await getProduct(params.slug)
    if (!product) return {}
    const title = product.title ?? 'Товар'
    const plainDescription =
        typeof product.description === 'string' ? product.description : portableTextToPlainText(product.description)
    return {
        title: `${title} | Luximport`,
        description: plainDescription ?? undefined,
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

    const imageUrl = product.image
        ? urlFor(product.image).width(600).height(600).fit('fillmax').bg('ffffff').format('webp').quality(90).url()
        : null

    const displayTitle = product.title ?? 'Товар'
    const isOutOfStock = typeof product.stock === 'number' && Number.isFinite(product.stock) ? product.stock <= 0 : false

    return (
        <main className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                <div className="relative w-full aspect-square overflow-hidden bg-stone-100 rounded-lg">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={displayTitle}
                            fill
                            className={isOutOfStock ? "object-cover object-center w-full h-full grayscale blur-sm" : "object-cover object-center w-full h-full"}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            priority
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-stone-300">
                            No image
                        </div>
                    )}
                    {isOutOfStock && (
                        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                            <div className="rounded-md bg-black/70 px-5 py-2 text-center font-body text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white">
                                РОЗПРОДАНО
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center gap-6">
                    {product.brand && (
                        <p className="text-xs uppercase tracking-widest text-stone-400">{product.brand}</p>
                    )}
                    <h1 className="font-serif text-3xl font-light tracking-wide text-stone-900">
                        {displayTitle}
                    </h1>
                    {product.origin && (
                        <span className="inline-block w-fit border border-stone-200 px-3 py-1 text-xs uppercase tracking-widest text-stone-500">
                            {product.origin}
                        </span>
                    )}
                    {typeof product.description === 'string' && product.description.trim() ? (
                        <p className="text-sm leading-relaxed text-stone-500">{product.description}</p>
                    ) : Array.isArray(product.description) && product.description.length ? (
                        <div className="prose prose-stone max-w-none text-sm leading-relaxed">
                            <PortableText value={product.description as any} />
                        </div>
                    ) : null}

                    <div className="border-t border-stone-100 pt-6">
                        <p className="text-2xl font-light text-stone-900">
                            {Number.isFinite(product.price) ? `${product.price} ₴` : 'Ціну уточнюйте'}
                        </p>
                        {product.wholesalePrice !== undefined &&
                            Number.isFinite(product.wholesalePrice) &&
                            product.wholesaleMinQuantity !== undefined &&
                            Number.isFinite(product.wholesaleMinQuantity) && (
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
                        title={displayTitle}
                        slug={product.slug.current}
                        price={Number.isFinite(product.price) ? product.price : 0}
                        wholesalePrice={product.wholesalePrice ?? undefined}
                        wholesaleMinQuantity={product.wholesaleMinQuantity ?? undefined}
                        piecesPerBox={product.piecesPerBox ?? undefined}
                        countInStock={product.stock ?? null}
                        category={product.category ?? undefined}
                        image={product.image ?? undefined}
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
