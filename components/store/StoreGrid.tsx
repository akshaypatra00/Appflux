
"use client"

import { useState, useEffect } from "react"
import { StoreCard } from "@/components/store/StoreCard"
import { Search, Filter, Box, UploadCloud } from "lucide-react"
import Link from "next/link"

interface AppData {
    id: string
    name: string
    version: string
    description: string
    download_count: number
    icon_url?: string
    screenshot_url?: string // legacy support
    screenshot_urls?: string[]
    malicious_status?: 'safe' | 'warning' | 'danger'
    category?: string
}

const filterCategories = [
    { id: "all", label: "All Apps" },
    { id: "android", label: "Android" },
    { id: "ios", label: "iOS" },
    { id: "windows", label: "Windows" },
    { id: "macos", label: "macOS" },
    { id: "linux", label: "Linux" },
    { id: "game", label: "Games" },
    { id: "other", label: "Other" },
]

interface StoreGridProps {
    initialApps: AppData[]
}

export function StoreGrid({ initialApps }: StoreGridProps) {
    const [apps, setApps] = useState<AppData[]>(initialApps)
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Sync state with props when server data refreshes
    useEffect(() => {
        setApps(initialApps)
    }, [initialApps])

    const filteredApps = apps.filter(app => {
        const matchesCategory = selectedCategory === "all" || app.category?.toLowerCase() === selectedCategory.toLowerCase()
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <>
            {/* Header / Search Area */}
            <header className="flex items-center justify-between mb-12 max-w-7xl mx-auto pt-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30 dark:text-white/30" />
                    <input
                        type="text"
                        placeholder="Search apps, plugins, and more..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/5 dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-full py-3 pl-12 pr-4 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:border-black/20 dark:focus:border-white/20 focus:bg-black/10 dark:focus:bg-[#111] transition-all"
                    />
                </div>

                <div className="flex gap-3">
                    <Link href="/store/upload" className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-medium text-sm rounded-full hover:bg-black/90 dark:hover:bg-white/90 transition-colors">
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload App</span>
                    </Link>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-full transition-colors ${selectedCategory !== 'all'
                                ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                                : 'bg-white dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-[#111]'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>{filterCategories.find(c => c.id === selectedCategory)?.label || "Filter"}</span>
                        </button>

                        {isFilterOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-20 py-1">
                                    {filterCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                setSelectedCategory(cat.id)
                                                setIsFilterOpen(false)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${selectedCategory === cat.id
                                                ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium'
                                                : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                                }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Grid */}
            {filteredApps && filteredApps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
                    {filteredApps.map((app) => (
                        <Link href={`/store/${app.id}`} key={app.id} className="block">
                            <StoreCard
                                title={app.name}
                                category={app.category || app.version}
                                icon={<div className="font-bold text-xl text-white">{app.name.substring(0, 2).toUpperCase()}</div>}
                                iconUrl={app.icon_url}
                                downloadUrl={`/api/download/${app.id}`}
                                color="text-black dark:text-white"
                            />
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-black/30 dark:text-white/30">
                    <Box className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-xl font-medium">
                        {selectedCategory === 'all' ? "No apps found" : `No ${filterCategories.find(c => c.id === selectedCategory)?.label} found`}
                    </p>
                    <p className="text-sm mt-2">
                        {selectedCategory === 'all' ? "Upload an app to get started." : "Try choosing a different category."}
                    </p>
                </div>
            )}
        </>
    )
}
