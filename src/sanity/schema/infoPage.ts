import { defineType, defineField } from 'sanity'

export const infoPage = defineType({
    name: 'infoPage',
    title: 'Інформаційна сторінка',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            type: 'string',
            title: 'Заголовок',
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
            name: 'content',
            type: 'array',
            title: 'Контент',
            of: [{ type: 'block' }],
        }),
    ],
})
