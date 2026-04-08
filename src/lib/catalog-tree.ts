export type CatalogCategory = {
    _id: string
    title: string
    slug?: string
    sortOrder?: number
    _createdAt: string
    parent?: { _id: string }
}

export type TreeChild = CatalogCategory

export function compareSortOrder(
    a: { sortOrder?: number; _createdAt: string },
    b: { sortOrder?: number; _createdAt: string }
) {
    const ao = a.sortOrder ?? 99
    const bo = b.sortOrder ?? 99
    if (ao !== bo) return ao - bo
    return b._createdAt.localeCompare(a._createdAt)
}

export function collectDescendantIds(
    rootId: string,
    categories: CatalogCategory[],
    subcategories: CatalogCategory[]
): string[] {
    const ids = new Set<string>([rootId])
    for (const c of categories) {
        if (c.parent?._id === rootId) {
            for (const id of collectDescendantIds(c._id, categories, subcategories)) {
                ids.add(id)
            }
        }
    }
    for (const s of subcategories) {
        if (s.parent?._id === rootId) {
            ids.add(s._id)
        }
    }
    return Array.from(ids)
}

export function listDescendantsPreorder(
    parentId: string,
    categories: CatalogCategory[],
    subcategories: CatalogCategory[],
    depth: number
): { node: TreeChild; depth: number }[] {
    const childCats = categories.filter((c) => c.parent?._id === parentId)
    const childSubs = subcategories.filter((s) => s.parent?._id === parentId)
    const merged = [...childCats, ...childSubs].sort(compareSortOrder)
    const out: { node: TreeChild; depth: number }[] = []
    for (const node of merged) {
        out.push({ node, depth })
        if (categories.some((c) => c._id === node._id)) {
            out.push(
                ...listDescendantsPreorder(
                    node._id,
                    categories,
                    subcategories,
                    depth + 1
                )
            )
        }
    }
    return out
}
