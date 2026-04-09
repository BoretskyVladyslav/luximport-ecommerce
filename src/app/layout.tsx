import '@/styles/globals.scss'
import type { Metadata } from 'next'
import { GoogleTagManager } from '@next/third-parties/google'
import Script from 'next/script'
import { getMetadataBase } from '@/lib/site-url'
import { ToastProvider } from '@/components/providers/toast-provider'
import { AuthProvider } from '@/components/providers/auth-provider'

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
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID
    return (
        <html lang="uk" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
                <Script src="https://secure.wayforpay.com/server/pay-widget.js" strategy="beforeInteractive" />
                <AuthProvider>
                    <ToastProvider>{children}</ToastProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
