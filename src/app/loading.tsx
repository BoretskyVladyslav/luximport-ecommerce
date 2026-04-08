export default function Loading() {
    return (
        <div className="min-h-[100dvh] bg-white">
            <div className="mx-auto w-full max-w-7xl px-6 py-16">
                <div className="animate-pulse">
                    <div className="h-6 w-44 rounded-md bg-stone-200/70" />
                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex h-full flex-col bg-white">
                                <div className="relative mb-4 aspect-square w-full overflow-hidden bg-stone-100">
                                    <div className="absolute inset-0 bg-stone-200/70" />
                                    <div className="absolute left-4 top-4 h-5 w-24 rounded-sm bg-stone-300/60" />
                                    <div className="absolute right-4 top-4 h-8 w-8 rounded-full bg-stone-300/60" />
                                </div>
                                <div className="flex flex-1 flex-col px-6 pb-6">
                                    <div className="mb-3 h-3 w-28 rounded-sm bg-stone-200/70" />
                                    <div className="mb-2 h-4 w-full rounded-sm bg-stone-200/70" />
                                    <div className="mb-5 h-4 w-3/4 rounded-sm bg-stone-200/70" />
                                    <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                                        <div className="h-6 w-24 rounded-sm bg-stone-200/70" />
                                        <div className="h-9 w-28 rounded-sm bg-stone-200/70" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
