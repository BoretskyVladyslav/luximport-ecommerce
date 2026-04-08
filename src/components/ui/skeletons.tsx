import { cn } from '@/lib/utils'

export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-zinc-200/50', className)}
            aria-hidden
        />
    )
}

export function ProductCardSkeleton() {
    return (
        <div className="flex h-full flex-col bg-white">
            <div className="relative mb-4 aspect-square w-full overflow-hidden bg-zinc-100">
                <Skeleton className="absolute inset-0 rounded-none" />
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                    <Skeleton className="h-5 w-24 rounded-sm" />
                </div>
                <Skeleton className="absolute right-4 top-4 h-8 w-8 rounded-full" />
            </div>
            <div className="flex flex-1 flex-col px-6 pb-6">
                <Skeleton className="mb-3 h-3 w-28 rounded-sm" />
                <Skeleton className="mb-2 h-4 w-full rounded-sm" />
                <Skeleton className="mb-2 h-4 w-3/4 rounded-sm" />
                <Skeleton className="mb-3 h-3 w-20 rounded-sm" />
                <div className="mt-auto flex items-center justify-between gap-4 border-t border-transparent pt-6">
                    <Skeleton className="h-7 w-24 rounded-sm" />
                    <Skeleton className="h-9 min-w-[7rem] rounded-sm" />
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

export function ProductEightGridSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    )
}

export function CatalogPageSkeleton() {
    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
            <div className="flex items-end justify-between gap-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="mt-3 h-4 w-24" />
                </div>
                <div className="hidden items-center gap-3 md:flex">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-48" />
                </div>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
                <aside className="hidden lg:block">
                    <div className="space-y-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-md" />
                        ))}
                    </div>
                </aside>
                <main>
                    <ProductGridSkeleton count={12} />
                    <div className="mt-10 flex justify-center">
                        <Skeleton className="h-12 w-44" />
                    </div>
                </main>
            </div>
        </div>
    )
}

export function HomeBestSellersSkeleton({ count = 4 }: { count?: number }) {
    return (
        <section className="border-b border-zinc-200 bg-zinc-50 px-4 py-24">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center">
                    <Skeleton className="mx-auto mb-4 h-3 w-40" />
                    <Skeleton className="mx-auto h-12 w-72 max-w-full md:h-14" />
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: count }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export function CategoryPageSkeleton() {
    return (
        <main className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12">
                <Skeleton className="h-12 w-64 max-w-full md:h-14" />
                <Skeleton className="mt-4 h-4 w-full max-w-xl" />
                <Skeleton className="mt-2 h-3 w-32" />
            </div>
            <ProductEightGridSkeleton />
        </main>
    )
}

export function ProfileOrderCardSkeleton() {
    return (
        <div className="flex min-h-[220px] w-full flex-col gap-5 border border-zinc-200 bg-white p-8 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-28" />
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <div className="flex w-full justify-between gap-1 pt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                        <div className="flex w-full items-center">
                            <span className="invisible h-0.5 min-w-[6px] flex-1" aria-hidden />
                            <Skeleton className="size-3 shrink-0 rounded-full" />
                            <span className="invisible h-0.5 min-w-[6px] flex-1" aria-hidden />
                        </div>
                        <Skeleton className="h-6 w-full max-w-[4.5rem]" />
                    </div>
                ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
                <Skeleton className="h-9 w-52 max-w-full" />
                <Skeleton className="h-9 w-28" />
            </div>
        </div>
    )
}

export function ProfilePageSkeleton() {
    return (
        <div className="min-h-screen border-t border-zinc-200 bg-white">
            <div className="mb-12 border-b border-zinc-200 px-6 py-16 md:px-16">
                <Skeleton className="mb-12 h-12 w-full max-w-md md:h-16" />
                <div className="grid grid-cols-1 gap-px border border-zinc-200 bg-zinc-200 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white p-8">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="mt-2 h-3 w-28" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="px-6 pb-16 md:px-16">
                <div className="mb-12 flex gap-8 border-b border-zinc-200 pb-6">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="mb-10 flex flex-wrap gap-4 border-b border-zinc-200 pb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24" />
                    ))}
                </div>
                <div className="flex flex-col gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <ProfileOrderCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export function StorefrontPageSkeleton() {
    return (
        <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-10 px-6 py-20">
            <div
                className="h-14 w-14 rounded-full border-2 border-zinc-200 border-t-zinc-800 animate-spin"
                aria-hidden
            />
            <div className="flex w-full max-w-lg flex-col items-center gap-4">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-full max-w-md" />
                <Skeleton className="h-3 w-3/4 max-w-sm" />
            </div>
        </div>
    )
}

export function ProductDetailSkeleton() {
    return (
        <main className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100">
                    <Skeleton className="absolute inset-0 rounded-none" />
                </div>
                <div className="flex flex-col justify-center gap-6">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-10 w-4/5" />
                    <Skeleton className="h-6 w-28" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-10/12" />
                    </div>
                    <div className="border-t border-zinc-100 pt-6">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="mt-2 h-3 w-48" />
                    </div>
                    <Skeleton className="h-14 w-full rounded-md" />
                    <div className="border-t border-zinc-100 pt-4">
                        <Skeleton className="h-3 w-56" />
                        <Skeleton className="mt-2 h-3 w-44" />
                        <Skeleton className="mt-2 h-3 w-40" />
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
                <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white px-5 py-4"
                >
                    <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="mt-2 h-3 w-28" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
            ))}
        </div>
    )
}
