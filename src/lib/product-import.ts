/**
 * Bulk product import (CSV / XLSX / XLS) → Sanity `product` documents.
 *
 * Existing CLI (offline catalog.xlsx, not this HTTP path):
 *   npm run import-data        → scripts/importProducts.mjs
 *   npm run update-catalog     → scripts/update-from-excel.mjs
 *
 * Schema-safe mapping (this module):
 *   title, sku, barcode, price, wholesalePrice, stock, brand, origin,
 *   weight, piecesPerBox, description (plain text → portable text),
 *   categories (lookup existing category/subcategory by title),
 *   images (http(s) URL uploaded to Sanity `images[]` — not the old `image` field).
 *
 * Unhandled / left to Studio or CLI:
 *   embedded workbook images (scripts/import-excel.mjs; that script writes `image` which is NOT in schema),
 *   auto-creating categories, windows-1251 CSV, msrp, wholesaleMinQuantity,
 *   weightKg, packaging, dimensions, sortOrder.
 *
 * Updates patch an allowlist only — never unset price/sku/title, never touch
 * `images` unless the file supplies an image URL.
 */
import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import * as XLSX from 'xlsx'
import type { SanityClient } from '@sanity/client'
import { slugifyTitleForSlug } from '@/sanity/schema/slugify-title'

const MAX_HEADER_SCAN = 30
const IMAGE_FETCH_MS = 15_000
const IMAGE_MAX_BYTES = 5 * 1024 * 1024

type FieldKey =
    | 'title'
    | 'sku'
    | 'barcode'
    | 'price'
    | 'wholesalePrice'
    | 'stock'
    | 'description'
    | 'category'
    | 'subcategory'
    | 'imageUrl'
    | 'brand'
    | 'origin'
    | 'weight'
    | 'piecesPerBox'

type HeaderAlias = { field: FieldKey; offset: number }

const HEADER_ALIASES: Record<string, HeaderAlias> = {
    артикул: { field: 'sku', offset: 0 },
    sku: { field: 'sku', offset: 0 },
    article: { field: 'sku', offset: 0 },
    'article number': { field: 'sku', offset: 0 },
    'повне найменування': { field: 'title', offset: 0 },
    'назва товару': { field: 'title', offset: 0 },
    назва: { field: 'title', offset: 0 },
    title: { field: 'title', offset: 0 },
    name: { field: 'title', offset: 0 },
    'product name': { field: 'title', offset: 0 },
    сайт: { field: 'price', offset: 1 },
    ціна: { field: 'price', offset: 0 },
    price: { field: 'price', offset: 0 },
    'retail price': { field: 'price', offset: 0 },
    оптова: { field: 'wholesalePrice', offset: 1 },
    wholesale: { field: 'wholesalePrice', offset: 0 },
    wholesaleprice: { field: 'wholesalePrice', offset: 0 },
    штрихкод: { field: 'barcode', offset: 0 },
    barcode: { field: 'barcode', offset: 0 },
    залишок: { field: 'stock', offset: 0 },
    'залишок на складі': { field: 'stock', offset: 0 },
    stock: { field: 'stock', offset: 0 },
    quantity: { field: 'stock', offset: 0 },
    qty: { field: 'stock', offset: 0 },
    опис: { field: 'description', offset: 0 },
    description: { field: 'description', offset: 0 },
    'головна група': { field: 'category', offset: 0 },
    категорія: { field: 'category', offset: 0 },
    category: { field: 'category', offset: 0 },
    'під група': { field: 'subcategory', offset: 0 },
    підкатегорія: { field: 'subcategory', offset: 0 },
    subcategory: { field: 'subcategory', offset: 0 },
    фото: { field: 'imageUrl', offset: 0 },
    зображення: { field: 'imageUrl', offset: 0 },
    image: { field: 'imageUrl', offset: 0 },
    images: { field: 'imageUrl', offset: 0 },
    imageurl: { field: 'imageUrl', offset: 0 },
    'image url': { field: 'imageUrl', offset: 0 },
    бренд: { field: 'brand', offset: 0 },
    brand: { field: 'brand', offset: 0 },
    країна: { field: 'origin', offset: 0 },
    origin: { field: 'origin', offset: 0 },
    грамаж: { field: 'weight', offset: 0 },
    weight: { field: 'weight', offset: 0 },
    'шт в ящиу': { field: 'piecesPerBox', offset: 0 },
    'шт в ящику': { field: 'piecesPerBox', offset: 0 },
    piecesperbox: { field: 'piecesPerBox', offset: 0 },
}

