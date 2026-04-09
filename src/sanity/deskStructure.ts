import {
  CogIcon,
  HomeIcon,
  ImagesIcon,
  PackageIcon,
  StackCompactIcon,
  TagsIcon,
  UsersIcon,
} from '@sanity/icons'
import { ShoppingCart } from 'lucide-react'
import type { StructureResolver } from 'sanity/structure'

const SETTINGS_TYPES: ReadonlyArray<{
  typeName: string
  title: string
  icon: typeof CogIcon
}> = [
  { typeName: 'siteSettings', title: 'Налаштування сайту', icon: CogIcon },
  { typeName: 'banner', title: 'Банери', icon: ImagesIcon },
  { typeName: 'homepage', title: 'Головна сторінка', icon: HomeIcon },
  { typeName: 'homePage', title: 'Головна сторінка', icon: HomeIcon },
]

export const deskStructure: StructureResolver = (S, context) => {
  const seen = new Set<string>()
  const settingsItems = SETTINGS_TYPES.filter(({ typeName }) => {
    if (seen.has(typeName)) return false
    if (!context.schema.get(typeName)) return false
    seen.add(typeName)
    return true
  }).map(({ typeName, title, icon }) =>
    S.listItem()
      .title(title)
      .id(`settings-${typeName}`)
      .icon(icon)
      .child(S.documentTypeList(typeName).title(title)),
  )

  const rootItems = [
    S.listItem()
      .title('🛍️ Каталог')
      .id('group-catalog')
      .child(
        S.list()
          .title('Каталог')
          .items([
            S.listItem()
              .title('Товари')
              .id('product')
              .icon(PackageIcon)
              .child(S.documentTypeList('product').title('Товари')),
            S.listItem()
              .title('Головні категорії')
              .id('main-categories')
              .icon(TagsIcon)
              .child(
                S.documentList()
                  .title('Головні категорії')
                  .filter('_type == "category" && !defined(parent)'),
              ),
            S.listItem()
              .title('Підкатегорії')
              .id('subcategories')
              .icon(StackCompactIcon)
              .child(
                S.documentList()
                  .title('Підкатегорії')
                  .filter('_type in ["category", "subcategory"] && defined(parent)'),
              ),
          ]),
      ),
    S.listItem()
      .title('🛒 Продажі')
      .id('group-sales')
      .child(
        S.list()
          .title('Продажі')
          .items([
            S.listItem()
              .title('Замовлення')
              .id('order')
              .icon(ShoppingCart)
              .child(S.documentTypeList('order').title('Замовлення')),
            S.listItem()
              .title('Користувачі')
              .id('user')
              .icon(UsersIcon)
              .child(S.documentTypeList('user').title('Користувачі')),
          ]),
      ),
  ]

  if (settingsItems.length > 0) {
    rootItems.push(
      S.listItem()
        .title('⚙️ Налаштування')
        .id('group-settings')
        .icon(CogIcon)
        .child(S.list().title('Налаштування').items(settingsItems)),
    )
  }

  return S.list().title('Контент').items(rootItems)
}
