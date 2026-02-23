import { StoreSidebar } from "@/components/store/StoreSidebar"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-black dark:text-white flex font-sans selection:bg-black/20 dark:selection:bg-white/20">
            <StoreSidebar />
            <div className="flex-1 ml-20">
                {children}
            </div>
        </div>
    )
}