export const IMPORT_COLUMN_SPEC = [
    { field: 'title', headers: ['Повне найменування', 'Назва', 'title'] },
    { field: 'sku', headers: ['Артикул', 'SKU'] },
    { field: 'price', headers: ['Сайт (+1 merged)', 'Ціна', 'price'] },
    { field: 'stock', headers: ['Залишок', 'stock'] },
    { field: 'description', headers: ['Опис', 'description'] },
    { field: 'category', headers: ['головна ГРУПА', 'Категорія', 'category'] },
    { field: 'subcategory', headers: ['ПІД ГРУПА', 'subcategory'] },
    { field: 'imageUrl', headers: ['Фото', 'image'] },
    { field: 'barcode', headers: ['Штрихкод', 'barcode'] },
    { field: 'wholesalePrice', headers: ['оптова (+1 merged)', 'wholesalePrice'] },
    { field: 'brand', headers: ['Бренд', 'brand'] },
    { field: 'origin', headers: ['Країна', 'origin'] },
    { field: 'weight', headers: ['грамаж', 'weight'] },
    { field: 'piecesPerBox', headers: ['шт в ящику', 'piecesPerBox'] },
] as const

export type ParsedProductRow = {
    rowNumber: number
    title?: string
    sku?: string
    barcode?: string
    price?: number
    wholesalePrice?: number
    stock?: number
    description?: string
    category?: string
    subcategory?: string
    imageUrl?: string
    brand?: string
    origin?: string
    weight?: string
    piecesPerBox?: number
    errors: string[]
}

export type ParseWorkbookResult = {
    headerRowIndex: number
    columns: Partial<Record<FieldKey, number>>
    rows: ParsedProductRow[]
    skippedEmpty: number
}

export type ImportRowResult = {
    rowNumber: number
    sku?: string
    action: 'created' | 'updated' | 'skipped' | 'error'
    id?: string
    message?: string
}

export type ImportSummary = {
    created: number
    updated: number
    skipped: number
    errors: number
    results: ImportRowResult[]
}

function normalizeHeader(value: unknown): string {
    return cellToString(value).toLowerCase().replace(/\s+/g, ' ').trim()
}

function cellToString(value: unknown): string {
    if (value == null || value === '') return ''
    if (typeof value === 'number') {
        if (Number.isInteger(value)) return String(value)
        return String(value)
    }
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') {
        const rec = value as Record<string, unknown>
        if (typeof rec.text === 'string') return rec.text.trim()
        if (typeof rec.w === 'string') return rec.w.trim()
        if (rec.hyperlink != null) return cellToString(rec.hyperlink)
        if (typeof rec.result === 'string' || typeof rec.result === 'number') {
            return cellToString(rec.result)
        }
    }
    return String(value).trim()
}

export function toNumber(value: unknown): number | undefined {
    if (value == null || value === '') return undefined
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
    const cleaned = cellToString(value).replace(/[^\d.,-]/g, '').replace(',', '.')
    if (!cleaned) return undefined
    const n = Number.parseFloat(cleaned)
    return Number.isFinite(n) ? n : undefined
}

