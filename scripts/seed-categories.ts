/**
 * Idempotent seed: creates root categories + subcategories from the catalog structure
 * used on the storefront. Requires write token in .env.local (SANITY_API_TOKEN).
 *
 * Run: npm run seed:categories
 */
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || !dataset || !token) {
    console.error(
        'Missing NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, or SANITY_API_TOKEN in .env.local'
    )
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-02-17',
    useCdn: false,
    token,
})

/** Mirrors the former hardcoded catalog sidebar on the live site */
const HIERARCHY: {
    title: string
    sortOrder: number
    children: { title: string; sortOrder: number }[]
}[] = [
    {
        title: 'Кондитерські вироби',
        sortOrder: 1,
        children: [
            { title: 'Печиво Dr. Gerard', sortOrder: 1 },
            { title: 'Желейні цукерки', sortOrder: 2 },
            { title: 'Драже', sortOrder: 3 },
            { title: 'Батончики', sortOrder: 4 },
            { title: 'Вафлі та печиво', sortOrder: 5 },
            { title: 'Шоколадні цукерки', sortOrder: 6 },
            { title: 'Шоколадні пасти (креми)', sortOrder: 7 },
        ],
    },
    {
        title: 'Гарячі напої',
        sortOrder: 2,
        children: [
            { title: 'Кава', sortOrder: 1 },
            { title: 'Капучіно', sortOrder: 2 },
            { title: 'Чай', sortOrder: 3 },
        ],
    },
    {
        title: 'Бакалія',
        sortOrder: 3,
        children: [
            { title: 'Соуси та Кетчупи', sortOrder: 1 },
            { title: 'Консерви', sortOrder: 2 },
            { title: 'Олія', sortOrder: 3 },
            { title: 'Консервація', sortOrder: 4 },
        ],
    },
    {
        title: 'Молочна продукція',
        sortOrder: 4,
        children: [{ title: 'Молоко', sortOrder: 1 }],
    },
    {
        title: 'Снеки',
        sortOrder: 5,
        children: [{ title: 'Горіхи', sortOrder: 1 }],
    },
]

const charMap: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    ґ: 'g',
    д: 'd',
    е: 'e',
    є: 'ie',
    ж: 'zh',
    з: 'z',
    и: 'y',
    і: 'i',
    ї: 'i',
    й: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ь: '',
    ю: 'iu',
    я: 'ia',
    А: 'a',
    Б: 'b',
    В: 'v',
    Г: 'g',
    Ґ: 'g',
    Д: 'd',
    Е: 'e',
    Є: 'ie',
    Ж: 'zh',
    З: 'z',
    И: 'y',
    І: 'i',
    Ї: 'i',
    Й: 'i',
    К: 'k',
    Л: 'l',
    М: 'm',
    Н: 'n',
    О: 'o',
    П: 'p',
    Р: 'r',
    С: 's',
    Т: 't',
    У: 'u',
    Ф: 'f',
    Х: 'kh',
    Ц: 'ts',
    Ч: 'ch',
    Ш: 'sh',
    Щ: 'shch',
    Ь: '',
    Ю: 'iu',
    Я: 'ia',
    ы: 'y',
    э: 'e',
    ё: 'yo',
    ъ: '',
}

function slugify(input: string): string {
    const transliterated = input
        .split('')
        .map((ch) => charMap[ch] ?? ch)
        .join('')
    return transliterated
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
        .slice(0, 96)
}

function docId(prefix: 'category' | 'subcategory', slug: string): string {
    return `${prefix}-${slug}`.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 120)
}

async function docExists(id: string): Promise<boolean> {
    const n = await client.fetch<number>(`count(*[_id == $id])`, { id })
    return n > 0
}

async function upsertCategory(doc: {
    _id: string
    title: string
    slug: string
    sortOrder: number
}): Promise<void> {
    await client.createIfNotExists({
        _id: doc._id,
        _type: 'category',
        title: doc.title,
        slug: { _type: 'slug', current: doc.slug },
        sortOrder: doc.sortOrder,
    })
}

async function upsertSubcategory(doc: {
    _id: string
    title: string
    slug: string
    sortOrder: number
    parentId: string
}): Promise<void> {
    await client.createIfNotExists({
        _id: doc._id,
        _type: 'subcategory',
        title: doc.title,
        slug: { _type: 'slug', current: doc.slug },
        sortOrder: doc.sortOrder,
        parent: { _type: 'reference', _ref: doc.parentId },
    })
}

async function main() {
    let categoriesCreated = 0
    let subcategoriesCreated = 0

    for (const group of HIERARCHY) {
        const parentSlug = slugify(group.title)
        const parentId = docId('category', parentSlug)

        const parentExisted = await docExists(parentId)
        await upsertCategory({
            _id: parentId,
            title: group.title,
            slug: parentSlug,
            sortOrder: group.sortOrder,
        })
        if (!parentExisted) categoriesCreated += 1

        for (const child of group.children) {
            const childSlugBase = slugify(child.title)
            const idKey = `${parentSlug}--${childSlugBase}`.slice(0, 80)
            const subId = docId('subcategory', idKey)
            const childSlug = `${parentSlug}--${childSlugBase}`.slice(0, 96)

            const subExisted = await docExists(subId)
            await upsertSubcategory({
                _id: subId,
                title: child.title,
                slug: childSlug,
                sortOrder: child.sortOrder,
                parentId,
            })
            if (!subExisted) subcategoriesCreated += 1
        }
    }

    console.log('Done.')
    console.log(`Categories (new): ${categoriesCreated}, Subcategories (new): ${subcategoriesCreated}`)
    console.log(
        'Note: counts are documents that did not exist before this run; existing IDs were skipped by createIfNotExists.'
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
