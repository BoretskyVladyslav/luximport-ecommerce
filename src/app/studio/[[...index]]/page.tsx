import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
    title: 'Sanity Studio',
    description: 'Sanity Studio administration',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

const Studio = dynamic(() => import('./Studio'), { ssr: false })

export default function StudioPage() {
    return <Studio />
}
