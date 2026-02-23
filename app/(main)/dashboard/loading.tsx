import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex-1 bg-neutral-50 dark:bg-[#0a0a0a] p-6 overflow-auto min-h-screen text-black dark:text-white">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <Skeleton className="h-4 w-4" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity Skeleton */}
                <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))}
                </div>

                {/* Quick Stats / Top Apps Skeleton */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <div className="grid grid-cols-3 gap-4 h-32 items-end">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className={`w-full rounded-t-md ${i === 1 ? 'h-full' : 'h-2/3'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-4">
                        <Skeleton className="h-6 w-24" />
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-4 w-8" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
