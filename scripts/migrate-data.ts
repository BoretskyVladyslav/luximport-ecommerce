/**
 * Links products to category/subcategory documents by resolving the legacy string field `category`.
 *
 * SAFETY:
 * - Default: DRY RUN (logs planned patches only; no mutations).
 * - With `--commit`: applies ONLY `patch(id).set({ categories: [...] })` — no other fields touched.
 * - Skips products that already have valid category/subcategory references.
 *
 * Dry run (default):
 *   npm run migrate:data
 *   npx tsx scripts/migrate-data.ts
 *
 * Apply:
 *   npm run migrate:data -- --commit
 *   npx tsx scripts/migrate-data.ts --commit
 */
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import path from 'path'

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

/** Canonical tree (same labels as storefront / seed-categories) */
const EXACT_CATEGORY_TREE: Record<string, string[]> = {
    'Кондитерські вироби': [
        'Печиво Dr. Gerard',
        'Желейні цукерки',
        'Драже',
        'Батончики',
        'Вафлі та печиво',
        'Шоколадні цукерки',
        'Шоколадні пасти (креми)',
    ],
    'Гарячі напої': ['Кава', 'Капучіно', 'Чай'],
    Бакалія: ['Соуси та Кетчупи', 'Консерви', 'Олія', 'Консервація'],
    'Молочна продукція': ['Молоко'],
    Снеки: ['Горіхи'],
}

const CATEGORY_ALIASES: Record<string, string> = {
    'кондитерські вироби': 'Кондитерські вироби',
    'гарячі нопої': 'Гарячі напої',
    'бакалійна група товарів': 'Бакалія',
    'бакалійні вироби': 'Бакалія',
    'молочна продукці': 'Молочна продукція',
    'печево dr. gerard': 'Печиво Dr. Gerard',
    'печево dr gerard': 'Печиво Dr. Gerard',
    'печево dr gerard ': 'Печиво Dr. Gerard',
    'печиво dr.gerard': 'Печиво Dr. Gerard',
}

