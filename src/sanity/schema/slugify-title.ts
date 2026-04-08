/** Transliterate Ukrainian (and common Cyrillic) for URL-safe slugs in Studio. */
export function slugifyTitleForSlug(input: string): string {
  const charMap: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    ґ: 'g',
    д: 'd',
    е: 'e',
    є: 'ie',
    ж: 'zh',
    з: 'z',
    и: 'y',
    і: 'i',
    ї: 'i',
    й: 'i',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ь: '',
    ю: 'iu',
    я: 'ia',
    А: 'a',
    Б: 'b',
    В: 'v',
    Г: 'g',
    Ґ: 'g',
    Д: 'd',
    Е: 'e',
    Є: 'ie',
    Ж: 'zh',
    З: 'z',
    И: 'y',
    І: 'i',
    Ї: 'i',
    Й: 'i',
    К: 'k',
    Л: 'l',
    М: 'm',
    Н: 'n',
    О: 'o',
    П: 'p',
    Р: 'r',
    С: 's',
    Т: 't',
    У: 'u',
    Ф: 'f',
    Х: 'kh',
    Ц: 'ts',
    Ч: 'ch',
    Ш: 'sh',
    Щ: 'shch',
    Ь: '',
    Ю: 'iu',
    Я: 'ia',
    ы: 'y',
    э: 'e',
    ё: 'yo',
    ъ: '',
  }

  const transliterated = input
    .split('')
    .map((char) => charMap[char] ?? char)
    .join('')

  return transliterated
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 200)
}
