import { defineType, defineField } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Товар',
  type: 'document',
  groups: [
    { name: 'general', title: 'Основна інформація', default: true },
    { name: 'pricing', title: 'Ціноутворення та Залишки' },
    { name: 'logistics', title: 'Логістика та Ідентифікація' },
  ],
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      title: 'Зображення',
      description: 'Drag and drop the high-resolution product image here. Recommended format: square (1:1).',
      options: { hotspot: true },
      group: 'general',
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Назва товару',
      description: 'Клієнтоорієнтована назва продукту (відображається в каталозі).',
      group: 'general',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Посилання',
      description: 'Унікальне посилання для URL (генерується автоматично з назви).',
      group: 'general',
      options: {
        source: 'title',
        slugify: (input) => {
          const charMap: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 'ж': 'zh',
            'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
            'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia',
            'А': 'a', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Ґ': 'g', 'Д': 'd', 'Е': 'e', 'Є': 'ie', 'Ж': 'zh',
            'З': 'z', 'И': 'y', 'І': 'i', 'Ї': 'i', 'Й': 'i', 'К': 'k', 'Л': 'l', 'М': 'm', 'Н': 'n',
            'О': 'o', 'П': 'p', 'Р': 'r', 'С': 's', 'Т': 't', 'У': 'u', 'Ф': 'f', 'Х': 'kh', 'Ц': 'ts',
            'Ч': 'ch', 'Ш': 'sh', 'Щ': 'shch', 'Ь': '', 'Ю': 'iu', 'Я': 'ia', 'ы': 'y', 'э': 'e', 'ё': 'yo', 'ъ': ''
          };

          const transliterated = input.split('').map(char => charMap[char] || char).join('');

          return transliterated
            .toLowerCase()
            .replace(/\s+/g, '-')       // Replace spaces with hyphens
            .replace(/[^a-z0-9-]/g, '') // Remove all non-word chars
            .replace(/-+/g, '-')        // Replace multiple hyphens with single hyphen
            .replace(/^-+/, '')         // Trim hyphens from start
            .replace(/-+$/, '')         // Trim hyphens from end
            .slice(0, 200);             // Limit length
        }
      },
    }),

    defineField({
      name: 'categories',
      type: 'array',
      title: 'Категорії (Зв\'язки)',
      description: 'Прив\'язка до існуючих документів категорій.',
      group: 'general',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'brand',
      type: 'string',
      title: 'Бренд/Виробник',
      group: 'general',
    }),
    defineField({
      name: 'origin',
      type: 'string',
      title: 'Країна походження',
      group: 'general',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Опис товару',
      group: 'general',
    }),
    defineField({
      name: 'price',
      type: 'number',
      title: 'Роздрібна ціна (₴)',
      description: 'Стандартна ціна за 1 одиницю.',
      group: 'pricing',
    }),
    defineField({
      name: 'wholesalePrice',
      type: 'number',
      title: 'Оптова ціна (₴)',
      description: 'Знижена ціна, що застосовується при досягненні оптової кількості.',
      group: 'pricing',
    }),
    defineField({
      name: 'wholesaleMinQuantity',
      type: 'number',
      title: 'Мін. кількість для опту',
      description: 'Кількість одиниць у кошику, необхідна для активації оптової ціни.',
      group: 'pricing',
    }),
    defineField({
      name: 'msrp',
      type: 'number',
      title: 'Рекомендована роздрібна ціна (MSRP)',
      description: 'Рекомендована ціна продажу від виробника (для довідки).',
      group: 'pricing',
    }),
    defineField({
      name: 'stock',
      type: 'number',
      title: 'Залишок на складі',
      description: 'Скільки одиниць є в наявності (автоматично списується при покупці).',
      group: 'pricing',
    }),
    defineField({
      name: 'sku',
      type: 'string',
      title: 'Артикул (SKU)',
      validation: (Rule) => Rule.required(),
      initialValue: () => `LUX - ${Math.random().toString(36).substring(2, 8).toUpperCase()} `,
      group: 'logistics',
    }),
    defineField({
      name: 'barcode',
      type: 'string',
      title: 'Штрихкод',
      group: 'logistics',
    }),
    defineField({
      name: 'weightKg',
      type: 'number',
      title: 'Вага брутто (кг)',
      description: 'Використовується для розрахунку вартості доставки.',
      group: 'logistics',
    }),

    defineField({
      name: 'packaging',
      type: 'string',
      title: 'Фасування (в ящику)',
      description: 'Наприклад: "12 шт/ящ".',
      group: 'logistics',
    }),
    defineField({
      name: 'piecesPerBox',
      type: 'number',
      title: 'Кількість штук у ящику',
      description: 'Числовий еквівалент фасування (шт/ящ). Імпортується з колонки "шт в ящиу" Excel-файлу.',
      group: 'logistics',
    }),
    defineField({
      name: 'weight',
      type: 'string',
      title: 'Вага / Об\'єм',
      description: 'Вага або об\'єм одиниці товару (наприклад: "165г", "1л"). Витягується автоматично з назви при імпорті.',
      group: 'logistics',
    }),
    defineField({
      name: 'dimensions',
      type: 'object',
      title: 'Габарити (ДхШхВ)',
      group: 'logistics',
      fields: [
        defineField({ name: 'length', type: 'number', title: 'Довжина (см)' }),
        defineField({ name: 'width', type: 'number', title: 'Ширина (см)' }),
        defineField({ name: 'height', type: 'number', title: 'Висота (см)' }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      price: 'price',
      media: 'image',
    },
    prepare(selection) {
      const { title, price, media } = selection;
      return {
        title: title,
        subtitle: price ? `Price: ${price} грн` : 'No price',
        media: media,
      };
    },
  },
})
