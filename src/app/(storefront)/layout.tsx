import { Playfair_Display, Inter } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartSidebar } from '@/components/ui/cart-sidebar'
import { WishlistSidebar } from '@/components/ui/wishlist-sidebar'
import { cn } from '@/lib/utils'

const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-heading' })
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-body' })

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn(playfair.variable, inter.variable, "flex min-h-full flex-col antialiased font-body flex-1")} suppressHydrationWarning>
      <Header />
      <CartSidebar />
      <WishlistSidebar />
      <main className='flex-1 flex flex-col'>
        {children}
      </main>
      <Footer />
    </div>
  )
}
