import { client } from '@/lib/sanity'
import { ClientCatalog } from './ClientCatalog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CatalogPage() {
    const products = await client.fetch(
        `*[_type == "product"]{
            _id,
            title,
            price,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
            weight,
            "categories": categories[]->{ _id, title, "slug": slug.current },
            origin,
            stock,
            "slug": slug.current,
            image
        }`,
        {},
        { cache: 'no-store' }
    )

    const categories = await client.fetch(
        `*[_type == "category"]{
            _id,
            title,
            "slug": slug.current,
            "parent": parent->{ _id, title }
        }`,
        {},
        { cache: 'no-store' }
    )

    return <ClientCatalog products={products} categories={categories} />
}
