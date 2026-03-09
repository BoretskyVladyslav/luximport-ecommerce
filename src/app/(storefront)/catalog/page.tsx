import { client } from '@/lib/sanity'
import { ClientCatalog } from './ClientCatalog'

export default async function CatalogPage() {
    const products = await client.fetch(
        `*[_type == "product"]{
            _id,
            title,
            price,
            wholesalePrice,
            wholesaleMinQuantity,
            category,
            origin,
            stock,
            "slug": slug.current,
            image
        }`,
        {},
        { next: { tags: ['product'] } }
    )

    return <ClientCatalog products={products} />
}
