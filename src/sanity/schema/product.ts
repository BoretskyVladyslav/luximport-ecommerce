import { defineType, defineField } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title' },
    }),
    defineField({
      name: 'price',
      type: 'number',
      title: 'Price',
    }),
    defineField({
      name: 'category',
      type: 'string',
      title: 'Category',
    }),
    defineField({
      name: 'origin',
      type: 'string',
      title: 'Origin',
    }),
    defineField({
      name: 'stock',
      type: 'number',
      title: 'Stock',
    }),
  ],
})
