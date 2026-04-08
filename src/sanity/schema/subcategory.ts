import { defineType, defineField } from 'sanity'
import { ListIcon } from '@sanity/icons'
import { slugifyTitleForSlug } from './slugify-title'

const SUBCATEGORY_SLUG_HELP =
    'Натисніть «Generate», щоб створити посилання з назви. На сайті: ваш-домен/categories/ваш-slug. У межах однієї головної категорії не можна повторювати slug підкатегорій. Після публікації змінюйте лише за потреби.'

const SANITY_API_VERSION = '2024-01-01'

type SlugUniqueContext = {
    document?: { _id?: string; parent?: { _ref?: string } }
    getClient: (options: { apiVersion: string }) => {
        fetch: (query: string, params?: Record<string, unknown>) => Promise<number>
    }
}

function subcategorySlugUnique() {
    return async (slug: { current?: string } | undefined, context: SlugUniqueContext) => {
        const current = slug?.current
        if (!current) return true
        const id = context.document?._id
        if (!id) return true
        const published = id.replace(/^drafts\./, '')
        const excludeIds = Array.from(new Set([id, `drafts.${published}`]))
        const parentRef = context.document?.parent?._ref
        const client = context.getClient({ apiVersion: SANITY_API_VERSION })

        if (!parentRef) {
            const count = await client.fetch(
                `count(*[_type == "subcategory" && slug.current == $slug && !(_id in $excludeIds)])`,
                { slug: current, excludeIds }
            )
            return count === 0 ? true : 'Спочатку оберіть головну категорію; цей URL уже зайнятий'
        }

        const count = await client.fetch(
            `count(*[_type == "subcategory" && slug.current == $slug && parent._ref == $parentRef && !(_id in $excludeIds)])`,
            { slug: current, parentRef, excludeIds }
        )
        return count === 0 ? true : 'Цей URL уже використовується в цій головній категорії'
    }
}

export const subcategory = defineType({
    name: 'subcategory',
    title: 'Підкатегорія',
    type: 'document',
    icon: ListIcon,
    groups: [
        { name: 'basics', title: 'Основне', default: true },
        { name: 'media', title: 'Медіа' },
        { name: 'meta', title: 'SEO та Налаштування' },
    ],
    fields: [
        defineField({
            name: 'title',
            type: 'string',
            title: 'Назва',
            description: 'Назва підрозділу в каталозі. Обовʼязкове поле.',
            group: 'basics',
            options: { search: { weight: 10 } },
            validation: (Rule) =>
                Rule.required()
                    .error('Введіть назву підкатегорії.')
                    .min(1)
                    .error('Назва не може бути порожньою.'),
        }),
        defineField({
            name: 'image',
            type: 'image',
            title: 'Зображення',
            group: 'media',
            options: { hotspot: true },
        }),
        defineField({
            name: 'parent',
            type: 'reference',
            to: [{ type: 'category' }],
            title: 'Головна категорія',
            description:
                'Оберіть лише документ типу «Категорія». Підкатегорію як батька обрати не можна — у списку будуть лише категорії.',
            group: 'basics',
            options: {
                filter: '_type == "category"',
                disableNew: true,
            },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: 'description',
            type: 'text',
            title: 'Опис',
            group: 'basics',
        }),
        defineField({
            name: 'slug',
            type: 'slug',
            title: 'Посилання (slug / URL)',
            description: SUBCATEGORY_SLUG_HELP,
            group: 'meta',
            options: {
                source: 'title',
                slugify: slugifyTitleForSlug,
            },
            validation: (Rule) =>
                Rule.required()
                    .error('Згенеруйте slug з назви — натисніть «Generate».')
                    .custom(subcategorySlugUnique()),
        }),
        defineField({
            name: 'sortOrder',
            type: 'number',
            title: 'Порядок у меню та каталозі',
            description:
                'Менше число — раніше під своїм розділом: 1 = зверху, 99 = типово внизу. Порожнє поле на сайті трактується як 99; однакові значення — за датою створення (новіші першими).',
            group: 'meta',
            initialValue: 99,
            validation: (Rule) =>
                Rule.custom((v) => {
                    if (v === undefined || v === null) return true
                    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 99999) {
                        return 'Ціле число від 0 до 99999'
                    }
                    return true
                }),
        }),
    ],
    preview: {
        select: {
            title: 'title',
            media: 'image',
        },
        prepare({ title, media }) {
            const safeMedia =
                media &&
                typeof media === 'object' &&
                'asset' in media &&
                (media as { asset?: { _ref?: string } }).asset?._ref
                    ? media
                    : undefined
            return {
                title: title ?? 'Без назви',
                subtitle: 'Підкатегорія',
                media: safeMedia,
            }
        },
    },
})
