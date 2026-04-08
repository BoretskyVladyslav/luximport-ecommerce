import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { sanityServer } from '@/lib/sanityServer'
import { parseCartItems, parseTotalAmount } from '@/lib/order-payload'
import { validateCartAgainstSanity } from '@/lib/cart/validate'
import { fromCents, toCents } from '@/lib/money'
import { getSessionUserId } from '@/lib/auth/session'

export async function POST(req: Request) {
    try {
        if (!process.env.SANITY_API_TOKEN) {
            console.error('[SERVER_DEBUG]: missing env SANITY_API_TOKEN')
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' }, { status: 400 })
        }
        let body: unknown
        try {
            body = await req.json()
        } catch {
            return NextResponse.json({ message: 'Некоректні дані. Перевірте форму та спробуйте ще раз.' }, { status: 400 })
        }

        if (!body || typeof body !== 'object') {
            return NextResponse.json({ message: 'Некоректні дані. Перевірте форму та спробуйте ще раз.' }, { status: 400 })
        }

        const b = body as Record<string, unknown>
        const {
            orderId,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            items: rawItems,
            totalAmount: rawTotal,
        } = b

        if (!isNonEmptyString(orderId)) {
            return NextResponse.json({ message: 'Некоректні дані замовлення. Спробуйте ще раз.' }, { status: 400 })
        }
        if (!isNonEmptyString(customerName)) {
            return NextResponse.json({ message: 'Некоректні дані. Перевірте імʼя та спробуйте ще раз.' }, { status: 400 })
        }
        if (!isNonEmptyString(customerPhone)) {
            return NextResponse.json({ message: 'Некоректний номер телефону. Перевірте та спробуйте ще раз.' }, { status: 400 })
        }
        if (shippingAddress !== undefined && shippingAddress !== null && typeof shippingAddress !== 'string') {
            return NextResponse.json({ message: 'Некоректна адреса доставки. Перевірте та спробуйте ще раз.' }, { status: 400 })
        }

        const itemsResult = parseCartItems(rawItems)
        if (itemsResult.ok === false) {
            return NextResponse.json({ message: itemsResult.error }, { status: 400 })
        }

        const totalResult = parseTotalAmount(rawTotal)
        if (totalResult.ok === false) {
            return NextResponse.json({ message: totalResult.error }, { status: 400 })
        }

        const requestedById = new Map<string, number>()
        for (const i of itemsResult.items) {
            requestedById.set(i.productId, (requestedById.get(i.productId) ?? 0) + i.quantity)
        }

        const ids = Array.from(requestedById.keys())
        const stockRows = await sanityServer.fetch<Array<{ _id: string; title: string | null; stock: number | null }>>(
            `*[_type == "product" && _id in $ids && !(_id match "drafts.*")]{
                _id,
                title,
                stock
            }`,
            { ids }
        )

        const stockById = new Map(
            stockRows.map((p) => [
                p._id,
                {
                    title: typeof p.title === 'string' ? p.title : '',
                    stock: typeof p.stock === 'number' && Number.isFinite(p.stock) ? Math.max(0, Math.trunc(p.stock)) : null,
                },
            ])
        )

        for (const [productId, requestedQuantity] of Array.from(requestedById.entries())) {
            const row = stockById.get(productId)
            if (!row) continue
            if (typeof row.stock === 'number' && requestedQuantity > row.stock) {
                const safeTitle = row.title || 'Товар'
                return NextResponse.json(
                    {
                        message: `На жаль, товару '${safeTitle}' залишилося лише ${row.stock}. Будь ласка, оновіть кошик.`,
                    },
                    { status: 400 }
                )
            }
        }

        const validation = await validateCartAgainstSanity(
            itemsResult.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                clientUnitPrice: i.price,
                clientWholesalePrice: i.wholesalePrice,
                clientWholesaleMinQuantity: i.wholesaleMinQuantity,
                clientPiecesPerBox: i.piecesPerBox,
            }))
        )

        if (!validation.ok) {
            return NextResponse.json(
                {
                    message: 'Перевірка кошика не пройдена. Оновіть сторінку та спробуйте ще раз.',
                    issues: validation.issues,
                },
                { status: 409 }
            )
        }

        const clientTotalCents = toCents(totalResult.total)
        if (validation.totalCents !== clientTotalCents) {
            return NextResponse.json(
                {
                    message: 'Сума в кошику змінилася. Оновіть сторінку та спробуйте ще раз.',
                    serverTotal: fromCents(validation.totalCents),
                },
                { status: 409 }
            )
        }

        const sessionUserIdRaw = getSessionUserId()
        const sessionUserId = typeof sessionUserIdRaw === 'string' && sessionUserIdRaw.trim() ? sessionUserIdRaw.trim() : null
        if (sessionUserId) {
            console.log('DEBUG_SESSION_USER_ID:', sessionUserId)
        }
        const sanityOrder = {
            _type: 'order' as const,
            orderId: orderId.trim(),
            status: 'pending' as const,
            ...(sessionUserId
                ? {
                      user: {
                          _type: 'reference' as const,
                          _ref: sessionUserId,
                      },
                  }
                : {}),
            customerName: customerName.trim(),
            customerEmail: typeof customerEmail === 'string' ? customerEmail.trim() : '',
            customerPhone: customerPhone.trim(),
            shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : '',
            totalAmount: fromCents(validation.totalCents),
            items: validation.lines.map((line) => ({
                _key: randomUUID(),
                productId: line.productId,
                title: line.title,
                quantity: line.quantity,
                price: fromCents(line.unitPriceCents),
            })),
        }

        console.log('ORDER_PAYLOAD:', JSON.stringify(sanityOrder, null, 2))
        console.log('--- ATTEMPTING SANITY CREATE ---', JSON.stringify(sanityOrder, null, 2))

        let createdDocument: { _id: string }
        try {
            const result = await sanityServer.transaction().create(sanityOrder as any).commit()
            createdDocument = { _id: String((result as any)?._id ?? '') }
            if (!createdDocument._id) {
                return NextResponse.json({ message: 'Не вдалося створити замовлення. Спробуйте ще раз.' }, { status: 400 })
            }
        } catch (error) {
            console.error('--- SANITY CREATE FAILED ---', error)
            const mapped = mapSanityCreateErrorToMessage(error)
            return NextResponse.json({ message: mapped }, { status: 400 })
        }

        if (sessionUserId) {
            const incomingPhone = customerPhone.trim()
            const incomingAddress = typeof shippingAddress === 'string' ? shippingAddress.trim() : ''
            const incomingName = customerName.trim()
            const existing = await sanityServer.fetch<{
                _id: string
                name: string | null
                phone: string | null
                address: string | null
                firstName?: string | null
                lastName?: string | null
            } | null>('*[_type == "user" && _id == $id][0]{ _id, name, phone, address, firstName, lastName }', { id: sessionUserId })

            if (existing?._id) {
                const patch: Record<string, unknown> = {}
                if ((!existing.phone || !existing.phone.trim()) && incomingPhone) patch.phone = incomingPhone
                if ((!existing.address || !existing.address.trim()) && incomingAddress) patch.address = incomingAddress
                if ((!existing.name || !existing.name.trim()) && incomingName) patch.name = incomingName
                const hasUpdates = Object.keys(patch).length > 0
                if (hasUpdates) {
                    await sanityServer.patch(sessionUserId).set(patch).commit()
                }
            }
        }

        return NextResponse.json({ success: true, sanityDocumentId: createdDocument._id })
    } catch (error) {
        console.error('Error creating pending order:', error)
        return NextResponse.json({ message: 'Виникла помилка. Перевірте дані та спробуйте ще раз.' }, { status: 400 })
    }
}

