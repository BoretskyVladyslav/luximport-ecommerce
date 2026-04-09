export const GROQ_ORDER_MANUAL_SORT_THEN_NEWEST = 'coalesce(sortOrder, 99) asc, _createdAt desc'

export const GROQ_PRODUCT_CATEGORIES_EXPANDED = `"categories": categories[]->{
        _id,
        _type,
        title,
        "slug": slug.current,
        sortOrder,
        "parent": parent->{ _id }
    } | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST})`

export const GROQ_PRODUCT_PRIMARY_CATEGORY_TITLE = `"category": coalesce(
    (categories[]-> | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}))[0].title,
    category
)`

export const GROQ_PRODUCT_CARD_FIELDS = `
    _id,
    title,
    "price": coalesce(price, 0),
    wholesalePrice,
    wholesaleMinQuantity,
    piecesPerBox,
    weight,
    ${GROQ_PRODUCT_CATEGORIES_EXPANDED},
    origin,
    stock,
    "slug": slug.current,
    "image": coalesce(image, images[0])
`

export const PRODUCTS_CATALOG_QUERY = `*[
  _type == "product" &&
  (
    !defined($categorySlug) ||
    $categorySlug == "" ||
    count(categories[@->slug.current == $categorySlug]) > 0
  )
] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) {
${GROQ_PRODUCT_CARD_FIELDS}
}`

export const PRODUCTS_HOME_TEASER_QUERY = `*[_type == "product"] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) [0...3]{
    _id,
    title,
    "price": coalesce(price, 0),
    wholesalePrice,
    wholesaleMinQuantity,
    piecesPerBox,
    weight,
    ${GROQ_PRODUCT_PRIMARY_CATEGORY_TITLE},
    "slug": slug.current,
    "image": coalesce(image, images[0]),
    stock
}`

export const PRODUCT_BY_SLUG_QUERY = `*[_type == "product" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  "price": coalesce(price, 0),
  wholesalePrice,
  wholesaleMinQuantity,
  piecesPerBox,
  ${GROQ_PRODUCT_PRIMARY_CATEGORY_TITLE},
  origin,
  stock,
  description,
  "image": coalesce(image, images[0]),
  sku,
  brand,
  weight
}`

export const PRODUCTS_BY_CATEGORY_REFS_QUERY = `*[_type == "product" && count(categories[@._ref in $ids]) > 0] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) {
      _id,
      title,
      "slug": slug.current,
      "price": coalesce(price, 0),
      wholesalePrice,
      wholesaleMinQuantity,
      piecesPerBox,
      weight,
      ${GROQ_PRODUCT_PRIMARY_CATEGORY_TITLE},
      origin,
      stock,
      "image": coalesce(image, images[0])
    }`

export const GROQ_PRODUCT_CART_ELIGIBLE =
    '!(_id match "drafts.*") && defined(slug.current) && length(slug.current) > 0 && coalesce(price, 0) > 0 && (defined(image.asset._ref) || defined(images[0].asset._ref))'

export const GROQ_CART_RECOMMENDATION_FIELDS = `
    _id,
    title,
    "price": coalesce(price, 0),
    wholesalePrice,
    wholesaleMinQuantity,
    piecesPerBox,
    weight,
    ${GROQ_PRODUCT_CATEGORIES_EXPANDED},
    ${GROQ_PRODUCT_PRIMARY_CATEGORY_TITLE},
    origin,
    stock,
    "slug": slug.current,
    "image": coalesce(image, images[0])
`

export const CART_RECOMMENDATIONS_BY_CATEGORY_TITLES_QUERY = `*[ _type == "product" && ${GROQ_PRODUCT_CART_ELIGIBLE} && count(categories[@._ref in *[_type in ["category","subcategory"] && title in $categoryTitles && !(_id match "drafts.*")]._id]) > 0 && !(_id in $excludeIds)] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) [0...2] {
${GROQ_CART_RECOMMENDATION_FIELDS}
}`

export const CART_RECOMMENDATIONS_FALLBACK_QUERY = `*[ _type == "product" && ${GROQ_PRODUCT_CART_ELIGIBLE} && !(_id in $excludeIds)] | order(${GROQ_ORDER_MANUAL_SORT_THEN_NEWEST}) [0...2] {
${GROQ_CART_RECOMMENDATION_FIELDS}
}`

export type SanityImageField = {
    _type?: string
    asset?: { _ref?: string; _type?: string }
    hotspot?: { x?: number; y?: number; height?: number; width?: number }
} | null

export type CatalogTaxonomyRef = {
    _id: string
    _type: 'category' | 'subcategory'
    title: string | null
    slug: string | null
    sortOrder: number | null
    parent: { _id: string } | null
}

export type CatalogProduct = {
    _id: string
    title: string | null
    price: number
    wholesalePrice?: number | null
    wholesaleMinQuantity?: number | null
    piecesPerBox?: number | null
    weight?: string | null
    categories: CatalogTaxonomyRef[] | null
    origin?: string | null
    stock?: number | null
    slug: string | null
    image?: SanityImageField
}

export type HomeTeaserProduct = {
    _id: string
    title: string | null
    price: number
    wholesalePrice?: number | null
    wholesaleMinQuantity?: number | null
    piecesPerBox?: number | null
    weight?: string | null
    category?: string | null
    slug: string | null
    image?: SanityImageField
    stock?: number | null
}

export type ProductDetail = {
    _id: string
    title: string | null
    slug: { current: string } | null
    price: number
    wholesalePrice?: number | null
    wholesaleMinQuantity?: number | null
    piecesPerBox?: number | null
    category?: string | null
    origin?: string | null
    stock?: number | null
    description?: unknown[] | string | null
    image?: SanityImageField
    sku?: string | null
    brand?: string | null
    weight?: string | null
}

export type CategoryGridProduct = {
    _id: string
    title: string | null
    slug: string | null
    price: number
    wholesalePrice?: number | null
    wholesaleMinQuantity?: number | null
    piecesPerBox?: number | null
    weight?: string | null
    category?: string | null
    origin?: string | null
    stock?: number | null
    image?: SanityImageField
}

export type CartRecommendationProduct = CatalogProduct & {
    category?: string | null
}

export const GROQ_USER_ORDER_LIST_PROJECTION = `
    _id,
    orderId,
    status,
    "isPaid": coalesce(isPaid, false),
    paymentStatus,
    trackingNumber,
    totalAmount,
    shippingAddress,
    customerName,
    customerEmail,
    customerPhone,
    "itemsCount": coalesce(count(items), 0),
    items[]{
        productId,
        title,
        quantity,
        price,
        "image": *[_type == "product" && _id == ^.productId][0].image
    },
    _createdAt
`

export const GROQ_USER_ORDERS_BY_USER_REF = `*[_type == "order" && user._ref == $userId] | order(_createdAt desc) {
${GROQ_USER_ORDER_LIST_PROJECTION}
}`
