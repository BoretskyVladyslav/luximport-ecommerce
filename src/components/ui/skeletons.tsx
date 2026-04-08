export function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-stone-200/70 ${className}`} aria-hidden />
}

export function ProductCardSkeleton() {
    return (
        <div className="flex h-full flex-col bg-white">
            <div className="relative mb-4 aspect-square w-full overflow-hidden bg-stone-100">
                <Skeleton className="absolute inset-0 rounded-none" />
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                    <Skeleton className="h-5 w-24 rounded-sm" />
                </div>
                <Skeleton className="absolute right-4 top-4 h-8 w-8 rounded-full" />
            </div>
            <div className="flex flex-1 flex-col px-6 pb-6">
                <Skeleton className="mb-3 h-3 w-28 rounded-sm" />
                <Skeleton className="mb-2 h-4 w-full rounded-sm" />
                <Skeleton className="mb-5 h-4 w-3/4 rounded-sm" />
                <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                    <Skeleton className="h-6 w-24 rounded-sm" />
                    <Skeleton className="h-9 w-28 rounded-sm" />
                </div>
            </div>
        </div>
    )
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function ProductDetailSkeleton() {
    return (
        <main className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-stone-100">
                    <Skeleton className="absolute inset-0 rounded-none" />
                </div>
                <div className="flex flex-col justify-center gap-6">
                    <Skeleton className="h-3 w-40 rounded-sm" />
                    <Skeleton className="h-10 w-4/5 rounded-sm" />
                    <Skeleton className="h-6 w-28 rounded-sm" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full rounded-sm" />
                        <Skeleton className="h-4 w-11/12 rounded-sm" />
                        <Skeleton className="h-4 w-10/12 rounded-sm" />
                    </div>
                    <div className="border-t border-stone-100 pt-6">
                        <Skeleton className="h-8 w-32 rounded-sm" />
                        <Skeleton className="mt-2 h-3 w-48 rounded-sm" />
                    </div>
                    <Skeleton className="h-14 w-full rounded-md" />
                    <div className="border-t border-stone-100 pt-4">
                        <Skeleton className="h-3 w-56 rounded-sm" />
                        <Skeleton className="mt-2 h-3 w-44 rounded-sm" />
                        <Skeleton className="mt-2 h-3 w-40 rounded-sm" />
                    </div>
                </div>
            </div>
        </main>
    )
}

export function OrdersListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white px-5 py-4">
                    <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-44 rounded-sm" />
                        <Skeleton className="mt-2 h-3 w-28 rounded-sm" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-24 rounded-sm" />
                        <Skeleton className="h-4 w-20 rounded-sm" />
                    </div>
                </div>
            ))}
        </div>
    )
}

