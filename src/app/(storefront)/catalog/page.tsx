import { client } from '@/lib/sanity'
import { ClientCatalog } from './ClientCatalog'

export const revalidate = 60 // Revalidate cache every 60 seconds

export default async function CatalogPage() {
    const products = await client.fetch(`*[_type == "product"]{
        _id,
        title,
        price,
        wholesalePrice,
        wholesaleMinQuantity,
        category,
        "slug": slug.current,
        image
    }`)

    return <ClientCatalog products={products} />
}
