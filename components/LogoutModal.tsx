"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LogOut, X } from "lucide-react"

interface LogoutModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 flex flex-col items-center text-center"
                    >
                        {/* Blob Effect Background */}
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl pointer-events-none" />

                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 relative z-10">
                            <LogOut className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Text */}
                        <h3 className="text-xl font-bold text-white mb-2 relative z-10">Logging Out?</h3>
                        <p className="text-white/60 text-sm mb-8 relative z-10">
                            Do you really want to logout from your account?
                        </p>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                            <button
                                onClick={onClose}
                                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-lg shadow-red-500/20"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
