import { defineType, defineField } from 'sanity'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Очікує',
  paid: 'Оплачено',
  processing: 'В обробці',
  shipped: 'Відправлено',
  completed: 'Виконано',
  cancelled: 'Скасовано',
}

export const order = defineType({
  name: 'order',
  title: 'Замовлення',
  type: 'document',
  fieldsets: [
    {
      name: 'customer',
      title: 'Дані клієнта',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'fulfillment',
      title: 'Виконання та доставка',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'orderContent',
      title: 'Товари та сума',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'admin',
      title: 'Службові поля',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: 'orderId',
      type: 'string',
      title: 'Номер замовлення',
      readOnly: true,
    }),
    defineField({
      name: 'user',
      title: 'Користувач',
      type: 'reference',
      to: [{ type: 'user' }],
      fieldset: 'customer',
    }),
    defineField({
      name: 'status',
      title: 'Статус замовлення',
      type: 'string',
      options: {
        list: [
          { title: 'Очікує', value: 'pending' },
          { title: 'В обробці', value: 'processing' },
          { title: 'Відправлено', value: 'shipped' },
          { title: 'Скасовано', value: 'cancelled' },
        ],
      },
      initialValue: 'pending',
      fieldset: 'fulfillment',
    }),
    defineField({
      name: 'isPaid',
      title: 'Оплачено',
      type: 'boolean',
      initialValue: false,
      readOnly: true,
      fieldset: 'fulfillment',
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
      fieldset: 'fulfillment',
    }),
    defineField({
      name: 'trackingNumber',
      type: 'string',
      title: 'Номер ТТН (Нова Пошта)',
      fieldset: 'fulfillment',
    }),
    defineField({
      name: 'adminNotes',
      type: 'text',
      title: 'Нотатки адміністратора (невидимі для клієнта)',
      fieldset: 'admin',
    }),
    defineField({
      name: 'inventoryDecremented',
      title: 'Склад списано',
      type: 'boolean',
      initialValue: false,
      readOnly: true,
      fieldset: 'fulfillment',
    }),
    defineField({
      name: 'customerName',
      type: 'string',
      title: 'Ім\'я клієнта',
      readOnly: true,
      fieldset: 'customer',
    }),
    defineField({
      name: 'customerEmail',
      type: 'string',
      title: 'Email клієнта',
      readOnly: true,
      fieldset: 'customer',
    }),
    defineField({
      name: 'customerPhone',
      type: 'string',
      title: 'Телефон',
      readOnly: true,
      fieldset: 'customer',
    }),
    defineField({
      name: 'shippingAddress',
      type: 'string',
      title: 'Адреса доставки',
      readOnly: true,
      fieldset: 'customer',
    }),
    defineField({
      name: 'totalAmount',
      type: 'number',
      title: 'Загальна сума',
      readOnly: true,
      fieldset: 'orderContent',
    }),
    defineField({
      name: 'items',
      title: 'Товари',
      type: 'array',
      readOnly: true,
      fieldset: 'orderContent',
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
      orderId: 'orderId',
      docId: '_id',
      amount: 'totalAmount',
      status: 'status',
      isPaid: 'isPaid',
      date: '_createdAt',
    },
    prepare(selection) {
      const { orderId, docId, amount, status, isPaid, date } = selection
      const idFromOrder =
        typeof orderId === 'string' && orderId.trim() ? orderId.trim() : null
      const idFromDoc =
        typeof docId === 'string' ? docId.replace(/^drafts\./, '') : null
      const displayId = idFromOrder ?? idFromDoc ?? '—'
      const dateObj =
        date !== undefined && date !== null ? new Date(date as string) : null
      const dateValid = dateObj !== null && !Number.isNaN(dateObj.getTime())
      const dateStr = dateValid
        ? `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`
        : ''
      const title =
        dateStr !== ''
          ? `Замовлення #${displayId} (${dateStr})`
          : `Замовлення #${displayId}`
      const amountNum =
        typeof amount === 'number'
          ? amount
          : typeof amount === 'string'
            ? Number.parseFloat(amount)
            : Number.NaN
      const amountStr = Number.isFinite(amountNum)
        ? `₴${amountNum.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
        : '—'
      const statusLabel =
        typeof status === 'string' ? STATUS_LABELS[status] ?? status : '—'
      const paidLabel = isPaid === true ? 'Так' : isPaid === false ? 'Ні' : '—'
      const subtitle = `${amountStr} | Статус: ${statusLabel} | Оплачено: ${paidLabel}`
      return { title, subtitle }
    },
  },
})
