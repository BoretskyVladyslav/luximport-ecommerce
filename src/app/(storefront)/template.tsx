'use client'

import { PageTransition } from '@/components/PageTransition'

export default function Template({ children }: { children: React.ReactNode }) {
    return <PageTransition className="flex min-h-0 flex-1 flex-col">{children}</PageTransition>
}
