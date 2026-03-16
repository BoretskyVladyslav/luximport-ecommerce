export interface Product {
  id: string
  title: string
  slug: string
  price: number
  wholesalePrice?: number
  wholesaleMinQuantity?: number
  /** Pieces per box from the Excel import — used as the wholesale threshold */
  piecesPerBox?: number
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