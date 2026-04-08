/**
 * Shared logic for audit-duplicates.ts and delete-duplicates.ts.
 * Groups products by normalized title (trimmed, case-insensitive) + numeric price.
 */
export const PRODUCT_DUPLICATE_FETCH_GROQ = `*[_type == "product"] | order(_createdAt asc) {
  _id,
  title,
  price,
  "slug": slug.current,
  _createdAt
}`

export type ProductRow = {
    _id: string
    title?: string | null
    price?: number | null
    slug?: string | null
    _createdAt: string
}

export function normTitle(title: string | null | undefined): string {
    if (title === null || title === undefined) return ''
    return String(title).trim().toLowerCase()
}

export function priceKey(price: number | null | undefined): string {
    if (price === null || price === undefined || Number.isNaN(Number(price))) {
        return '__no_price__'
    }
    return String(Number(price))
}

export function groupKey(p: ProductRow): string | null {
    const t = normTitle(p.title)
    if (!t) return null
    return `${t}::${priceKey(p.price)}`
}

export type DuplicateGroup = {
    sorted: ProductRow[]
    keep: ProductRow
    deleteCandidates: ProductRow[]
}

/** Same grouping + sort as audit: oldest _createdAt (then _id) is keep; rest are duplicates. */
export function computeDuplicateGroups(products: ProductRow[]): DuplicateGroup[] {
    const byKey = new Map<string, ProductRow[]>()
    for (const p of products) {
        const key = groupKey(p)
        if (!key) continue
        if (!byKey.has(key)) byKey.set(key, [])
        byKey.get(key)!.push(p)
    }

    const duplicateEntries = Array.from(byKey.entries()).filter(([, rows]) => rows.length > 1)

    const groups: DuplicateGroup[] = []
    for (const [, rows] of duplicateEntries) {
        const sorted = [...rows].sort((a, b) => {
            const ta = new Date(a._createdAt).getTime()
            const tb = new Date(b._createdAt).getTime()
            if (ta !== tb) return ta - tb
            return a._id.localeCompare(b._id)
        })
        groups.push({
            sorted,
            keep: sorted[0],
            deleteCandidates: sorted.slice(1),
        })
    }
    return groups
}