function isNonEmptyString(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0
}

function mapSanityCreateErrorToMessage(error: unknown) {
    const defaultMessage = 'Не вдалося створити замовлення. Спробуйте ще раз.'
    if (!error || typeof error !== 'object') return defaultMessage
    const e = error as any
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : undefined
    const message = typeof e.message === 'string' ? e.message : ''

    if (statusCode === 401 || statusCode === 403 || /permission|unauthorized|forbidden/i.test(message)) {
        return 'Проблема зі зʼєднанням з базою даних. Перевірте SANITY_API_TOKEN'
    }

    const details = e.details
    if (statusCode === 400 && details) {
        const path = Array.isArray(details?.items) && details.items[0]?.path ? details.items[0].path : details?.path
        const field = Array.isArray(path) ? String(path[0] ?? '') : ''
        const labels: Record<string, string> = {
            customerPhone: 'Телефон',
            customerName: 'Імʼя',
            customerEmail: 'Email',
            shippingAddress: 'Адреса доставки',
            totalAmount: 'Сума',
            items: 'Товари',
            orderId: 'Номер замовлення',
            user: 'Користувач',
            status: 'Статус',
        }
        if (field && labels[field]) return `Помилка в полі ${labels[field]}`
        return 'Помилка в даних замовлення. Перевірте поля та спробуйте ще раз.'
    }

    if (/fetch failed|network|ECONN|ENOTFOUND|ETIMEDOUT/i.test(message)) {
        return 'Проблема зі зʼєднанням з базою даних. Перевірте SANITY_API_TOKEN'
    }

    return defaultMessage
}
