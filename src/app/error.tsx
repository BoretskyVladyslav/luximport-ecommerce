'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-white px-4 text-center text-zinc-900">
            <div className="max-w-md space-y-6">
                <h2 className="text-2xl font-light tracking-tight">Щось пішло не так</h2>
                <p className="text-sm text-zinc-500 leading-relaxed">
                    Вибачте за тимчасові незручності. Будь ласка, спробуйте оновити сторінку.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="inline-flex h-12 items-center justify-center border border-zinc-900 bg-zinc-900 px-8 text-sm font-medium uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                    >
                        Спробувати знову
                    </button>
                    <Link
                        href="/"
                        className="inline-flex h-12 items-center justify-center border border-zinc-200 bg-transparent px-8 text-sm font-medium uppercase tracking-widest text-zinc-900 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                    >
                        На головну
                    </Link>
                </div>
            </div>
        </div>
    )
}