function normalizeTitle(s: string | null | undefined): string {
    if (s === null || s === undefined) return ''
    const str = typeof s === 'string' ? s : String(s)
    return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

function standardizeTitle(rawName: string | undefined | null): string {
    if (rawName === null || rawName === undefined) return ''
    if (typeof rawName === 'string' && !rawName.trim()) return ''
    const clean = String(rawName).trim().toLowerCase()
    if (CATEGORY_ALIASES[clean]) return CATEGORY_ALIASES[clean]
    const cleanSpaced = clean.replace(/\s+/g, ' ')
    if (CATEGORY_ALIASES[cleanSpaced]) return CATEGORY_ALIASES[cleanSpaced]
    if (clean.includes('печево dr') || clean.includes('печиво dr')) return 'Печиво Dr. Gerard'
    if (clean.includes('кондитер') || clean.includes('кондитор')) return 'Кондитерські вироби'
    if (clean.includes('гарячі') || clean.includes('напої')) return 'Гарячі напої'
    if (clean.includes('бакалі')) return 'Бакалія'
    if (clean.includes('молочн')) return 'Молочна продукція'
    if (clean.includes('снек')) return 'Снеки'
    return String(rawName).trim()
}

/** Safe legacy `category` field from API (may be null, missing, or non-string). */
function legacyCategoryString(value: unknown): string {
    if (value === null || value === undefined) return ''
    const s = typeof value === 'string' ? value : String(value)
    return s.trim()
}

function safeSlice(value: unknown, max: number): string {
    if (value === null || value === undefined) return ''
    return String(value).slice(0, max)
}

function canonicalFromTree(std: string): string | null {
    const n = normalizeTitle(std)
    if (!n) return null
    for (const [parent, children] of Object.entries(EXACT_CATEGORY_TREE)) {
        if (normalizeTitle(parent) === n) return parent
        for (const ch of children) {
            if (normalizeTitle(ch) === n) return ch
        }
    }
    return null
}

type TaxDoc = {
    _id: string
    _type: 'category' | 'subcategory'
    title?: string | null
    parentId?: string
}

type CatRef = { _type: 'reference'; _ref: string; _key: string }

function refItem(id: string, prefix: string): CatRef {
    return {
        _type: 'reference',
        _ref: id,
        _key: `${prefix}-${id}`,
    }
}

function buildTaxonomyIndexes(tax: TaxDoc[]) {
    const taxIds = new Set(tax.map((t) => t._id))
    const subByNorm = new Map<string, TaxDoc[]>()
    const catByNorm = new Map<string, TaxDoc[]>()
    for (const t of tax) {
        const k = normalizeTitle(t.title ?? undefined)
        if (!k) continue
        if (t._type === 'subcategory') {
            if (!subByNorm.has(k)) subByNorm.set(k, [])
            subByNorm.get(k)!.push(t)
        } else {
            if (!catByNorm.has(k)) catByNorm.set(k, [])
            catByNorm.get(k)!.push(t)
        }
    }
    return { taxIds, subByNorm, catByNorm }
}

function pickSingle(label: string, arr: TaxDoc[] | undefined): TaxDoc | null {
    if (!arr?.length) return null
    if (arr.length === 1) return arr[0]
    const sorted = [...arr].sort((a, b) => a._id.localeCompare(b._id))
    console.warn(
        `   [warn] Ambiguous title "${label}" → ${arr.length} documents; using ${sorted[0]._id} (${sorted[0]._type})`
    )
    return sorted[0]
}

/**
 * Resolve legacy label to reference array: [parentCategory?, subcategory?]
 */
function resolveCategoryRefs(
    rawLabel: string | null | undefined,
    subByNorm: Map<string, TaxDoc[]>,
    catByNorm: Map<string, TaxDoc[]>
): CatRef[] | null {
    if (rawLabel === null || rawLabel === undefined) return null
    const trimmed = typeof rawLabel === 'string' ? rawLabel.trim() : String(rawLabel).trim()
    if (!trimmed) return null
    const std = standardizeTitle(trimmed)
    let canonical = canonicalFromTree(std)
    if (!canonical) canonical = std
    const key = normalizeTitle(canonical)
    if (!key) return null

    const sub = pickSingle(canonical, subByNorm.get(key))
    if (sub) {
        const out: CatRef[] = []
        if (sub.parentId) {
            out.push(refItem(sub.parentId, 'cat'))
        }
        out.push(refItem(sub._id, 'sub'))
        return out
    }

    const cat = pickSingle(canonical, catByNorm.get(key))
    if (cat) {
        return [refItem(cat._id, 'cat')]
    }

    return null
}

function refsAreValid(
    categories: { _ref?: string; _type?: string }[] | undefined,
    taxIds: Set<string>
): boolean {
    if (!categories?.length) return false
    return categories.every((c) => c._ref && taxIds.has(c._ref))
}

function sameRefSet(
    a: CatRef[] | undefined,
    b: CatRef[] | undefined
): boolean {
    if (!a?.length || !b?.length || a.length !== b.length) return false
    const sa = [...a.map((x) => x._ref)].sort().join('|')
    const sb = [...b.map((x) => x._ref)].sort().join('|')
    return sa === sb
}

async function run() {
    console.log(COMMIT ? 'MODE: COMMIT (writes patches)\n' : 'MODE: DRY RUN (no writes; logs only)\n')

    const tax = await client.fetch<TaxDoc[]>(
        `*[_type in ["category","subcategory"]]{ _id, _type, title, "parentId": parent._ref }`
    )
    const { taxIds, subByNorm, catByNorm } = buildTaxonomyIndexes(tax)
    if (tax.length === 0) {
        console.error('No category/subcategory documents in dataset. Run seed:categories first.')
        process.exit(1)
    }
    console.log(`Loaded ${tax.length} taxonomy documents.\n`)

    const products = await client.fetch<
        {
            _id: string
            title: string
            sku?: string
            categories?: { _ref?: string; _type?: string; _key?: string }[]
            category?: string | null
        }[]
    >(`*[_type == "product"]{ _id, title, sku, categories, category }`)

    const planned: {
        productId: string
        title: string
        sku?: string
        categoryString: string
        previousCategories: unknown
        nextCategories: CatRef[]
    }[] = []

    const skippedValid = { n: 0 }
    const skippedNoSource = { n: 0 }
    const skippedUnmapped = { n: 0 }
    const skippedNoop = { n: 0 }

    for (const p of products) {
        if (refsAreValid(p.categories, taxIds)) {
            skippedValid.n += 1
            continue
        }

        const raw = legacyCategoryString(p.category)
        if (!raw) {
            skippedNoSource.n += 1
            console.log(
                `[skip] ${p._id} | ${safeSlice(p.title, 60)} — no legacy "category" string and categories not valid/empty`
            )
            continue
        }

        const next = resolveCategoryRefs(raw, subByNorm, catByNorm)
        if (!next?.length) {
            skippedUnmapped.n += 1
            console.log(
                `[unmapped] ${p._id} | ${safeSlice(p.title, 50)} | legacy category: "${raw}"`
            )
            continue
        }

        const prevAsRefs: CatRef[] | undefined = p.categories
            ?.filter((c) => c._ref)
            .map((c) => ({
                _type: 'reference' as const,
                _ref: c._ref!,
                _key: c._key || `legacy-${c._ref}`,
            }))

        if (sameRefSet(prevAsRefs, next)) {
            skippedNoop.n += 1
            continue
        }

        planned.push({
            productId: p._id,
            title: p.title ?? '',
            sku: p.sku,
            categoryString: raw,
            previousCategories: p.categories ?? [],
            nextCategories: next,
        })
    }

    console.log('\n--- Summary (pre-patch) ---')
    console.log(`Products scanned: ${products.length}`)
    console.log(`Skip (already valid references): ${skippedValid.n}`)
    console.log(`Skip (no legacy category string): ${skippedNoSource.n}`)
    console.log(`Skip (unmapped label): ${skippedUnmapped.n}`)
    console.log(`Skip (no-op same refs): ${skippedNoop.n}`)
    console.log(`Planned patches: ${planned.length}\n`)

    for (const row of planned) {
        console.log('─'.repeat(72))
        console.log(`productId:   ${row.productId}`)
        console.log(`title:       ${row.title}`)
        if (row.sku) console.log(`sku:         ${row.sku}`)
        console.log(`legacy "category" string: ${row.categoryString}`)
        console.log(`current categories: ${JSON.stringify(row.previousCategories)}`)
        console.log(`planned .set({ categories: ${JSON.stringify(row.nextCategories)} })`)
    }

    if (planned.length === 0) {
        console.log('\nNothing to patch.')
        return
    }

    if (!COMMIT) {
        console.log(
            '\nDRY RUN complete — no changes were sent. To apply, run:\n  npm run migrate:data -- --commit\n  npx tsx scripts/migrate-data.ts --commit\n'
        )
        return
    }

    console.log('\n--- Committing patches ---\n')
    let ok = 0
    let fail = 0
    for (const row of planned) {
        try {
            await client.patch(row.productId).set({ categories: row.nextCategories }).commit()
            ok += 1
            console.log(`[ok] ${row.productId}`)
        } catch (e) {
            fail += 1
            console.error(`[fail] ${row.productId}`, e)
        }
    }
    console.log(`\nCommitted: ${ok}, failed: ${fail}`)
}

run().catch((e) => {
    console.error(e)
    process.exit(1)
})
