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
            category,
            origin,
            stock,
            "slug": slug.current,
            image
        }`,
        {},
        { cache: 'no-store' }
    )

    return <ClientCatalog products={products} />
}
