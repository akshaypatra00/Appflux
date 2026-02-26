"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X,
    Bell,
    CheckCircle2,
    AlertCircle,
    Info,
    Clock,
    Trash2,
    Check
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Notification {
    id: string
    title: string
    message: string
    type: string
    is_read: boolean
    created_at: string
}

interface NotificationPanelProps {
    isOpen: boolean
    onClose: () => void
    userId: string
}

export function NotificationPanel({ isOpen, onClose, userId }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications()
        }
    }, [isOpen, userId])

    const fetchNotifications = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/notifications?uid=${userId}`)
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
        }
        setIsLoading(false)
    }

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, uid: userId })
            })
            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, is_read: true } : n)
                )
            }
        } catch (err) {
            console.error("Failed to mark notification as read:", err)
        }
    }

    const markAllRead = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: userId, all: true })
            })
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            }
        } catch (err) {
            console.error("Failed to mark all notifications as read:", err)
        }
    }

    const deleteNotification = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id))
            }
        } catch (err) {
            console.error("Failed to delete notification:", err)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
            case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />
            default: return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-sm bg-neutral-900/95 backdrop-blur-md border-l border-white/10 shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-violet-500" />
                                <h2 className="text-xl font-bold text-white">Notifications</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Actions */}
                        {notifications.length > 0 && (
                            <div className="px-6 py-3 border-b border-white/10 flex justify-between items-center text-xs">
                                <span className="text-neutral-500">
                                    {notifications.filter(n => !n.is_read).length} Unread
                                </span>
                                <button
                                    onClick={markAllRead}
                                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                                >
                                    Mark all as read
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-500">
                                    <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    <span>Loading notifications...</span>
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => !n.is_read && markAsRead(n.id)}
                                            className={cn(
                                                "p-6 transition-all relative group cursor-pointer",
                                                !n.is_read ? "bg-violet-500/5" : "hover:bg-white/5"
                                            )}
                                        >
                                            {!n.is_read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />
                                            )}

                                            <div className="flex gap-4">
                                                <div className="shrink-0 mt-1">
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={cn(
                                                            "text-sm font-semibold truncate",
                                                            !n.is_read ? "text-white" : "text-neutral-300"
                                                        )}>
                                                            {n.title}
                                                        </h3>
                                                        <span className="text-[10px] text-neutral-500 whitespace-nowrap ml-2">
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                                                        {n.message}
                                                    </p>

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                deleteNotification(n.id)
                                                            }}
                                                            className="text-[10px] flex items-center gap-1 text-neutral-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Remove
                                                        </button>
                                                        {!n.is_read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    markAsRead(n.id)
                                                                }}
                                                                className="text-[10px] flex items-center gap-1 text-violet-400 hover:text-violet-300 transition-colors"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                                Mark read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-12 text-center text-neutral-500 gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                                        <Bell className="w-8 h-8 text-neutral-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-semibold text-white">All caught up!</p>
                                        <p className="text-sm">No new notifications at the moment.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-black/20">
                            <button
                                className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs text-neutral-400 font-medium"
                                onClick={onClose}
                            >
                                Close Panel
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
