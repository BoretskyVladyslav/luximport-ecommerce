import { defineType, defineField, defineArrayMember } from 'sanity'
import { BasketIcon } from '@sanity/icons'
import { slugifyTitleForSlug } from './slugify-title'

const PRODUCT_SLUG_HELP =
  'Натисніть «Generate» (згенерувати), щоб створити посилання з назви; після зміни назви натисніть знову, якщо потрібно оновити slug. Сайт: ваш-домен/products/ваш-slug (наприклад, luximport.org/products/kava-zerna). Після публікації змінюйте обережно — старі посилання перестануть відкривати цей товар. Система не дозволить дублікат URL між товарами.'

const SANITY_API_VERSION = '2024-01-01'

type SlugUniqueContext = {
  document?: { _id?: string }
  getClient: (options: { apiVersion: string }) => {
    fetch: (query: string, params?: Record<string, unknown>) => Promise<number>
  }
}

function productSlugUnique() {
  return async (slug: { current?: string } | undefined, context: SlugUniqueContext) => {
    const current = slug?.current
    if (!current) return true
    const id = context.document?._id
    if (!id) return true
    const published = id.replace(/^drafts\./, '')
    const excludeIds = Array.from(new Set([id, `drafts.${published}`]))
    const client = context.getClient({ apiVersion: SANITY_API_VERSION })
    const count = await client.fetch(
      `count(*[_type == "product" && slug.current == $slug && !(_id in $excludeIds)])`,
      { slug: current, excludeIds }
    )
    return count === 0 ? true : 'Цей URL уже використовується іншим товаром'
  }
}

