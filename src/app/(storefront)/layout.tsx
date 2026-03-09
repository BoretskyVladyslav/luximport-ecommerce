import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import '@/styles/globals.scss'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartSidebar } from '@/components/ui/cart-sidebar'
import { WishlistSidebar } from '@/components/ui/wishlist-sidebar'
import { CategoryNav } from '@/components/layout/CategoryNav'
import { cn } from '@/lib/utils'

const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-heading' })
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Luximport | Premium Products',
  description: 'Online store for premium imported food products',
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn(playfair.variable, inter.variable, "flex min-h-full flex-col antialiased font-body flex-1")} suppressHydrationWarning>
      <Header />
      <CategoryNav />
      <CartSidebar />
      <WishlistSidebar />
      <main className='flex-1 flex flex-col'>
        {children}
      </main>
      <Footer />
    </div>
  )
}
