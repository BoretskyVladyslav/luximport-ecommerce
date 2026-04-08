import { ProductEightGridSkeleton, Skeleton } from '@/components/ui/skeletons'

export default function Loading() {
    return (
        <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="mb-10">
                <Skeleton className="h-10 w-48 max-w-full" />
                <Skeleton className="mt-3 h-4 w-32" />
            </div>
            <ProductEightGridSkeleton />
        </div>
    )
}
