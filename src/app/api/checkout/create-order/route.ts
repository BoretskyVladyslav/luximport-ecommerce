import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { createClient } from 'next-sanity'
import { parseCartItems, parseTotalAmount } from '@/lib/order-payload'
import { validateCartAgainstSanityWithClient } from '@/lib/cart/validate'
import { fromCents, toCents } from '@/lib/money'
import { getSessionUserId } from '@/lib/auth/session'
import { sendOrderEmails } from '@/lib/send-order-emails'

export async function POST(req: Request) {
    try {
        console.log("[DEBUG_ENV] TOKEN EXISTS:", !!process.env.SANITY_API_TOKEN, "LENGTH:", process.env.SANITY_API_TOKEN?.length);
        if (!process.env.SANITY_API_TOKEN) {
            return NextResponse.json({ message: 'Сервіс тимчасово недоступний. Спробуйте пізніше.' }, { status: 400 })
        }
        const writeClient = createClient({
            projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
            dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
            apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-17',
            token: process.env.SANITY_API_TOKEN,
            useCdn: false,
        })
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
        const stockRows = await writeClient.fetch<Array<{ _id: string; title: string | null; stock: number | null }>>(
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

        const validation = await validateCartAgainstSanityWithClient(
            itemsResult.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                clientUnitPrice: i.price,
                clientWholesalePrice: i.wholesalePrice,
                clientWholesaleMinQuantity: i.wholesaleMinQuantity,
                clientPiecesPerBox: i.piecesPerBox,
            })),
            writeClient
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
        const sanityOrder = {
            _type: 'order' as const,
            orderId: orderId.trim(),
            status: 'pending' as const,
            isPaid: false,
            paymentStatus: 'pending' as const,
            inventoryDecremented: true,
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

        for (const row of sanityOrder.items) {
            if (!row || typeof row.productId !== 'string' || !row.productId.trim()) {
                throw new Error('Один із товарів має некоректний ID. Оновіть кошик.')
            }
        }

        let createdDocument: { _id: string }
        try {
            const createdOrder = await writeClient.create(sanityOrder as any)
            const createdId = typeof (createdOrder as any)?._id === 'string' ? String((createdOrder as any)._id) : ''
            if (!createdId) {
                return NextResponse.json({ success: false, message: 'Sanity Error: Empty result from create()' }, { status: 400 })
            }
            createdDocument = { _id: createdId }
        } catch (error: any) {
            const errorMessage =
                error?.details?.description ||
                error?.message ||
                (() => {
                    try {
                        return JSON.stringify(error)
                    } catch {
                        return String(error)
                    }
                })()
            console.error('[RAW_SANITY_ERROR]:', errorMessage)
            return NextResponse.json({ success: false, message: `Sanity Error: ${errorMessage}` }, { status: 400 })
        }

        try {
            await Promise.all(
                sanityOrder.items.map(async (item: any) => {
                    const productId = typeof item?.productId === 'string' ? item.productId.trim() : ''
                    const quantity = typeof item?.quantity === 'number' && Number.isFinite(item.quantity) ? Math.max(0, Math.trunc(item.quantity)) : 0
                    if (!productId || quantity <= 0) return
                    await writeClient.patch(productId).dec({ stock: quantity }).commit()
                })
            )
        } catch (error: any) {
            const errorMessage =
                error?.details?.description ||
                error?.message ||
                (() => {
                    try {
                        return JSON.stringify(error)
                    } catch {
                        return String(error)
                    }
                })()
            console.error('[RAW_SANITY_ERROR]:', errorMessage)
            return NextResponse.json({ success: false, message: `Sanity Error: ${errorMessage}` }, { status: 400 })
        }

        const dateFormatted = new Date().toLocaleDateString('uk-UA', { dateStyle: 'long' })
        const emailItems = sanityOrder.items.map((item) => ({
            id: String(item.productId),
            title: typeof item.title === 'string' ? item.title : '',
            price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0,
            quantity:
                typeof item.quantity === 'number' && Number.isFinite(item.quantity)
                    ? Math.max(0, Math.trunc(item.quantity))
                    : 0,
        }))
        const totalFormatted = `${fromCents(validation.totalCents).toLocaleString('uk-UA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} ₴`
        void (async () => {
            try {
                await sendOrderEmails({
                    orderId: sanityOrder.orderId,
                    customerName: sanityOrder.customerName,
                    customerEmail: sanityOrder.customerEmail,
                    customerPhone: sanityOrder.customerPhone,
                    shippingAddress: sanityOrder.shippingAddress,
                    items: emailItems,
                    totalFormatted,
                    dateFormatted,
                })
            } catch (err) {
                console.error('[ORDER_EMAIL]', err)
            }
        })()

        if (sessionUserId) {
            const incomingPhone = customerPhone.trim()
            const incomingAddress = typeof shippingAddress === 'string' ? shippingAddress.trim() : ''
            const incomingName = customerName.trim()
            const existing = await writeClient.fetch<{
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
                    await writeClient.patch(sessionUserId).set(patch).commit()
                }
            }
        }

        revalidatePath('/account/profile')
        return NextResponse.json({ success: true, sanityDocumentId: createdDocument._id })
    } catch (error) {
        const msg = typeof (error as any)?.message === 'string' ? (error as any).message : ''
        return NextResponse.json(
            { success: false, message: msg || 'Виникла помилка. Перевірте дані та спробуйте ще раз.' },
            { status: 400 }
        )
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
            paymentStatus: 'Статус оплати',
            trackingNumber: 'ТТН',
            adminNotes: 'Нотатки адміністратора',
        }
        if (field && labels[field]) return `Помилка в полі ${labels[field]}`
        return 'Помилка в даних замовлення. Перевірте поля та спробуйте ще раз.'
    }

    if (/fetch failed|network|ECONN|ENOTFOUND|ETIMEDOUT/i.test(message)) {
        return 'Проблема зі зʼєднанням з базою даних. Перевірте SANITY_API_TOKEN'
    }

    return defaultMessage
}
