import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { PRODUCTS_BY_CATEGORY_REFS_QUERY, type CategoryGridProduct } from '@/lib/sanity-queries'
import { CategoryProductGrid } from '@/components/ui/category-product-grid'
import { CategoryPageSkeleton } from '@/components/ui/skeletons'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CategoryDoc {
    _id: string
    _type: 'category' | 'subcategory'
    title: string
    description?: string
}

interface FlatNode {
    _id: string
    parentId?: string
}

function collectDescendantIds(rootId: string, cats: FlatNode[], subs: FlatNode[]): string[] {
    const out = new Set<string>([rootId])
    for (const c of cats) {
        if (c.parentId === rootId) {
            for (const id of collectDescendantIds(c._id, cats, subs)) {
                out.add(id)
            }
        }
    }
    for (const s of subs) {
        if (s.parentId === rootId) {
            out.add(s._id)
        }
    }
    return Array.from(out)
}

interface CategoryData {
    title: string
    description?: string
    products: CategoryGridProduct[]
}

async function getCategoryData(slug: string): Promise<CategoryData | null> {
    const doc = await client.fetch<CategoryDoc | null>(
        `*[_type in ["category", "subcategory"] && slug.current == $slug][0]{
      _id,
      _type,
      title,
      description
    }`,
        { slug },
        { cache: 'no-store' }
    )

    if (!doc) return null

    const hierarchy = await client.fetch<{
        cats: FlatNode[]
        subs: FlatNode[]
    }>(
        `{
      "cats": *[_type == "category"]{ _id, "parentId": parent._ref },
      "subs": *[_type == "subcategory"]{ _id, "parentId": parent._ref }
    }`,
        {},
        { cache: 'no-store' }
    )

    const ids =
        doc._type === 'category'
            ? collectDescendantIds(doc._id, hierarchy.cats, hierarchy.subs)
            : [doc._id]

    let products: CategoryGridProduct[] = []
    try {
        products =
            (await client.fetch<CategoryGridProduct[]>(PRODUCTS_BY_CATEGORY_REFS_QUERY, { ids }, { cache: 'no-store' })) ??
            []
    } catch (e) {
        console.error('getCategoryData: products fetch failed', e)
    }

    return {
        title: doc.title,
        description: doc.description,
        products: products ?? [],
    }
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

async function CategoryPageBody({ slug }: { slug: string }) {
    const data = await getCategoryData(slug)

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
                <CategoryProductGrid products={data.products} />
            )}
        </main>
    )
}

export default function CategoryPage({
    params,
}: {
    params: { slug: string }
}) {
    return (
        <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryPageBody slug={params.slug} />
        </Suspense>
    )
}
