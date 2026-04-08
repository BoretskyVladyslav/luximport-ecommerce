import '@/styles/globals.scss'
import type { Metadata } from 'next'
import { GoogleTagManager } from '@next/third-parties/google'
import { getMetadataBase } from '@/lib/site-url'
import { ToastProvider } from '@/components/providers/toast-provider'

export const metadata: Metadata = {
    metadataBase: getMetadataBase(),
    title: 'LuxImport | Оптовий магазин',
    description: 'Ексклюзивні товари оптом з доставкою по Україні',
    openGraph: {
        title: 'LuxImport | Оптовий магазин',
        description: 'Ексклюзивні товари оптом з доставкою по Україні',
        locale: 'uk_UA',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="uk" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || 'GTM-KCB7NCH8'} />
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    )
}
