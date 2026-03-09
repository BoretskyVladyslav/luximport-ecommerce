import { defineType, defineField } from 'sanity'

export const category = defineType({
    name: 'category',
    title: 'Категорія',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            type: 'string',
            title: 'Назва',
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'slug',
            type: 'slug',
            title: 'Посилання',
            options: { source: 'title' },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            type: 'text',
            title: 'Опис',
        }),
        defineField({
            name: 'image',
            type: 'image',
            title: 'Зображення',
            options: { hotspot: true },
        }),
    ],
})
