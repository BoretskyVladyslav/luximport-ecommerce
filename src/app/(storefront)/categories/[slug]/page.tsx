import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { ProductCard } from '@/components/ui/product-card'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Product {
    _id: string
    title: string
    slug: { current: string }
    price: number
    wholesalePrice?: number
    wholesaleMinQuantity?: number
    piecesPerBox?: number
    weight?: string
    category?: string
    origin?: string
    stock?: number
    image?: any
}

interface CategoryData {
    title: string
    description?: string
    products: Product[]
}

const CATEGORY_QUERY = `{
  "category": *[_type == "category" && slug.current == $slug][0]{
    title,
    description
  },
  "products": *[_type == "product" && references(*[_type == "category" && slug.current == $slug]._id)]{
    _id,
    title,
    slug,
    price,
    wholesalePrice,
    wholesaleMinQuantity,
    piecesPerBox,
    weight,
    category,
    origin,
    stock,
    image
  }
}`

async function getCategoryData(slug: string): Promise<CategoryData | null> {
    const data = await client.fetch(CATEGORY_QUERY, { slug }, { cache: 'no-store' })
    if (!data.category) return null
    return { ...data.category, products: data.products ?? [] }
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string }
}): Promise<Metadata> {
    const data = await getCategoryData(params.slug)
    if (!data) return {}
    return {
        title: `${data.title} | Luximport`,
        description: data.description ?? undefined,
    }
}

export default async function CategoryPage({
    params,
}: {
    params: { slug: string }
}) {
    const data = await getCategoryData(params.slug)

    if (!data) {
        notFound()
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12">
                <h1 className="font-serif text-4xl font-light tracking-widest uppercase text-stone-900">
                    {data.title}
                </h1>
                {data.description && (
                    <p className="mt-4 max-w-xl text-sm text-stone-500 leading-relaxed">
                        {data.description}
                    </p>
                )}
                <p className="mt-2 text-xs tracking-widest uppercase text-stone-400">
                    {data.products.length} товарів
                </p>
            </div>

            {data.products.length === 0 ? (
                <p className="text-sm text-stone-400">У цій категорії поки що немає товарів.</p>
            ) : (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {data.products.map((product, index) => (
                        <ProductCard
                            key={product._id}
                            index={index}
                            title={product.title}
                            slug={product.slug?.current}
                            price={`${product.price} ₴`}
                            wholesalePrice={product.wholesalePrice}
                            wholesaleMinQuantity={product.wholesaleMinQuantity}
                            piecesPerBox={product.piecesPerBox}
                            weight={product.weight}
                            category={product.category}
                            origin={product.origin}
                            stock={product.stock}
                            image={product.image}
                        />
                    ))}
                </div>
            )}
        </main>
    )
}
