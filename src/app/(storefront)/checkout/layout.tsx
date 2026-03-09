import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Оформлення замовлення | Luximport',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
