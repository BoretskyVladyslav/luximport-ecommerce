export type ValidatedOrderLine = {
    productId: string
    title: string
    quantity: number
    price: number
    wholesalePrice?: number
    wholesaleMinQuantity?: number
    piecesPerBox?: number
}

function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0
}

export function parseCartItems(raw: unknown): { ok: true; items: ValidatedOrderLine[] } | { ok: false; error: string } {
    if (!Array.isArray(raw)) {
        return { ok: false, error: 'items must be an array' }
    }
    if (raw.length === 0) {
        return { ok: false, error: 'items must not be empty' }
    }

    const items: ValidatedOrderLine[] = []

    for (let i = 0; i < raw.length; i++) {
        const row = raw[i]
        if (!row || typeof row !== 'object') {
            return { ok: false, error: `items[${i}] must be an object` }
        }
        const o = row as Record<string, unknown>

        if (!isNonEmptyString(o.id)) {
            return { ok: false, error: `items[${i}].id must be a non-empty string` }
        }
        if (!isNonEmptyString(o.title)) {
            return { ok: false, error: `items[${i}].title must be a non-empty string` }
        }
        const quantity = o.quantity
        const price = o.price

        if (typeof quantity !== 'number' || !Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
            return { ok: false, error: `items[${i}].quantity must be a positive integer` }
        }
        if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
            return { ok: false, error: `items[${i}].price must be a finite number >= 0` }
        }

        let wholesalePrice: number | undefined
        if (o.wholesalePrice !== undefined && o.wholesalePrice !== null) {
            if (typeof o.wholesalePrice !== 'number' || !Number.isFinite(o.wholesalePrice) || o.wholesalePrice < 0) {
                return { ok: false, error: `items[${i}].wholesalePrice must be a finite number >= 0` }
            }
            wholesalePrice = o.wholesalePrice
        }

        let wholesaleMinQuantity: number | undefined
        if (o.wholesaleMinQuantity !== undefined && o.wholesaleMinQuantity !== null) {
            if (
                typeof o.wholesaleMinQuantity !== 'number' ||
                !Number.isFinite(o.wholesaleMinQuantity) ||
                !Number.isInteger(o.wholesaleMinQuantity) ||
                o.wholesaleMinQuantity < 1
            ) {
                return { ok: false, error: `items[${i}].wholesaleMinQuantity must be a positive integer` }
            }
            wholesaleMinQuantity = o.wholesaleMinQuantity
        }

        let piecesPerBox: number | undefined
        if (o.piecesPerBox !== undefined && o.piecesPerBox !== null) {
            if (
                typeof o.piecesPerBox !== 'number' ||
                !Number.isFinite(o.piecesPerBox) ||
                !Number.isInteger(o.piecesPerBox) ||
                o.piecesPerBox < 1
            ) {
                return { ok: false, error: `items[${i}].piecesPerBox must be a positive integer` }
            }
            piecesPerBox = o.piecesPerBox
        }

        items.push({
            productId: o.id.trim(),
            title: o.title.trim(),
            quantity,
            price,
            wholesalePrice,
            wholesaleMinQuantity,
            piecesPerBox,
        })
    }

    return { ok: true, items }
}

export function parseTotalAmount(raw: unknown): { ok: true; total: number } | { ok: false; error: string } {
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) {
        return { ok: false, error: 'totalAmount must be a finite number >= 0' }
    }
    return { ok: true, total: raw }
}
