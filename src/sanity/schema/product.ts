import { defineType, defineField } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Товар',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Назва товару',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Посилання',
      options: { source: 'title' },
    }),
    defineField({
      name: 'price',
      type: 'number',
      title: 'Ціна',
    }),
    defineField({
      name: 'wholesalePrice',
      type: 'number',
      title: 'Оптова ціна',
    }),
    defineField({
      name: 'wholesaleMinQuantity',
      type: 'number',
      title: 'Мін. кількість для опту',
    }),
    defineField({
      name: 'category',
      type: 'string',
      title: 'Категорія',
    }),
    defineField({
      name: 'origin',
      type: 'string',
      title: 'Країна походження',
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Зображення',
      options: { hotspot: true },
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Опис',
    }),
    defineField({
      name: 'stock',
      type: 'number',
      title: 'Залишок',
    }),
    defineField({
      name: 'sku',
      type: 'string',
      title: 'Артикул',
      validation: (Rule) => Rule.required(),
      initialValue: () => `LUX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    }),
    defineField({
      name: 'barcode',
      type: 'string',
      title: 'Штрихкод',
    }),
    defineField({
      name: 'brand',
      type: 'string',
      title: 'Бренд/Виробник',
    }),
    defineField({
      name: 'msrp',
      type: 'number',
      title: 'Рекомендована роздрібна ціна (MSRP)',
    }),
    defineField({
      name: 'weight',
      type: 'number',
      title: 'Вага (кг)',
    }),
    defineField({
      name: 'dimensions',
      type: 'object',
      title: 'Габарити (ДхШхВ)',
      fields: [
        defineField({ name: 'length', type: 'number', title: 'Довжина (см)' }),
        defineField({ name: 'width', type: 'number', title: 'Ширина (см)' }),
        defineField({ name: 'height', type: 'number', title: 'Висота (см)' }),
      ],
    }),
    defineField({
      name: 'categories',
      type: 'array',
      title: 'Категорії',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
  ],
})
