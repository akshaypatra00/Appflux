import { Skeleton } from "@/components/ui/skeleton"

export default function StoreLoading() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white pt-24 pb-20 px-4 sm:px-6">
            {/* Header Skeleton */}
            <div className="max-w-7xl mx-auto mb-12 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Skeleton className="h-12 w-full max-w-md rounded-full" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center">
                        <Skeleton className="w-20 h-20 rounded-2xl mb-6" />
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-6" />
                        <div className="flex gap-2 w-full justify-center">
                            <Skeleton className="w-8 h-8 rounded-xl" />
                            <Skeleton className="w-8 h-8 rounded-xl" />
                            <Skeleton className="w-8 h-8 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
