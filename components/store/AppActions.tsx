
"use client"

import { Download, Share2 } from "lucide-react"

interface AppActionsProps {
    app: {
        id: string
        name: string
        github_download_url: string | null
    }
}

export function AppActions({ app }: AppActionsProps) {

    const handleShare = () => {
        const url = `${window.location.origin}/store/${app.id}`;
        if (navigator.share) {
            navigator.share({
                title: app.name,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url)
            alert('Link copied to clipboard')
        }
    }

    const handleDownload = async () => {
        // Here we could trigger a download count increment if we had an API for it
        // For now just redirect
        if (app.github_download_url) {

            // Optimistically update or just fire and forget download count
            try {
                await fetch(`/api/apps/download?id=${app.id}`, { method: 'POST' });
            } catch (e) {
                console.error("Failed to track download", e);
            }

            window.open(app.github_download_url, '_blank');
        } else {
            alert("Download link not available");
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <button
                onClick={handleDownload}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
                <Download className="w-5 h-5" />
                Download APK
            </button>
            <button
                onClick={handleShare}
                className="w-full py-3 border border-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
            >
                <Share2 className="w-5 h-5" />
                Share App
            </button>
        </div>
    )
}
