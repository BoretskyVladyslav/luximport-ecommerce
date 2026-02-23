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
  ],
})
