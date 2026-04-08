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

export type OrderFulfillmentStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export type OrderPaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'

export interface Order {
  _id: string
  orderId: string | null
  status: OrderFulfillmentStatus | null
  isPaid: boolean
  paymentStatus?: OrderPaymentStatus | null
  trackingNumber?: string | null
  adminNotes?: string | null
  totalAmount?: number | null
  shippingAddress?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  items?: unknown[] | null
  itemsCount?: number | null
  _createdAt: string
}