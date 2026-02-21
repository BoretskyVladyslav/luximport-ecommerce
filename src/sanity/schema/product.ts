export const product = {
  name: 'product',
  type: 'document',
  title: 'Товар',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Назва товару',
    },
    {
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
    },
    {
      name: 'price',
      type: 'number',
      title: 'Ціна (UAH)',
    },
    {
      name: 'image',
      type: 'image',
      title: 'Головне фото',
      options: { hotspot: true },
    },
    {
      name: 'category',
      type: 'string',
      title: 'Категорія',
      options: {
        list: ['Кава', 'Солодощі', 'Бакалія', "М'ясо", 'Сири', 'Набори'],
      },
    },
    {
      name: 'description',
      type: 'text',
      title: 'Опис',
    },
    {
      name: 'isBestSeller',
      type: 'boolean',
      title: 'Хіт продажу?',
    },
  ],
}
