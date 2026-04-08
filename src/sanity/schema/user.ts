import { defineField, defineType } from 'sanity'

export const user = defineType({
    name: 'user',
    title: 'User',
    type: 'document',
    fields: [
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            validation: (Rule) => Rule.required().email(),
        }),
        defineField({
            name: 'passwordHash',
            title: 'Password hash',
            type: 'string',
            hidden: true,
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'firstName',
            title: 'First name',
            type: 'string',
            validation: (Rule) => Rule.max(120),
        }),
        defineField({
            name: 'lastName',
            title: 'Last name',
            type: 'string',
            validation: (Rule) => Rule.max(120),
        }),
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.max(120),
        }),
        defineField({
            name: 'phone',
            title: 'Phone',
            type: 'string',
            validation: (Rule) => Rule.max(40),
        }),
        defineField({
            name: 'address',
            title: 'Address',
            type: 'string',
            validation: (Rule) => Rule.max(240),
        }),
        defineField({
            name: 'emailVerifiedAt',
            title: 'Email verified at',
            type: 'datetime',
            readOnly: true,
        }),
        defineField({
            name: 'createdAt',
            title: 'Created at',
            type: 'datetime',
            readOnly: true,
        }),
    ],
    preview: {
        select: {
            title: 'email',
            subtitle: 'name',
        },
    },
})