function detectHeaders(rows: unknown[][]): { headerRowIndex: number; columns: Partial<Record<FieldKey, number>> } | null {
    for (let i = 0; i < Math.min(rows.length, MAX_HEADER_SCAN); i++) {
        const row = rows[i]
        if (!row) continue
        const columns: Partial<Record<FieldKey, number>> = {}
        for (let c = 0; c < row.length; c++) {
            const alias = HEADER_ALIASES[normalizeHeader(row[c])]
            if (!alias) continue
            if (columns[alias.field] !== undefined) continue
            const idx = c + alias.offset
            if (idx >= 0) columns[alias.field] = idx
        }
        if (columns.title !== undefined || columns.sku !== undefined) {
            return { headerRowIndex: i, columns }
        }
    }
    return null
}

function readCell(row: unknown[], index: number | undefined): unknown {
    if (index === undefined || index < 0 || index >= row.length) return undefined
    return row[index]
}

export function parseProductWorkbook(buffer: Buffer, filename: string): ParseWorkbookResult {
    const lower = filename.toLowerCase()
    if (!/\.(csv|xlsx|xls)$/.test(lower)) {
        throw new Error('Unsupported file type. Use .csv, .xlsx, or .xls')
    }

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('Workbook has no sheets')
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: '',
        raw: false,
        blankrows: false,
    })

    if (!Array.isArray(rows) || rows.length < 2) {
        throw new Error('File is empty or missing a header row')
    }

    const detected = detectHeaders(rows)
    if (!detected) {
        throw new Error('Could not detect header row (need Артикул/SKU or Назва/title)')
    }

    const { headerRowIndex, columns } = detected
    const parsed: ParsedProductRow[] = []
    let skippedEmpty = 0

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i]
        if (!Array.isArray(row)) continue
        const rowNumber = i + 1
        const title = cellToString(readCell(row, columns.title)) || undefined
        const sku = cellToString(readCell(row, columns.sku)) || undefined
        if (!title && !sku) {
            skippedEmpty += 1
            continue
        }

        const errors: string[] = []
        const price = columns.price !== undefined ? toNumber(readCell(row, columns.price)) : undefined
        const wholesalePrice =
            columns.wholesalePrice !== undefined ? toNumber(readCell(row, columns.wholesalePrice)) : undefined
        const stockRaw = columns.stock !== undefined ? toNumber(readCell(row, columns.stock)) : undefined
        const piecesPerBox =
            columns.piecesPerBox !== undefined ? toNumber(readCell(row, columns.piecesPerBox)) : undefined

        if (!title) errors.push('missing title')
        if (!sku) errors.push('missing sku')
        if (price !== undefined && price <= 0) errors.push('price must be > 0')
        if (stockRaw !== undefined && stockRaw < 0) errors.push('stock cannot be negative')
        if (piecesPerBox !== undefined && (!Number.isInteger(piecesPerBox) || piecesPerBox < 1)) {
            errors.push('piecesPerBox must be an integer ≥ 1')
        }

        const stock =
            stockRaw === undefined ? undefined : Number.isInteger(stockRaw) ? stockRaw : Math.trunc(stockRaw)

        parsed.push({
            rowNumber,
            title,
            sku,
            barcode: cellToString(readCell(row, columns.barcode)) || undefined,
            price: price !== undefined && price > 0 ? price : undefined,
            wholesalePrice: wholesalePrice !== undefined && wholesalePrice >= 0 ? wholesalePrice : undefined,
            stock: stock !== undefined && stock >= 0 ? stock : undefined,
            description: cellToString(readCell(row, columns.description)) || undefined,
            category: cellToString(readCell(row, columns.category)) || undefined,
            subcategory: cellToString(readCell(row, columns.subcategory)) || undefined,
            imageUrl: cellToString(readCell(row, columns.imageUrl)) || undefined,
            brand: cellToString(readCell(row, columns.brand)) || undefined,
            origin: cellToString(readCell(row, columns.origin)) || undefined,
            weight: cellToString(readCell(row, columns.weight)) || undefined,
            piecesPerBox:
                piecesPerBox !== undefined && Number.isInteger(piecesPerBox) && piecesPerBox >= 1
                    ? piecesPerBox
                    : undefined,
            errors,
        })
    }

    return { headerRowIndex, columns, rows: parsed, skippedEmpty }
}

