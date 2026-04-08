import { NextResponse } from 'next/server'
import { validateCartAgainstSanity } from '@/lib/cart/validate'

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export async function POST(req: Request) {
    try {
        let body: unknown
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
        }

        if (!isRecord(body) || !Array.isArray(body.items)) {
            return NextResponse.json({ ok: false, error: 'items must be an array' }, { status: 400 })
        }

        const lines = body.items
            .map((row) => {
                if (!isRecord(row)) return null
                const productId = row.productId
                const quantity = row.quantity
                if (typeof productId !== 'string') return null
                if (typeof quantity !== 'number') return null
                return {
                    productId,
                    quantity,
                    clientUnitPrice: typeof row.clientUnitPrice === 'number' ? row.clientUnitPrice : undefined,
                    clientWholesalePrice: typeof row.clientWholesalePrice === 'number' ? row.clientWholesalePrice : undefined,
                    clientWholesaleMinQuantity:
                        typeof row.clientWholesaleMinQuantity === 'number' ? row.clientWholesaleMinQuantity : undefined,
                    clientPiecesPerBox: typeof row.clientPiecesPerBox === 'number' ? row.clientPiecesPerBox : undefined,
                }
            })
            .filter(Boolean) as Array<{
            productId: string
            quantity: number
            clientUnitPrice?: number
            clientWholesalePrice?: number
            clientWholesaleMinQuantity?: number
            clientPiecesPerBox?: number
        }>

        const result = await validateCartAgainstSanity(lines)
        const status = result.ok ? 200 : 409
        return NextResponse.json(result, { status })
    } catch {
        return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
    }
}

