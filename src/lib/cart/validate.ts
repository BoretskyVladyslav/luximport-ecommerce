import { sanityServer } from '@/lib/sanityServer'
import { toCents } from '@/lib/money'
import { unitPriceForQuantity } from '@/lib/cart/pricing'

export type ClientCartLine = {
    productId: string
    quantity: number
    clientUnitPrice?: number
    clientWholesalePrice?: number
    clientWholesaleMinQuantity?: number
    clientPiecesPerBox?: number
}

export type CartValidationIssue =
    | { code: 'NOT_FOUND'; productId: string }
    | { code: 'OUT_OF_STOCK'; productId: string }
    | { code: 'INSUFFICIENT_STOCK'; productId: string; available: number }
    | { code: 'PRICE_CHANGED'; productId: string }

export type ValidatedCartLine = {
    productId: string
    title: string
    quantity: number
    stock: number | null
    unitPrice: number
    unitPriceCents: number
    lineTotalCents: number
    price: number
    wholesalePrice: number | null
    wholesaleMinQuantity: number | null
    piecesPerBox: number | null
}

type SanityProductPricing = {
    _id: string
    title: string | null
    price: number | null
    wholesalePrice: number | null
    wholesaleMinQuantity: number | null
    piecesPerBox: number | null
    stock: number | null
}

function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0
}

function isPositiveInt(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v > 0
}

export async function validateCartAgainstSanity(lines: ClientCartLine[]) {
    return validateCartAgainstSanityWithClient(lines)
}

export async function validateCartAgainstSanityWithClient(
    lines: ClientCartLine[],
    client: { fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T> } = sanityServer
) {
    const normalized: ClientCartLine[] = []
    for (const line of lines) {
        if (!line || typeof line !== 'object') continue
        if (!isNonEmptyString(line.productId)) continue
        if (!isPositiveInt(line.quantity)) continue
        normalized.push({ ...line, productId: line.productId.trim() })
    }

    const ids = Array.from(new Set(normalized.map((l) => l.productId)))
    if (ids.length === 0) {
        return {
            ok: false as const,
            issues: [{ code: 'NOT_FOUND' as const, productId: '' }],
            lines: [] as ValidatedCartLine[],
            totalCents: 0,
        }
    }

    const products = await client.fetch<SanityProductPricing[]>(
        `*[_type == "product" && _id in $ids && !(_id match "drafts.*")]{
            _id,
            title,
            price,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
            stock
        }`,
        { ids }
    )

    const byId = new Map(products.map((p) => [p._id, p]))
    const issues: CartValidationIssue[] = []
    const validatedLines: ValidatedCartLine[] = []

    for (const line of normalized) {
        const p = byId.get(line.productId)
        if (!p) {
            issues.push({ code: 'NOT_FOUND', productId: line.productId })
            continue
        }

        const rawStock = typeof p.stock === 'number' && Number.isFinite(p.stock) ? p.stock : null
        const availableStock = typeof p.stock === 'number' ? p.stock : Infinity
        const stock = rawStock !== null && Number.isInteger(rawStock) ? rawStock : null
        if (availableStock === 0) {
            issues.push({ code: 'OUT_OF_STOCK', productId: line.productId })
            continue
        }
        if (line.quantity > availableStock) {
            issues.push({
                code: 'INSUFFICIENT_STOCK',
                productId: line.productId,
                available: Number.isFinite(availableStock) ? Math.max(0, Math.trunc(availableStock)) : 0,
            })
            continue
        }

        const basePrice = typeof p.price === 'number' && Number.isFinite(p.price) ? p.price : 0
        const wholesalePrice = typeof p.wholesalePrice === 'number' && Number.isFinite(p.wholesalePrice) ? p.wholesalePrice : null
        const wholesaleMinQuantity =
            typeof p.wholesaleMinQuantity === 'number' && Number.isInteger(p.wholesaleMinQuantity) ? p.wholesaleMinQuantity : null
        const piecesPerBox = typeof p.piecesPerBox === 'number' && Number.isInteger(p.piecesPerBox) ? p.piecesPerBox : null

        const unitPrice = unitPriceForQuantity({
            price: basePrice,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
            quantity: line.quantity,
        })

        const unitPriceCents = toCents(unitPrice)
        const lineTotalCents = unitPriceCents * line.quantity

        const clientMismatch =
            (typeof line.clientUnitPrice === 'number' && toCents(line.clientUnitPrice) !== unitPriceCents) ||
            (typeof line.clientWholesalePrice === 'number' && toCents(line.clientWholesalePrice) !== toCents(wholesalePrice ?? 0)) ||
            (typeof line.clientWholesaleMinQuantity === 'number' &&
                Math.trunc(line.clientWholesaleMinQuantity) !== Math.trunc(wholesaleMinQuantity ?? 0)) ||
            (typeof line.clientPiecesPerBox === 'number' && Math.trunc(line.clientPiecesPerBox) !== Math.trunc(piecesPerBox ?? 0))

        if (clientMismatch) {
            issues.push({ code: 'PRICE_CHANGED', productId: line.productId })
        }

        validatedLines.push({
            productId: line.productId,
            title: typeof p.title === 'string' ? p.title : '',
            quantity: line.quantity,
            stock,
            unitPrice,
            unitPriceCents,
            lineTotalCents,
            price: basePrice,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
        })
    }

    const totalCents = validatedLines.reduce((acc, l) => acc + l.lineTotalCents, 0)
    const blocking = issues.some((i) => i.code !== 'PRICE_CHANGED')

    return {
        ok: !blocking,
        issues,
        lines: validatedLines,
        totalCents,
    }
}

