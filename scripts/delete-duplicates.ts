/**
 * Deletes duplicate products (same normalized title + price), keeping the oldest _createdAt.
 *
 * SAFETY: DRY RUN by default (no deletes). Pass --commit to execute.
 *
 * Grouping matches scripts/audit-duplicates.ts via scripts/lib/duplicate-product-groups.ts.
 *
 * Dry run:
 *   npm run delete:duplicates
 *   npx tsx scripts/delete-duplicates.ts
 *
 * Commit:
 *   npm run delete:duplicates -- --commit
 *   npx tsx scripts/delete-duplicates.ts --commit
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

const COMMIT = process.argv.includes('--commit')

if (!projectId || !dataset) {
    console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET in .env.local')
    process.exit(1)
}

if (COMMIT && !token) {
    console.error('Missing SANITY_API_TOKEN in .env.local (required for --commit)')
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
    console.log(
        COMMIT
            ? 'Delete duplicate products — COMMIT mode (will delete from Sanity)\n'
            : 'Delete duplicate products — DRY RUN (no deletes)\n'
    )
    console.log('Fetching products…\n')

    const products = await client.fetch<ProductRow[]>(PRODUCT_DUPLICATE_FETCH_GROQ)
    const groups = computeDuplicateGroups(products)

    if (groups.length === 0) {
        console.log('No duplicate groups found (same title + price).')
        console.log(`Total products scanned: ${products.length}`)
        return
    }

    const idsToDelete = groups.flatMap((g) => g.deleteCandidates.map((c) => c._id))

    let groupIndex = 0
    for (const g of groups) {
        const { keep, deleteCandidates } = g
        const displayTitle = (keep.title ?? '').trim() || '(no title)'
        const displayPrice =
            keep.price === null || keep.price === undefined ? '(no price)' : `${keep.price}`

        groupIndex += 1
        console.log('═'.repeat(72))
        console.log(`Group ${groupIndex}: "${displayTitle}" | Price: ${displayPrice}`)
        console.log('─'.repeat(72))
        console.log(
            `[KEEP] ${keep._id} | ${formatWhen(keep._createdAt)} | ${displaySlug(keep.slug)}`
        )
        for (const c of deleteCandidates) {
            console.log(
                `[DELETE] ${c._id} | ${formatWhen(c._createdAt)} | ${displaySlug(c.slug)}`
            )
        }
        console.log('')
    }

    console.log('═'.repeat(72))
    console.log(`Duplicate groups: ${groups.length}`)
    console.log(`Documents to delete (newer duplicates): ${idsToDelete.length}`)

    if (!COMMIT) {
        console.log(
            '\nDRY RUN — no documents were deleted. To delete, run:\n  npm run delete:duplicates -- --commit\n  npx tsx scripts/delete-duplicates.ts --commit\n'
        )
        return
    }

    let transaction = client.transaction()
    for (const id of idsToDelete) {
        transaction = transaction.delete(id)
    }

    await transaction.commit()
    console.log(`\nSuccessfully deleted ${idsToDelete.length} duplicate products.`)
}

run().catch((e) => {
    console.error(e)
    process.exit(1)
})
