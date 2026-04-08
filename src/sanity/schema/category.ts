import { defineType, defineField } from 'sanity'
import { TagIcon } from '@sanity/icons'
import { slugifyTitleForSlug } from './slugify-title'

const CATEGORY_SLUG_HELP =
    'Натисніть «Generate», щоб створити посилання з назви; після зміни назви згенеруйте slug знову за потреби. На сайті: ваш-домен/categories/ваш-slug. Дублікати URL між категоріями заборонені. Після публікації змінюйте slug лише з обережності.'

const SANITY_API_VERSION = '2024-01-01'

type SlugUniqueContext = {
    document?: { _id?: string }
    getClient: (options: { apiVersion: string }) => {
        fetch: (query: string, params?: Record<string, unknown>) => Promise<number>
    }
}

function categorySlugUnique() {
    return async (slug: { current?: string } | undefined, context: SlugUniqueContext) => {
        const current = slug?.current
        if (!current) return true
        const id = context.document?._id
        if (!id) return true
        const published = id.replace(/^drafts\./, '')
        const excludeIds = Array.from(new Set([id, `drafts.${published}`]))
        const client = context.getClient({ apiVersion: SANITY_API_VERSION })
        const count = await client.fetch(
            `count(*[_type == "category" && slug.current == $slug && !(_id in $excludeIds)])`,
            { slug: current, excludeIds }
        )
        return count === 0 ? true : 'Цей URL уже використовується іншою категорією'
    }
}

export const category = defineType({
    name: 'category',
    title: 'Категорія',
    type: 'document',
    icon: TagIcon,
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
            description: 'Відображається в меню каталогу та на сторінці розділу. Обовʼязкове поле.',
            group: 'basics',
            options: { search: { weight: 10 } },
            validation: (Rule) =>
                Rule.required()
                    .error('Введіть назву категорії.')
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
            name: 'description',
            type: 'text',
            title: 'Опис',
            group: 'basics',
        }),
        defineField({
            name: 'slug',
            type: 'slug',
            title: 'Посилання (slug / URL)',
            description: CATEGORY_SLUG_HELP,
            group: 'meta',
            options: {
                source: 'title',
                slugify: slugifyTitleForSlug,
            },
            validation: (Rule) =>
                Rule.required()
                    .error('Згенеруйте slug з назви — натисніть «Generate».')
                    .custom(categorySlugUnique()),
        }),
        defineField({
            name: 'sortOrder',
            type: 'number',
            title: 'Порядок у меню та каталозі',
            description:
                'Менше число — раніше в навігації та боковому меню: 1 = зверху, 99 = типово внизу. Порожнє поле на сайті трактується як 99; однакові значення сортуються за датою створення (новіші першими).',
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
        defineField({
            name: 'parent',
            type: 'reference',
            to: [{ type: 'category' }],
            title: 'Батьківська категорія',
            description:
                'Лишіть порожнім для головної категорії в меню. Заповніть лише якщо це вкладена категорія всередині іншої категорії.',
            group: 'meta',
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
                subtitle: 'Категорія',
                media: safeMedia,
            }
        },
    },
})