function blockKey(): string {
    return randomBytes(6).toString('hex')
}

export function textToPortableText(text: string) {
    return [
        {
            _type: 'block',
            _key: blockKey(),
            style: 'normal',
            markDefs: [],
            children: [{ _type: 'span', _key: blockKey(), text, marks: [] }],
        },
    ]
}

function isBlockedImageHost(hostname: string): boolean {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
    if (host === 'localhost' || host === '::1' || host.endsWith('.local')) return true
    if (host === 'metadata.google.internal') return true
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
    if (!ipv4) return false
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    return false
}

async function uploadImageFromUrl(client: SanityClient, rawUrl: string): Promise<string | null> {
    let url: URL
    try {
        url = new URL(rawUrl)
    } catch {
        return null
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (isBlockedImageHost(url.hostname)) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_MS)
    try {
        const res = await fetch(url, { signal: controller.signal, redirect: 'follow' })
        if (!res.ok) return null
        const contentType = res.headers.get('content-type') ?? ''
        if (contentType && !contentType.startsWith('image/')) return null
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.byteLength === 0 || buf.byteLength > IMAGE_MAX_BYTES) return null
        const ext = contentType.includes('png')
            ? 'png'
            : contentType.includes('webp')
              ? 'webp'
              : contentType.includes('gif')
                ? 'gif'
                : 'jpg'
        const base = url.pathname.split('/').filter(Boolean).pop() || `product.${ext}`
        const filename = /\.(jpe?g|png|webp|gif)$/i.test(base) ? base : `${base}.${ext}`
        const asset = await client.assets.upload('image', buf, { filename })
        return asset._id
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }
}

function uniqueSlug(base: string, sku: string, used: Set<string>): string {
    let slug = base || slugifyTitleForSlug(sku) || `imported-${sku}`
    if (!used.has(slug)) {
        used.add(slug)
        return slug
    }
    const suffix = slugifyTitleForSlug(sku) || createHash('sha1').update(sku).digest('hex').slice(0, 8)
    slug = `${slug.slice(0, 180)}-${suffix}`
    let n = 2
    while (used.has(slug)) {
        slug = `${slug.slice(0, 180)}-${n}`
        n += 1
    }
    used.add(slug)
    return slug
}

function catalogKey(title: string): string {
    return title.toLowerCase().replace(/\s+/g, ' ').trim()
}

async function resolveCategoryRef(
    categoryTitle: string | undefined,
    subcategoryTitle: string | undefined,
    catalog: Array<{ _id: string; _type: string; title?: string | null }>
): Promise<string | undefined> {
    const byTitle = new Map<string, { _id: string; _type: string }[]>()
    for (const doc of catalog) {
        if (!doc.title) continue
        const k = catalogKey(doc.title)
        const list = byTitle.get(k) ?? []
        list.push(doc)
        byTitle.set(k, list)
    }
    const pick = (title: string | undefined, preferType?: string) => {
        if (!title) return undefined
        const matches = byTitle.get(catalogKey(title))
        if (!matches?.length) return undefined
        if (preferType) {
            const typed = matches.find((m) => m._type === preferType)
            if (typed) return typed._id
        }
        return matches[0]._id
    }
    return pick(subcategoryTitle, 'subcategory') ?? pick(categoryTitle, 'category')
}

