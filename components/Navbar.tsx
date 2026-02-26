"use client"

import { ArrowRight } from "lucide-react"
import { MobileNav } from "@/components/MobileNav"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { getUserAvatar } from "@/lib/avatar"

interface NavbarProps {
    user?: any
}

export function Navbar({ user: initialUser }: NavbarProps) {
    const [userAvatar, setUserAvatar] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            if (initialUser) {
                // First try getting from Firebase photoURL or metadata
                const metadataAvatar = initialUser.photoURL || getUserAvatar(initialUser)
                if (metadataAvatar) setUserAvatar(metadataAvatar)

                try {
                    const res = await fetch(`/api/user/profile?uid=${initialUser.uid}`);
                    if (res.ok) {
                        const profile = await res.json();
                        if (profile?.avatar_url) {
                            setUserAvatar(profile.avatar_url);
                        }
                    }
                } catch (err) {
                    console.error("Navbar profile fetch error:", err);
                }
            }
        }
        fetchProfile()
    }, [initialUser, supabase])

    return (
        <nav className="fixed top-6 right-6 z-50">
            <div className="hidden md:flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-2 py-2">
                {[
                    { name: "Home", href: "/" },
                    { name: "Store", href: "/store" },
                    { name: "Pricing", href: "/pricing" },
                    { name: "Deploy", href: "/deploy" },
                    { name: "Dashboard", href: "/dashboard" },
                ].map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="px-4 py-2 text-sm text-white/80 hover:text-white rounded-full hover:bg-white/10 transition"
                    >
                        {item.name}
                    </Link>
                ))}


                {initialUser ? (
                    <Link href="/profile" className="ml-1 pl-1 pr-1 py-1 rounded-full hover:bg-white/10 transition">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                            {userAvatar ? (
                                <img
                                    src={userAvatar.includes('supabase.co') ? `/api/proxy-image?url=${encodeURIComponent(userAvatar)}` : userAvatar}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                    <span className="font-bold text-white text-[10px]">AF</span>
                                </div>
                            )}
                        </div>
                    </Link>
                ) : (
                    <Link href="/sign-in" className="ml-1 px-4 py-2 text-sm rounded-full bg-white text-black font-medium flex items-center gap-1 hover:bg-white/90 transition">
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                )}
            </div>

            <MobileNav user={initialUser} />
        </nav>
    )
}

