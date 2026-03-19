'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Category {
    title: string
    slug: string
}

export function CategoryNavClient({ categories }: { categories: Category[] }) {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Hide on catalog — the page has its own sidebar + toolbar for navigation
    if (categories.length === 0 || pathname === '/catalog') return null

    return (
        <nav className="hidden border-b border-stone-100 bg-white lg:block">
            <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-3">
                <Link
                    href="/catalog"
                    className={`text-xs uppercase tracking-widest transition-colors ${mounted && pathname === '/catalog'
                            ? 'text-stone-900 underline underline-offset-4'
                            : 'text-stone-400 hover:text-stone-700'
                        }`}
                >
                    Всі товари
                </Link>
                {categories.map((cat) => {
                    const href = `/categories/${cat.slug}`
                    const isActive = mounted && pathname === href
                    return (
                        <Link
                            key={cat.slug}
                            href={href}
                            className={`text-xs uppercase tracking-widest transition-colors ${isActive
                                    ? 'text-stone-900 underline underline-offset-4'
                                    : 'text-stone-400 hover:text-stone-700'
                                }`}
                        >
                            {cat.title}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