export const product = defineType({
  name: 'product',
  title: 'Товар',
  type: 'document',
  icon: BasketIcon,
  groups: [
    { name: 'basic', title: 'Основна інформація', default: true },
    { name: 'media', title: 'Медіа' },
    { name: 'pricing', title: 'Ціноутворення' },
    { name: 'inventory', title: 'Склад і логістика' },
    { name: 'seo', title: 'SEO та відображення' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Назва товару',
      description: 'Клієнтоорієнтована назва продукту (відображається в каталозі).',
      group: 'basic',
      options: { search: { weight: 10 } },
      validation: (Rule) =>
        Rule.required()
          .error('Введіть назву товару — її бачитимуть покупці в каталозі та в кошику.')
          .min(1)
          .error('Назва не може складатися лише з пробілів.'),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Посилання (slug / URL)',
      description: PRODUCT_SLUG_HELP,
      group: 'basic',
      options: {
        source: 'title',
        slugify: slugifyTitleForSlug,
      },
      validation: (Rule) =>
        Rule.required()
          .error('Згенеруйте slug: натисніть «Generate» після введення назви (джерело — назва товару).')
          .custom(productSlugUnique()),
    }),

    defineField({
      name: 'categories',
      type: 'array',
      title: 'Категорії для магазину',
      description:
        'Можна обрати одну або кілька позицій: «Категорія» (головний розділ) або «Підкатегорія». У пошуку показуються назви та тип розділу. Той самий запис двічі додати не можна. Без хоча б однієї категорії товар не опублікувати.',
      group: 'basic',
      options: {
        layout: 'tags',
        sortable: true,
      },
      of: [
        defineArrayMember({
          type: 'reference',
          title: 'Розділ каталогу',
          to: [{ type: 'category' }, { type: 'subcategory' }],
          options: {
            disableNew: true,
            filter: '_type == "category" || _type == "subcategory"',
          },
          validation: (Rule) =>
            Rule.required().error('Оберіть категорію або підкатегорію зі списку (порожні рядки не дозволені).'),
        }),
      ],
      validation: (Rule) =>
        Rule.required()
          .error('Призначте товар хоча б одному розділу каталогу.')
          .min(1)
          .error('Щоб опублікувати товар, додайте принаймні одну категорію або підкатегорію.')
          .unique()
          .error('Та сама категорія вже додана — приберіть дублікат.')
          .custom((items) => {
            if (!Array.isArray(items) || items.length === 0) return true
            const refs = items.map((item) =>
              item && typeof item === 'object' ? (item as { _ref?: string })._ref : undefined
            )
            if (refs.some((r) => !r)) {
              return 'Усі позиції мають містити обрану категорію або підкатегорію.'
            }
            return true
          }),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Опис товару',
      group: 'basic',
    }),
    defineField({
      name: 'brand',
      type: 'string',
      title: 'Бренд/Виробник',
      group: 'basic',
      options: { search: { weight: 8 } },
    }),
    defineField({
      name: 'origin',
      type: 'string',
      title: 'Країна походження',
      group: 'basic',
    }),
    defineField({
      name: 'sku',
      type: 'string',
      title: 'Артикул (SKU)',
      description: 'Використовується у пошуку в Studio та для внутрішнього обліку.',
      validation: (Rule) => Rule.required(),
      initialValue: () => `LUX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      group: 'basic',
      options: { search: { weight: 10 } },
    }),
    defineField({
      name: 'barcode',
      type: 'string',
      title: 'Штрихкод',
      group: 'basic',
      options: { search: { weight: 9 } },
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Зображення товару',
      description:
        'Обовʼязкове основне фото для каталогу, картки товару та кошика. Рекомендовано квадрат 1:1, чітке зображення упаковки або товару. У списку Studio показується саме це зображення.',
      options: { hotspot: true },
      group: 'media',
      validation: (Rule) =>
        Rule.custom((value) => {
          const ref =
            value && typeof value === 'object' && 'asset' in value
              ? (value as { asset?: { _ref?: string } }).asset?._ref
              : undefined
          return ref
            ? true
            : 'Додайте зображення: натисніть поле та завантажте файл. Без фото товар не можна коректно показати на сайті.'
        }),
    }),
    defineField({
      name: 'price',
      type: 'number',
      title: 'Роздрібна ціна (₴)',
      description: 'Стандартна ціна за 1 одиницю.',
      group: 'pricing',
      validation: (Rule) =>
        Rule.required()
          .error('Вкажіть роздрібну ціну в гривнях за одиницю товару.')
          .custom((v) => {
            if (typeof v !== 'number' || Number.isNaN(v)) return 'Ціна має бути числом.'
            if (v <= 0) return 'Ціна має бути додатною (більшою за 0 ₴).'
            return true
          }),
    }),
    defineField({
      name: 'wholesalePrice',
      type: 'number',
      title: 'Ціна зі знижкою (опт, ₴)',
      description:
        'Знижена ціна за одиницю при замовленні від зазначеної кількості (гурт). На вітрині показується як альтернатива роздрібній.',
      group: 'pricing',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'wholesaleMinQuantity',
      type: 'number',
      title: 'Мін. кількість для опту',
      description: 'Кількість одиниць у кошику, необхідна для активації оптової ціни.',
      group: 'pricing',
      validation: (Rule) =>
        Rule.custom((qty) => {
          if (qty === undefined || qty === null) return true
          if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1) {
            return 'Вкажіть ціле число не менше 1'
          }
          return true
        }),
    }),
    defineField({
      name: 'msrp',
      type: 'number',
      title: 'Рекомендована роздрібна ціна (MSRP)',
      description: 'Рекомендована ціна продажу від виробника (для довідки).',
      group: 'pricing',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'stock',
      type: 'number',
      title: 'Залишок на складі',
      description: 'Скільки одиниць є в наявності (автоматично списується при покупці).',
      group: 'inventory',
      validation: (Rule) =>
        Rule.custom((v) => {
          if (v === undefined || v === null) return true
          if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
            return 'Вкажіть ціле число ≥ 0'
          }
          return true
        }),
    }),
    defineField({
      name: 'weightKg',
      type: 'number',
      title: 'Вага брутто (кг)',
      description: 'Використовується для розрахунку вартості доставки.',
      group: 'inventory',
      validation: (Rule) =>
        Rule.custom((v) => {
          if (v === undefined || v === null) return true
          return typeof v === 'number' && v >= 0 ? true : 'Не від\'ємне число'
        }),
    }),

    defineField({
      name: 'packaging',
      type: 'string',
      title: 'Фасування (в ящику)',
      description: 'Наприклад: "12 шт/ящ".',
      group: 'inventory',
    }),
    defineField({
      name: 'piecesPerBox',
      type: 'number',
      title: 'Кількість штук у ящику',
      description: 'Числовий еквівалент фасування (шт/ящ). Імпортується з колонки "шт в ящиу" Excel-файлу.',
      group: 'inventory',
      validation: (Rule) =>
        Rule.custom((v) => {
          if (v === undefined || v === null) return true
          if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
            return 'Вкажіть ціле число ≥ 1'
          }
          return true
        }),
    }),
    defineField({
      name: 'weight',
      type: 'string',
      title: 'Вага / Об\'єм',
      description: 'Вага або об\'єм одиниці товару (наприклад: "165г", "1л"). Витягується автоматично з назви при імпорті.',
      group: 'inventory',
    }),
    defineField({
      name: 'dimensions',
      type: 'object',
      title: 'Габарити (ДхШхВ)',
      group: 'inventory',
      fields: [
        defineField({
          name: 'length',
          type: 'number',
          title: 'Довжина (см)',
          validation: (Rule) =>
            Rule.custom((v) => {
              if (v === undefined || v === null) return true
              return typeof v === 'number' && v >= 0 ? true : 'Не від\'ємне число'
            }),
        }),
        defineField({
          name: 'width',
          type: 'number',
          title: 'Ширина (см)',
          validation: (Rule) =>
            Rule.custom((v) => {
              if (v === undefined || v === null) return true
              return typeof v === 'number' && v >= 0 ? true : 'Не від\'ємне число'
            }),
        }),
        defineField({
          name: 'height',
          type: 'number',
          title: 'Висота (см)',
          validation: (Rule) =>
            Rule.custom((v) => {
              if (v === undefined || v === null) return true
              return typeof v === 'number' && v >= 0 ? true : 'Не від\'ємне число'
            }),
        }),
      ],
    }),
    defineField({
      name: 'sortOrder',
      type: 'number',
      title: 'Порядок у каталозі',
      description:
        'Менше число — вище у списку на сайті: 1 = найвищий пріоритет (зверху), 99 = типовий низький пріоритет. Поле можна залишити порожнім — на сайті такі товари поводяться як 99 і сортуються серед «звичайних» за датою (новіші першими).',
      initialValue: 99,
      group: 'seo',
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
      price: 'price',
      brand: 'brand',
      media: 'image',
    },
    prepare(selection) {
      const { title, price, brand, media } = selection
      const priceNum =
        typeof price === 'number'
          ? price
          : typeof price === 'string'
            ? Number.parseFloat(price)
            : Number.NaN
      const priceStr = Number.isFinite(priceNum) ? `${priceNum.toLocaleString('uk-UA')} ₴` : null
      const brandStr = typeof brand === 'string' ? brand.trim() : ''
      const subtitle = [priceStr, brandStr || null].filter(Boolean).join(' · ') || undefined
      const safeMedia =
        media &&
        typeof media === 'object' &&
        'asset' in media &&
        (media as { asset?: { _ref?: string } }).asset?._ref
          ? media
          : undefined
      return {
        title: typeof title === 'string' && title.trim() ? title.trim() : 'Без назви',
        subtitle,
        media: safeMedia,
      }
    },
  },
})
