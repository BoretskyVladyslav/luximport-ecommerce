export interface Product {
  id: string
  title: string
  slug: string
  price: number
  wholesalePrice?: number
  wholesaleMinQuantity?: number
  piecesPerBox?: number
  countInStock?: number | null
  description: string
  images: string[]
  category: string
  isBestSeller?: boolean
  specs?: {
    brand: string
    country: string
    weight?: string
  }
}

export interface CartItem extends Product {
  quantity: number
}