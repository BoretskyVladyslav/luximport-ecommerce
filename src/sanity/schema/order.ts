import { defineType, defineField } from 'sanity'

export const order = defineType({
    name: 'order',
    title: 'Замовлення',
    type: 'document',
    fieldsets: [
        {
            name: 'customer',
            title: 'Дані клієнта',
            options: { collapsible: true, collapsed: false }
        }
    ],
    fields: [
        defineField({
            name: 'user',
            title: 'Користувач',
            type: 'reference',
            to: [{ type: 'user' }],
        }),
        defineField({
            name: 'orderId',
            type: 'string',
            title: 'Номер замовлення',
            readOnly: true,
        }),
        defineField({
            name: 'status',
            title: 'Статус замовлення',
            type: 'string',
            options: {
                list: [
                    { title: 'Нове замовлення', value: 'pending' },
                    { title: 'Оплачено', value: 'paid' },
                    { title: 'В обробці', value: 'processing' },
                    { title: 'Відправлено', value: 'shipped' },
                    { title: 'Виконано', value: 'completed' },
                    { title: 'Скасовано', value: 'cancelled' },
                ],
            },
            initialValue: 'pending',
        }),
        defineField({
            name: 'isPaid',
            title: 'Оплачено',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'paymentStatus',
            title: 'Статус оплати',
            type: 'string',
            options: {
                list: [
                    { title: 'Очікує оплати', value: 'pending' },
                    { title: 'Оплачено', value: 'paid' },
                    { title: 'Скасовано', value: 'cancelled' },
                    { title: 'Неуспішно', value: 'failed' },
                ],
            },
            initialValue: 'pending',
        }),
        defineField({
            name: 'trackingNumber',
            type: 'string',
            title: 'ТТН (Номер відстеження)',
        }),
        defineField({
            name: 'adminNotes',
            type: 'text',
            title: 'Нотатки адміністратора (невидимі для клієнта)',
        }),
        defineField({
            name: 'inventoryDecremented',
            title: 'Склад списано',
            type: 'boolean',
            initialValue: false,
            readOnly: true,
        }),
        defineField({
            name: 'customerName',
            type: 'string',
            title: 'Ім\'я клієнта',
            fieldset: 'customer',
        }),
        defineField({
            name: 'customerEmail',
            type: 'string',
            title: 'Email клієнта',
            fieldset: 'customer',
        }),
        defineField({
            name: 'customerPhone',
            type: 'string',
            title: 'Телефон',
            fieldset: 'customer',
        }),
        defineField({
            name: 'shippingAddress',
            type: 'string',
            title: 'Адреса доставки',
            fieldset: 'customer',
        }),
        defineField({
            name: 'totalAmount',
            type: 'number',
            title: 'Загальна сума',
        }),
        defineField({
            name: 'items',
            title: 'Товари',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'productId', type: 'string', title: 'Product ID' },
                        { name: 'title', type: 'string', title: 'Назва' },
                        { name: 'quantity', type: 'number', title: 'Кількість' },
                        { name: 'price', type: 'number', title: 'Ціна за одиницю' },
                    ],
                },
            ],
        }),
    ],
    preview: {
        select: {
            title: 'orderId',
            subtitle: 'customerName',
            status: 'status',
        },
        prepare(selection) {
            const { title, subtitle, status } = selection
            const statusLabels: Record<string, string> = {
                pending: 'Нове',
                paid: 'Оплачено',
                processing: 'В обробці',
                shipped: 'Відправлено',
                completed: 'Виконано',
                cancelled: 'Скасовано',
            }
            const label = typeof status === 'string' ? statusLabels[status] ?? status : ''
            return {
                title: `Замовлення ${title}${label ? ` (${label})` : ''}`,
                subtitle: subtitle,
            }
        },
    },
})
