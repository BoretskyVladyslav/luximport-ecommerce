import { GoogleTagManager } from '@next/third-parties/google'

export const metadata = {
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
        <html lang="uk">
            <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID || "GTM-KCB7NCH8"} />
            <body>
                {children}
            </body>
        </html>
    )
}