export async function applyProductImport(
    client: SanityClient,
    parsed: ParsedProductRow[],
    options: { dryRun?: boolean } = {}
): Promise<ImportSummary> {
    const results: ImportRowResult[] = []
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    const existing = await client.fetch<
        Array<{ _id: string; sku?: string | null; barcode?: string | null; slug?: { current?: string } | null }>
    >(`*[_type == "product"]{ _id, sku, barcode, slug }`)

    const skuMap = new Map<string, string>()
    const barcodeMap = new Map<string, string>()
    const usedSlugs = new Set<string>()
    for (const p of existing) {
        if (p.sku) skuMap.set(p.sku.trim(), p._id)
        if (p.barcode) barcodeMap.set(p.barcode.trim(), p._id)
        if (p.slug?.current) usedSlugs.add(p.slug.current)
    }

    const catalog = await client.fetch<Array<{ _id: string; _type: string; title?: string | null }>>(
        `*[_type in ["category", "subcategory"]]{ _id, _type, title }`
    )

    for (const row of parsed) {
        if (!row.title || !row.sku) {
            skipped += 1
            results.push({
                rowNumber: row.rowNumber,
                sku: row.sku,
                action: 'skipped',
                message: row.errors.length ? row.errors.join('; ') : 'missing title or sku',
            })
            continue
        }

        const sku = row.sku!.trim()
        const title = row.title!.trim()
        const existingId = skuMap.get(sku) ?? (row.barcode ? barcodeMap.get(row.barcode.trim()) : undefined)
        const categoryId = await resolveCategoryRef(row.category, row.subcategory, catalog)

        if (!existingId && row.price === undefined) {
            skipped += 1
            results.push({
                rowNumber: row.rowNumber,
                sku,
                action: 'skipped',
                message: 'new product requires price > 0',
            })
            continue
        }

        let imageNote: string | undefined
        let imageAssetId: string | null = null
        if (row.imageUrl && !options.dryRun) {
            imageAssetId = await uploadImageFromUrl(client, row.imageUrl)
            if (!imageAssetId) imageNote = 'image URL skipped (fetch failed or blocked)'
        }

        const setFields: Record<string, unknown> = {
            title,
            sku,
        }
        if (!existingId) {
            setFields.slug = { _type: 'slug', current: uniqueSlug(slugifyTitleForSlug(title), sku, usedSlugs) }
        }
        if (row.barcode) setFields.barcode = row.barcode
        if (row.price !== undefined) setFields.price = row.price
        if (row.wholesalePrice !== undefined) setFields.wholesalePrice = row.wholesalePrice
        if (row.stock !== undefined) setFields.stock = row.stock
        if (row.brand) setFields.brand = row.brand
        if (row.origin) setFields.origin = row.origin
        if (row.weight) setFields.weight = row.weight
        if (row.piecesPerBox !== undefined) setFields.piecesPerBox = row.piecesPerBox
        if (row.description) setFields.description = textToPortableText(row.description)
        if (categoryId) {
            setFields.categories = [{ _type: 'reference', _ref: categoryId, _key: `cat-${categoryId}`.slice(0, 64) }]
        }
        if (imageAssetId) {
            setFields.images = [
                {
                    _type: 'image',
                    _key: blockKey(),
                    asset: { _type: 'reference', _ref: imageAssetId },
                },
            ]
        }

        try {
            if (existingId) {
                if (!options.dryRun) {
                    await client.patch(existingId).set(setFields).commit()
                }
                updated += 1
                results.push({ rowNumber: row.rowNumber, sku, action: 'updated', id: existingId, message: imageNote })
            } else {
                const doc = {
                    _type: 'product',
                    ...setFields,
                    stock: row.stock ?? 1,
                }
                if (options.dryRun) {
                    created += 1
                    results.push({ rowNumber: row.rowNumber, sku, action: 'created', message: imageNote })
                } else {
                    const createdDoc = await client.create(doc)
                    skuMap.set(sku, createdDoc._id)
                    if (row.barcode) barcodeMap.set(row.barcode.trim(), createdDoc._id)
                    created += 1
                    results.push({
                        rowNumber: row.rowNumber,
                        sku,
                        action: 'created',
                        id: createdDoc._id,
                        message: imageNote,
                    })
                }
            }
        } catch (err) {
            errors += 1
            results.push({
                rowNumber: row.rowNumber,
                sku,
                action: 'error',
                message: err instanceof Error ? err.message : 'write failed',
            })
        }
    }

    return { created, updated, skipped, errors, results }
}

export function importTokenEquals(provided: string, expected: string): boolean {
    const a = createHash('sha256').update(provided).digest()
    const b = createHash('sha256').update(expected).digest()
    return a.length === b.length && timingSafeEqual(a, b)
}
