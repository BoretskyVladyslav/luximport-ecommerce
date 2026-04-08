import { NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import {
    CART_RECOMMENDATIONS_BY_CATEGORY_TITLES_QUERY,
    CART_RECOMMENDATIONS_FALLBACK_QUERY,
    type CartRecommendationProduct,
} from '@/lib/sanity-queries'

const MAX_IDS = 80
const MAX_TITLES = 30
const CROSS_SELL_COUNT = 2

function uniqueStrings(arr: unknown, max: number): string[] {
    if (!Array.isArray(arr)) return []
    const out: string[] = []
    const seen = new Set<string>()
    for (const v of arr) {
        if (typeof v !== 'string') continue
        const t = v.trim()
        if (!t || seen.has(t)) continue
        seen.add(t)
        out.push(t)
        if (out.length >= max) break
    }
    return out
}

export async function POST(req: Request) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const excludeIds = uniqueStrings(
        body && typeof body === 'object' && 'excludeIds' in body ? (body as { excludeIds?: unknown }).excludeIds : [],
        MAX_IDS
    )
    const categoryTitles = uniqueStrings(
        body && typeof body === 'object' && 'categoryTitles' in body
            ? (body as { categoryTitles?: unknown }).categoryTitles
            : [],
        MAX_TITLES
    )

    const picked: CartRecommendationProduct[] = []
    const seen = new Set<string>()

    const pushUnique = (rows: CartRecommendationProduct[]) => {
        for (const row of rows) {
            if (!row?._id || seen.has(row._id)) continue
            seen.add(row._id)
            picked.push(row)
            if (picked.length >= CROSS_SELL_COUNT) return
        }
    }

    try {
        if (categoryTitles.length > 0) {
            const matched = await client.fetch<CartRecommendationProduct[]>(
                CART_RECOMMENDATIONS_BY_CATEGORY_TITLES_QUERY,
                { categoryTitles, excludeIds }
            )
            pushUnique(matched ?? [])
        }

        if (picked.length < CROSS_SELL_COUNT) {
            const excludeMore = [...excludeIds, ...picked.map((p) => p._id)]
            const fallback = await client.fetch<CartRecommendationProduct[]>(
                CART_RECOMMENDATIONS_FALLBACK_QUERY,
                { excludeIds: excludeMore }
            )
            pushUnique(fallback ?? [])
        }

        return NextResponse.json({ products: picked.slice(0, CROSS_SELL_COUNT) })
    } catch (e) {
        console.error('[cart/recommendations]', e)
        return NextResponse.json({ error: 'Failed to load recommendations' }, { status: 500 })
    }
}
