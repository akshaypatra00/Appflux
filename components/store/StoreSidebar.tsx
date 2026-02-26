"use client"

import {
    LayoutGrid,
    Settings,
    LogOut,
    Home,
    Moon,
    Sun,
    PieChart,
    Rocket
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { useTheme } from "next-themes"
import { LogoutModal } from "@/components/LogoutModal"
import { getUserAvatar } from "@/lib/avatar"
import { Button } from "@/components/ui/button"

import { useAuth } from "@/components/auth-provider"

const sidebarItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: LayoutGrid, label: "Apps", href: "/store" },
    { icon: Rocket, label: "Deploy", href: "/deploy" },
    { icon: PieChart, label: "Dashboard", href: "/dashboard" }, // Using Settings temporarily as placeholder or specific Dashboard icon
]

export function StoreSidebar() {
    const pathname = usePathname()
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const { user: userAuth, loading: authLoading } = useAuth()

    useEffect(() => {
        setMounted(true)
        const supabase = createClient()

        const getProfile = async () => {
            if (userAuth) {
                // Set initial avatar from Firebase
                const initialAvatar = userAuth.photoURL || getUserAvatar(userAuth)
                if (initialAvatar) setUserAvatar(initialAvatar)

                try {
                    const res = await fetch(`/api/user/profile?uid=${userAuth.uid}`);
                    if (res.ok) {
                        const profile = await res.json();
                        if (profile?.avatar_url) {
                            setUserAvatar(profile.avatar_url);
                        }
                    }
                } catch (err) {
                    console.error("Sidebar profile fetch error:", err);
                }
            }
        }
        if (!authLoading) {
            getProfile()
        }
    }, [userAuth, authLoading])

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    if (!mounted) {
        return (
            <aside className="fixed left-0 top-0 h-screen w-20 bg-white dark:bg-black border-r border-black/10 dark:border-white/10 flex flex-col items-center py-6 z-40">
                <div className="mb-8 p-1 w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <nav className="flex-1 flex flex-col gap-4 w-full px-4" />
            </aside>
        )
    }

    const isDarkMode = theme === "dark"

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true)
    }

    const confirmLogout = async () => {
        const { signOut: firebaseSignOut } = await import('firebase/auth')
        const { auth } = await import('@/lib/firebase')
        await firebaseSignOut(auth)
        window.location.href = '/'
    }

    return (
        <>
            <aside className="fixed left-0 top-0 h-screen w-20 bg-white dark:bg-black border-r border-black/10 dark:border-white/10 flex flex-col items-center py-6 z-40">
                {/* Top Logo / Avatar Area */}
                {authLoading ? (
                    <div className="mb-8 p-1 w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                ) : userAuth ? (
                    <Link href="/profile" className="mb-8 p-1 rounded-full transition-colors cursor-pointer ring-2 ring-black/10 dark:ring-white/10 hover:ring-black/20 dark:hover:ring-white/20">
                        {userAvatar ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                <img
                                    src={userAvatar.includes('supabase.co') ? `/api/proxy-image?url=${encodeURIComponent(userAvatar)}` : userAvatar}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                <span className="font-bold text-white text-xs">AF</span>
                            </div>
                        )}
                    </Link>
                ) : (
                    <Link href="/sign-in" className="mb-8 w-full px-2" title="Sign In">
                        <Button variant="default" size="sm" className="w-full h-9 px-0 font-medium rounded-xl bg-black text-white dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors">
                            Login
                        </Button>
                    </Link>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 flex flex-col gap-4 w-full px-4">
                    {sidebarItems.map((item, index) => {
                        const isActive = item.href === "/store" ? pathname === "/store" : pathname.startsWith(item.href) && item.href !== "/"

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "p-3 rounded-xl flex items-center justify-center transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                            >
                                <item.icon className="w-5 h-5" />

                                {/* Tooltip on hover */}
                                <span className="absolute left-14 bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="mt-auto flex flex-col gap-4 w-full px-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-xl flex items-center justify-center text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative overflow-hidden"
                    >
                        <div className={cn("transition-transform duration-300 absolute", isDarkMode ? "scale-100 rotate-0" : "scale-0 rotate-90")}>
                            <Moon className="w-5 h-5" />
                        </div>
                        <div className={cn("transition-transform duration-300 absolute", !isDarkMode ? "scale-100 rotate-0" : "scale-0 -rotate-90")}>
                            <Sun className="w-5 h-5" />
                        </div>
                        {/* Placeholder to keep size */}
                        <div className="w-5 h-5 opacity-0"><Moon /></div>
                    </button>

                    <Link
                        href="/settings"
                        className="p-3 rounded-xl flex items-center justify-center text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>

                    {userAuth && (
                        <button
                            onClick={handleLogoutClick}
                            className="p-3 rounded-xl flex items-center justify-center text-black/50 dark:text-white/50 hover:text-red-500 hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:bg-white/5 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </aside>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
        </>
    )
}
