import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-white px-4 text-center text-zinc-900">
            <div className="max-w-md space-y-8">
                <h1 className="text-4xl font-light tracking-tighter">404</h1>
                <div className="space-y-2">
                    <h2 className="text-xl font-medium tracking-tight">Сторінку не знайдено</h2>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Можливо, вона була видалена, переміщена, або ви помилилися в адресі.
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-flex h-12 items-center justify-center border border-zinc-200 bg-transparent px-8 text-sm font-medium uppercase tracking-widest text-zinc-900 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2"
                >
                    На головну
                </Link>
            </div>
        </div>
    )
}
