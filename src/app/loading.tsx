export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white text-zinc-900">
            <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
                <span className="text-sm font-medium tracking-wide uppercase text-zinc-500">
                    Завантаження
                </span>
            </div>
        </div>
    )
}
