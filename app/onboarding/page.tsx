"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Camera, ChevronRight, User, Briefcase, Info, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic';

const positions = [
    "Indie Developer",
    "Company Developer",
    "UI/UX Designer",
    "Product Manager",
    "Mobile Hobbyist",
    "Student",
    "Other"
]

const usageReasons = [
    "Personal Projects",
    "Professional Work",
    "Learning & Exploration",
    "Team Collaboration",
    "Store Browsing"
]

const referralSources = [
    "Twitter / X",
    "GitHub",
    "LinkedIn",
    "Friend / Referral",
    "Search Engine",
    "Other"
]

const GlassInputWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all focus-within:border-violet-500/50 focus-within:bg-violet-500/5", className)}>
        {children}
    </div>
)

import { useAuth } from "@/components/auth-provider"

export default function OnboardingPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState(1)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [prefilledData, setPrefilledData] = useState({
        firstName: '',
        lastName: '',
        username: ''
    })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const supabase = createClient()

    useEffect(() => {
        if (authLoading) return

        if (!user) {
            router.push('/sign-in')
            return
        }

        const checkProfile = async () => {
            try {
                // Fetch from our proxy API
                const res = await fetch(`/api/user/profile?uid=${user.uid}`);
                if (res.ok) {
                    const profile = await res.json();
                    if (profile) {
                        if (profile.avatar_url) setAvatarUrl(profile.avatar_url)

                        setPrefilledData({
                            firstName: profile.first_name || '',
                            lastName: profile.last_name || '',
                            username: profile.username || ''
                        })

                        // If profile is already very complete, skip onboarding
                        if (profile.username && (profile.user_position || profile.platform_usage)) {
                            router.push('/store')
                        }
                    } else {
                        // Case: First time log in via social (no Supabase profile yet)
                        const [firstName, ...lastNames] = (user.displayName || "").split(" ")
                        setAvatarUrl(user.photoURL)
                        setPrefilledData({
                            firstName: firstName || "",
                            lastName: lastNames.join(" ") || "",
                            username: ""
                        })
                    }
                }
            } catch (err) {
                console.error("Profile check error:", err);
            }
        }
        checkProfile()
    }, [user, authLoading, router])

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setIsUploadingAvatar(true)
        try {
            const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
            const { storage } = await import('@/lib/firebase')

            const fileExt = file.name.split('.').pop()
            const fileName = `profiles/${user.uid}/${Date.now()}.${fileExt}`
            const storageRef = ref(storage, fileName)

            await uploadBytes(storageRef, file)
            const publicUrl = await getDownloadURL(storageRef)

            setAvatarUrl(publicUrl)

            // Update Auth Metadata using Firebase logic
            const { updateProfile } = await import('firebase/auth')
            await updateProfile(user, {
                photoURL: publicUrl
            })

            // Update profile in Supabase via proxy
            await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.uid,
                    avatar_url: publicUrl
                })
            });

            toast.success("Avatar uploaded!")
        } catch (error: any) {
            toast.error("Error uploading avatar: " + error.message)
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (step < 3) {
            setStep(step + 1)
            return
        }

        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const username = formData.get('username') as string
        const firstName = formData.get('firstName') as string
        const lastName = formData.get('lastName') as string
        const position = formData.get('position') as string
        const usage = formData.get('usage') as string
        const referral = formData.get('referral') as string

        try {
            if (!user) return

            // If username is empty, we check if it already exists in the profile
            let finalUsername = username;
            if (!finalUsername) {
                const res = await fetch(`/api/user/profile?uid=${user.uid}`);
                if (res.ok) {
                    const profile = await res.json();
                    finalUsername = profile?.username;
                }
            }

            if (!finalUsername) {
                toast.error("Username is required");
                setStep(1);
                setIsLoading(false);
                return;
            }

            // Update profile in Supabase via Proxy
            const updateRes = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.uid,
                    username: finalUsername,
                    first_name: firstName || "",
                    last_name: lastName || "",
                    full_name: `${firstName} ${lastName}`.trim() || "",
                    user_position: position || "",
                    platform_usage: usage || "",
                    referral_source: referral || "",
                    email: user.email || ""
                })
            });

            if (!updateRes.ok) {
                const errorData = await updateRes.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            // Sync with Firebase Auth metadata
            const { updateProfile } = await import('firebase/auth')
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`.trim()
            })

            toast.success("Welcome aboard!")
            router.push('/store')
        } catch (error: any) {
            console.error("Onboarding error:", error);
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-geist">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/20 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-xl relative z-10">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                        <Image src="/finlogo.svg" alt="AppFlux" width={40} height={40} />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to AppFlux</h1>
                    <p className="text-neutral-400">Let's personalize your experience</p>
                </div>

                <div className="flex gap-2 mb-8 px-12">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={cn(
                                "h-1.5 flex-1 rounded-full transition-all duration-500",
                                step >= s ? "bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" : "bg-white/10"
                            )}
                        />
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 min-h-[400px]">
                    {step === 1 && (
                        <div key={prefilledData.username || 'initial'} className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex flex-col items-center gap-4">
                                <div
                                    onClick={handleAvatarClick}
                                    className="group relative w-32 h-32 rounded-[2rem] overflow-hidden cursor-pointer bg-white/5 border-2 border-dashed border-violet-500/30 hover:border-violet-500 transition-all flex items-center justify-center shadow-2xl shadow-violet-500/10"
                                >
                                    {avatarUrl ? (
                                        <Image src={avatarUrl} alt="Avatar" fill className="object-cover group-hover:opacity-50 transition-opacity" unoptimized />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <User className="w-10 h-10 text-white/20 group-hover:text-violet-500 transition-colors" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isUploadingAvatar ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                                        ) : (
                                            <>
                                                <Camera className="w-6 h-6 text-white mb-1" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Change</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-white mb-1">Upload Photo</p>
                                    <p className="text-xs text-neutral-500 tracking-tight">Help people recognize you</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300 ml-1">First Name</label>
                                    <GlassInputWrapper>
                                        <input
                                            required
                                            name="firstName"
                                            placeholder="John"
                                            defaultValue={prefilledData.firstName}
                                            className="w-full bg-transparent p-4 text-sm focus:outline-none"
                                        />
                                    </GlassInputWrapper>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300 ml-1">Last Name</label>
                                    <GlassInputWrapper>
                                        <input
                                            required
                                            name="lastName"
                                            placeholder="Doe"
                                            defaultValue={prefilledData.lastName}
                                            className="w-full bg-transparent p-4 text-sm focus:outline-none"
                                        />
                                    </GlassInputWrapper>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 ml-1">Username</label>
                                <GlassInputWrapper>
                                    <input
                                        required
                                        name="username"
                                        placeholder="johndoe"
                                        defaultValue={prefilledData.username}
                                        minLength={3}
                                        className="w-full bg-transparent p-4 text-sm focus:outline-none"
                                    />
                                </GlassInputWrapper>
                                <p className="text-[10px] text-neutral-500 ml-2">Unique handle for your public profile</p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 ml-1">
                                        <Briefcase className="w-4 h-4 text-violet-500" />
                                        What is your current position?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {positions.map((p) => (
                                            <label
                                                key={p}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer group"
                                            >
                                                <input required type="radio" name="position" value={p} className="w-4 h-4 accent-violet-500" />
                                                <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 ml-1">
                                        <Info className="w-4 h-4 text-violet-500" />
                                        How do you plan to use AppFlux?
                                    </label>
                                    <div className="space-y-3">
                                        {usageReasons.map((reason) => (
                                            <label
                                                key={reason}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer group"
                                            >
                                                <input required type="radio" name="usage" value={reason} className="w-4 h-4 accent-violet-500" />
                                                <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">{reason}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 ml-1">
                                        <MessageSquare className="w-4 h-4 text-violet-500" />
                                        Where did you hear about us?
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {referralSources.map((source) => (
                                            <label
                                                key={source}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer group"
                                            >
                                                <input required type="radio" name="referral" value={source} className="w-4 h-4 accent-violet-500" />
                                                <span className="text-sm text-neutral-400 group-hover:text-white transition-colors">{source}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-8 text-center bg-white/5 rounded-3xl p-8 border border-white/5">
                                    <p className="text-lg font-medium mb-3">Almost there!</p>
                                    <p className="text-sm text-neutral-500">By clicking complete, you agree to our terms of service and and community guidelines.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(step - 1)}
                                className="flex-1 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-medium"
                            >
                                Back
                            </button>
                        )}
                        <button
                            disabled={isLoading}
                            className="flex-[2] py-4 rounded-2xl bg-white text-black hover:bg-neutral-200 transition-all font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {step === 3 ? "Complete Setup" : "Continue"}
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <p className="absolute bottom-10 text-[10px] text-zinc-600 tracking-widest uppercase">
                &copy;
            </p>
        </div>
    )
}
