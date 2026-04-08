import { ProductGridSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
            <div className="flex items-end justify-between gap-6">
                <div>
                    <div className="h-8 w-48 animate-pulse rounded-md bg-stone-200/70" />
                    <div className="mt-3 h-4 w-24 animate-pulse rounded-md bg-stone-200/70" />
                </div>
                <div className="hidden items-center gap-3 md:flex">
                    <div className="h-4 w-20 animate-pulse rounded-md bg-stone-200/70" />
                    <div className="h-10 w-48 animate-pulse rounded-md bg-stone-200/70" />
                </div>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
                <aside className="hidden lg:block">
                    <div className="space-y-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="h-10 w-full animate-pulse rounded-md bg-stone-100" />
                        ))}
                    </div>
                </aside>
                <main>
                    <ProductGridSkeleton count={12} />
                    <div className="mt-10 flex justify-center">
                        <div className="h-12 w-44 animate-pulse rounded-md bg-stone-200/70" />
                    </div>
                </main>
            </div>
        </div>
    )
}

