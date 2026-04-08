import { client } from '@/lib/sanity'
import {
    GROQ_ORDER_MANUAL_SORT_THEN_NEWEST,
    PRODUCTS_CATALOG_QUERY,
    type CatalogProduct,
} from '@/lib/sanity-queries'
import { ClientCatalog } from './ClientCatalog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CatalogPage() {
    let products: CatalogProduct[] = []
    try {
        products = await client.fetch<CatalogProduct[]>(PRODUCTS_CATALOG_QUERY, {}, { cache: 'no-store' })
    } catch (e) {
        console.error('CatalogPage: failed to fetch products', e)
    }

    const categories = await client.fetch(
        `*[_type == "category"] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) {
            _id,
            title,
            sortOrder,
            _createdAt,
            "slug": slug.current,
            "parent": parent->{ _id }
        }`,
        {},
        { cache: 'no-store' }
    )

    const subcategories = await client.fetch(
        `*[_type == "subcategory"] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) {
            _id,
            title,
            sortOrder,
            _createdAt,
            "slug": slug.current,
            "parent": parent->{ _id }
        }`,
        {},
        { cache: 'no-store' }
    )

    return (
        <ClientCatalog
            products={products}
            categories={categories}
            subcategories={subcategories}
        />
    )
}
