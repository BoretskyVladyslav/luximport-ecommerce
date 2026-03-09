import { client } from '@/lib/sanity'
import { CategoryNavClient } from './CategoryNavClient'

interface SanityCategory {
    title: string
    slug: { current: string }
}

const CATEGORIES_QUERY = `*[_type == "category"] | order(title asc) {
  title,
  slug
}`

export async function CategoryNav() {
    const raw: SanityCategory[] = await client.fetch(CATEGORIES_QUERY, {}, {
        next: { tags: ['categories'] },
    })

    const categories = raw.map((c) => ({
        title: c.title,
        slug: c.slug.current,
    }))

    return <CategoryNavClient categories={categories} />
}
