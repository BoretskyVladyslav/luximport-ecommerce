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
  fieldsets: [
    { name: 'main', title: '📦 Основна інформація' },
    { name: 'price', title: '💰 Ціна та Наявність' },
    { name: 'media', title: '📸 Фотографії' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Назва товару',
      description: 'Назва, яку бачать покупці в каталозі та в кошику.',
      fieldset: 'main',
      options: { search: { weight: 10 } },
      validation: (Rule) => Rule.required().error("Назва товару обов'язкова"),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Посилання (slug / URL)',
      description: PRODUCT_SLUG_HELP,
      fieldset: 'main',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: slugifyTitleForSlug,
      },
      validation: (Rule) =>
        Rule.required()
          .error("Slug обов'язковий")
          .custom(productSlugUnique()),
    }),

    defineField({
      name: 'categories',
      type: 'array',
      title: 'Категорії для магазину',
      description:
        'Можна обрати одну або кілька позицій: «Категорія» (головний розділ) або «Підкатегорія». У пошуку показуються назви та тип розділу. Той самий запис двічі додати не можна. Без хоча б однієї категорії товар не опублікувати.',
      fieldset: 'main',
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
      title: 'Опис товару',
      description: 'Детальний опис. Можна використовувати списки та виділення тексту.',
      fieldset: 'main',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'brand',
      type: 'string',
      title: 'Бренд/Виробник',
      description: 'Бренд або виробник товару (для фільтрів і пошуку).',
      fieldset: 'main',
      options: { search: { weight: 8 } },
    }),
    defineField({
      name: 'origin',
      type: 'string',
      title: 'Країна походження',
      description: 'Країна виробництва або походження товару.',
      fieldset: 'main',
    }),
    defineField({
      name: 'sku',
      type: 'string',
      title: 'Артикул (SKU)',
      description: 'Використовується у пошуку в Studio та для внутрішнього обліку.',
      fieldset: 'main',
      validation: (Rule) => Rule.required().error('Артикул (SKU) обовʼязковий'),
      initialValue: () => `LUX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      options: { search: { weight: 10 } },
    }),
    defineField({
      name: 'barcode',
      type: 'string',
      title: 'Штрихкод',
      description: 'Штрихкод товару (за потреби).',
      fieldset: 'main',
      options: { search: { weight: 9 } },
    }),
    defineField({
      name: 'images',
      type: 'array',
      title: 'Фотографії товару',
      description:
        'Додайте щонайменше одне фото. Перше фото використовується як основне в каталозі та в превʼю.',
      fieldset: 'media',
      options: { sortable: true },
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
        }),
      ],
      validation: (Rule) => Rule.required().min(1).error('Додайте хоча б одне фото'),
    }),
    defineField({
      name: 'price',
      type: 'number',
      title: 'Роздрібна ціна (₴)',
      description: 'Стандартна ціна за 1 одиницю.',
      fieldset: 'price',
      validation: (Rule) => Rule.required().positive().error('Ціна має бути більшою за 0'),
    }),
    defineField({
      name: 'wholesalePrice',
      type: 'number',
      title: 'Ціна зі знижкою (опт, ₴)',
      description:
        'Знижена ціна за одиницю при замовленні від зазначеної кількості (гурт). На вітрині показується як альтернатива роздрібній.',
      fieldset: 'price',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'wholesaleMinQuantity',
      type: 'number',
      title: 'Мін. кількість для опту',
      description: 'Кількість одиниць у кошику, необхідна для активації оптової ціни.',
      fieldset: 'price',
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
      fieldset: 'price',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'stock',
      type: 'number',
      title: 'Залишок на складі',
      description: 'Скільки одиниць є в наявності (автоматично списується при покупці).',
      fieldset: 'price',
      initialValue: 1,
      validation: (Rule) => Rule.required().min(0).error("Залишок не може бути від'ємним"),
    }),
    defineField({
      name: 'weightKg',
      type: 'number',
      title: 'Вага брутто (кг)',
      description: 'Використовується для розрахунку вартості доставки.',
      fieldset: 'main',
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
      fieldset: 'main',
    }),
    defineField({
      name: 'piecesPerBox',
      type: 'number',
      title: 'Кількість штук у ящику',
      description: 'Числовий еквівалент фасування (шт/ящ). Імпортується з колонки "шт в ящиу" Excel-файлу.',
      fieldset: 'main',
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
      fieldset: 'main',
    }),
    defineField({
      name: 'dimensions',
      type: 'object',
      title: 'Габарити (ДхШхВ)',
      description: 'Габарити одиниці товару для логістики (за потреби).',
      fieldset: 'main',
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
      fieldset: 'main',
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
      media: 'images.0',
      price: 'price',
      stock: 'stock',
    },
    prepare(selection) {
      const { title, media, price, stock } = selection
      const priceNum =
        typeof price === 'number'
          ? price
          : typeof price === 'string'
            ? Number.parseFloat(price)
            : Number.NaN
      const priceStr = Number.isFinite(priceNum) ? `₴${priceNum.toLocaleString('uk-UA')}` : '—'
      const stockNum =
        typeof stock === 'number'
          ? stock
          : typeof stock === 'string'
            ? Number.parseInt(stock, 10)
            : Number.NaN
      const stockLabel = Number.isFinite(stockNum)
        ? `В наявності: ${stockNum}`
        : 'В наявності: —'
      const subtitle = `${priceStr} | ${stockLabel}`
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
