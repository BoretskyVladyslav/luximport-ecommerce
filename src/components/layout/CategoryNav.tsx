import { client } from '@/lib/sanity'
import { GROQ_ORDER_MANUAL_SORT_THEN_NEWEST } from '@/lib/sanity-queries'
import { CategoryNavClient } from './CategoryNavClient'

interface SanityCategory {
    title: string
    slug: { current: string }
}

const CATEGORIES_QUERY = `*[_type == "category" && !defined(parent) && defined(slug.current)] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) {
  title,
  slug
}`

export async function CategoryNav() {
    const raw: SanityCategory[] = await client.fetch(
        CATEGORIES_QUERY,
        {},
        {
            cache: 'no-store',
        }
    )

    const categories = raw.map((c) => ({
        title: c.title,
        slug: c.slug.current,
    }))

    return <CategoryNavClient categories={categories} />
}
