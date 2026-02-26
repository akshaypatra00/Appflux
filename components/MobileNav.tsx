'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"

interface MobileNavProps {
    user?: any
}

export function MobileNav({ user }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    const toggleMenu = () => setIsOpen(!isOpen)

    const handleSignOut = async () => {
        const { signOut: firebaseSignOut } = await import('firebase/auth')
        const { auth } = await import('@/lib/firebase')
        await firebaseSignOut(auth)
        setIsOpen(false)
        window.location.reload()
    }

    return (
        <div className="md:hidden">
            <button
                onClick={toggleMenu}
                className="p-2 text-white/80 hover:text-white transition"
                aria-label="Toggle menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center"
                    >
                        <button
                            onClick={toggleMenu}
                            className="absolute top-6 right-6 p-2 text-white/80 hover:text-white transition"
                            aria-label="Close menu"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        <div className="flex flex-col gap-6 w-full max-w-md px-6 text-center">
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
                                    onClick={() => setIsOpen(false)}
                                    className="text-2xl font-medium text-white/70 hover:text-white transition"
                                >
                                    {item.name}
                                </Link>
                            ))}

                            <div className="h-px bg-white/10 my-4 w-full" />

                            {user ? (
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-8 py-4 text-lg rounded-full bg-red-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition"
                                >
                                    Log out
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full px-8 py-4 text-lg rounded-full bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition"
                                >
                                    Sign up
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
