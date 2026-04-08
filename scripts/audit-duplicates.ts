/**
 * READ-ONLY: finds products that share the same title (case-insensitive, trimmed) and price.
 * For each duplicate group, marks the oldest _createdAt as [KEEP] and newer rows as [DELETE].
 *
 * No mutations — fetch only.
 *
 * Run:
 *   npm run audit:duplicates
 *   npx tsx scripts/audit-duplicates.ts
 */
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import path from 'path'

import {
    type ProductRow,
    PRODUCT_DUPLICATE_FETCH_GROQ,
    computeDuplicateGroups,
} from './lib/duplicate-product-groups'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset) {
    console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET in .env.local')
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-02-17',
    useCdn: false,
    token: token || undefined,
})

function formatWhen(iso: string): string {
    try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return iso
        return d.toISOString()
    } catch {
        return iso
    }
}

function displaySlug(slug: string | null | undefined): string {
    if (slug === null || slug === undefined || slug === '') return '(no slug)'
    return slug
}

async function run() {
    console.log('Duplicate product audit (read-only)\n')
    console.log('Fetching products…\n')

    const products = await client.fetch<ProductRow[]>(PRODUCT_DUPLICATE_FETCH_GROQ)
    const duplicateGroups = computeDuplicateGroups(products)

    if (duplicateGroups.length === 0) {
        console.log('No duplicate groups found (same title + price).')
        console.log(`Total products scanned: ${products.length}`)
        return
    }

    let groupIndex = 0
    for (const { keep: original, deleteCandidates: candidates } of duplicateGroups) {
        const displayTitle = (original.title ?? '').trim() || '(no title)'
        const displayPrice =
            original.price === null || original.price === undefined
                ? '(no price)'
                : `${original.price}`

        groupIndex += 1
        console.log('═'.repeat(72))
        console.log(`Group ${groupIndex}: "${displayTitle}" | Price: ${displayPrice}`)
        console.log('─'.repeat(72))
        console.log(
            `[KEEP] ${original._id} | ${formatWhen(original._createdAt)} | ${displaySlug(original.slug)}`
        )
        for (const c of candidates) {
            console.log(
                `[DELETE] ${c._id} | ${formatWhen(c._createdAt)} | ${displaySlug(c.slug)}`
            )
        }
        console.log('')
    }

    console.log('═'.repeat(72))
    console.log(`Summary: ${duplicateGroups.length} duplicate group(s), ${products.length} products scanned.`)
    console.log('\nThis script did not modify any data.')
}

run().catch((e) => {
    console.error(e)
    process.exit(1)
})
