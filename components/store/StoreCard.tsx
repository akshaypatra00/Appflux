
import { Download, MoreHorizontal, Share2 } from "lucide-react"
import Image from "next/image"

interface StoreCardProps {
    title: string;
    category: string;
    icon?: React.ReactNode;
    iconUrl?: string; // Add iconUrl support
    color?: string;
    downloadUrl: string;
}

export function StoreCard({ title, category, icon, iconUrl, color = "bg-white", downloadUrl }: StoreCardProps) {
    return (
        <div className="group relative bg-white dark:bg-white/5 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-2xl p-6 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/10 cursor-pointer flex flex-col items-center text-center">

            {/* App Icon */}
            <div className={`w-20 h-20 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg relative overflow-hidden bg-black/5 dark:bg-white/5`}>
                {iconUrl ? (
                    <Image src={iconUrl} alt={title} fill className="object-cover" unoptimized />
                ) : (
                    icon
                )}
            </div>

            {/* Content */}
            <div className="mb-6">
                <h3 className="font-bold text-black dark:text-white text-lg mb-1">{title}</h3>
                <p className="text-black/40 dark:text-white/40 text-sm font-medium px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full inline-block">{category}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto w-full justify-center">
                <button className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="Details">
                    <MoreHorizontal className="w-5 h-5" />
                </button>

                <a
                    href={downloadUrl}
                    className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-600/10 dark:hover:bg-green-400/10 transition-colors"
                    title="Download"
                >
                    <Download className="w-5 h-5" />
                </a>

                <button className="p-2 rounded-xl text-black/40 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-600/10 dark:hover:bg-blue-400/10 transition-colors" title="Share">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {/* Hover Effect Light */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
        </div>
    )
}
