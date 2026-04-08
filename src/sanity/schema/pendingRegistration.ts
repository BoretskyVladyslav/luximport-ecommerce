import { defineField, defineType } from 'sanity'

export const pendingRegistration = defineType({
    name: 'pendingRegistration',
    title: 'Pending registration',
    type: 'document',
    fields: [
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            validation: (Rule) => Rule.required().email(),
        }),
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (Rule) => Rule.required().max(120),
        }),
        defineField({
            name: 'passwordHash',
            title: 'Password hash',
            type: 'string',
            hidden: true,
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'otpHash',
            title: 'OTP hash',
            type: 'string',
            hidden: true,
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'otpExpiresAt',
            title: 'OTP expires at',
            type: 'datetime',
            readOnly: true,
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'attempts',
            title: 'Attempts',
            type: 'number',
            readOnly: true,
            initialValue: 0,
            validation: (Rule) => Rule.required().min(0).max(10),
        }),
        defineField({
            name: 'createdAt',
            title: 'Created at',
            type: 'datetime',
            readOnly: true,
            validation: (Rule) => Rule.required(),
        }),
    ],
    preview: {
        select: {
            title: 'email',
            subtitle: 'createdAt',
        },
    },
})

