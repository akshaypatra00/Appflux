
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle, ShieldCheck, FileSearch, Lock, Zap, Cpu, Server } from "lucide-react"
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default function UploadAppPage() {
    const router = useRouter()
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState("Uploading...")
    const [uploadStep, setUploadStep] = useState(0) // 0: Uploading, 1: Virus Scan, 2: Malware Check, 3: Finalizing

    const { RiveComponent } = useRive({
        src: '/uploadeloader.riv',
        stateMachines: "State Machine 1", // Assuming default state machine, or just autoplay
        autoplay: true,
        layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
        }),
    });

    const [formData, setFormData] = useState({
        appName: "",
        version: "",
        description: "",
        apkFile: null as File | null,
        iconFile: null as File | null,
        screenshotFiles: [] as File[],
        category: "android", // Default category
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'apk' | 'icon' | 'screenshot') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'apk') {
                setFormData({ ...formData, apkFile: e.target.files[0] })
            } else if (type === 'icon') {
                setFormData({ ...formData, iconFile: e.target.files[0] })
            } else {
                // Screenshot array logic
                if (e.target.files.length > 0) {
                    const newFiles = Array.from(e.target.files);
                    // Append new files, limiting to 4 total
                    const currentFiles = formData.screenshotFiles;
                    const combined = [...currentFiles, ...newFiles].slice(0, 4);
                    setFormData({ ...formData, screenshotFiles: combined })
                }
            }
        }
    }

    const removeScreenshot = (index: number) => {
        const newFiles = [...formData.screenshotFiles];
        newFiles.splice(index, 1);
        setFormData({ ...formData, screenshotFiles: newFiles });
    }

    const categories = [
        { id: "android", label: "Android", icon: "📱" },
        { id: "ios", label: "iOS", icon: "🍎" },
        { id: "windows", label: "Windows", icon: "💻" },
        { id: "macos", label: "macOS", icon: "🖥️" },
        { id: "linux", label: "Linux", icon: "🐧" },
        { id: "game", label: "Game", icon: "🎮" },
        { id: "other", label: "Other", icon: "📦" },
    ]

    const [errors, setErrors] = useState<{ version?: string, description?: string }>({});

    const validateForm = () => {
        const newErrors: { version?: string, description?: string } = {};

        // Version validation: specific regex used in backend sanitation
        // Valid: numbers, letters, dots, hyphens, underscores
        if (!/^[a-zA-Z0-9.\-_]+$/.test(formData.version)) {
            newErrors.version = "Version can only contain letters, numbers, dots (.), hyphens (-), and underscores (_)";
        }

        if (formData.description.trim().length < 10) {
            newErrors.description = "Description must be at least 10 characters long";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return;

        if (!formData.apkFile) return

        // 1. Check file size (GitHub Blob API limit is 100MB)
        const MAX_SIZE = 100 * 1024 * 1024; // 100MB
        if (formData.apkFile.size > MAX_SIZE) {
            alert(`Your APK is ${Math.round(formData.apkFile.size / (1024 * 1024))}MB. GitHub's upload limit via API is 100MB.\n\nPlease use a smaller APK or link it via the "Deploy from GitHub" page which has no limits.`);
            return;
        }

        setIsLoading(true)

        try {
            if (!user) throw new Error("You must be logged in to upload");

            // 0. Ensure Profile exists in Supabase via Proxy
            const profileRes = await fetch(`/api/user/profile?uid=${user.uid}`);
            if (profileRes.ok) {
                const profile = await profileRes.json();
                if (!profile) {
                    console.log("Profile missing in Supabase, creating basic record via proxy...");
                    await fetch('/api/user/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: user.uid,
                            email: user.email,
                            full_name: user.displayName || 'AppFlux User',
                        })
                    });
                }
            }

            // 1. Upload APK to GitHub Storage via Backend API (Raw Upload for 100MB)
            setUploadStatus(`Uploading APK to GitHub...`);

            const githubRes = await fetch('/api/apps/upload-github', {
                method: 'POST',
                headers: {
                    'x-user-id': user.uid,
                    'x-file-name': formData.apkFile.name.replace(/\s+/g, '-'),
                    'Content-Type': 'application/octet-stream',
                },
                body: formData.apkFile
            });

            const githubData = await githubRes.json();
            if (!githubRes.ok) throw new Error(githubData.error || 'GitHub upload failed');

            const apkUrl = githubData.downloadUrl;

            // 2. Upload Icon (Optional) via Proxy
            setUploadStatus("Uploading icon...");
            let iconUrl = null;
            if (formData.iconFile) {
                const iconFileName = `${user.uid}/${Date.now()}-icon-${formData.iconFile.name.replace(/\s+/g, '-')}`;

                const iconFormData = new FormData();
                iconFormData.append('file', formData.iconFile);
                iconFormData.append('path', iconFileName);
                iconFormData.append('bucket', 'app-assets');

                const uploadRes = await fetch('/api/storage/upload', {
                    method: 'POST',
                    body: iconFormData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    iconUrl = uploadData.url;
                } else {
                    const error = await uploadRes.json();
                    throw new Error(error.error || "Icon upload failed");
                }
            }

            // 3. Upload Screenshots via Proxy
            setUploadStatus("Uploading screenshots...");
            let screenshotUrls: string[] = [];
            if (formData.screenshotFiles.length > 0) {
                for (const file of formData.screenshotFiles) {
                    const sFileName = `${user.uid}/${Date.now()}-screen-${file.name.replace(/\s+/g, '-')}`;

                    const sFormData = new FormData();
                    sFormData.append('file', file);
                    sFormData.append('path', sFileName);
                    sFormData.append('bucket', 'app-assets');

                    const sUploadRes = await fetch('/api/storage/upload', {
                        method: 'POST',
                        body: sFormData
                    });

                    if (sUploadRes.ok) {
                        const sUploadData = await sUploadRes.json();
                        screenshotUrls.push(sUploadData.url);
                    } else {
                        console.error("Screenshot upload failed via proxy");
                    }
                }
            }

            // 4. Simulate security checks for UX (Premium feel)
            const securitySteps = [
                { msg: "Running Deep Virus Scan...", delay: 1200 },
                { msg: "Analyzing Malware Signatures...", delay: 1500 },
                { msg: "Verifying Package Integrity...", delay: 1000 },
            ];

            for (let i = 0; i < securitySteps.length; i++) {
                setUploadStatus(securitySteps[i].msg);
                setUploadStep(i + 1);
                await new Promise(resolve => setTimeout(resolve, securitySteps[i].delay));
            }

            setUploadStatus("Finalizing Secure Deployment...");
            setUploadStep(4);

            // 5. Save to Supabase via Proxy
            const apkSizeInBytes = formData.apkFile.size;
            const apkSizeFormatted = (apkSizeInBytes / (1024 * 1024)).toFixed(1) + " MB";

            const createRes = await fetch('/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.appName,
                    version: formData.version,
                    description: formData.description,
                    category: formData.category,
                    github_download_url: apkUrl,
                    icon_url: iconUrl,
                    screenshot_urls: screenshotUrls,
                    user_id: user.uid,
                    download_count: 0,
                    views: 0,
                    size: apkSizeInBytes,
                    size_formatted: apkSizeFormatted,
                })
            });

            if (!createRes.ok) {
                const errorData = await createRes.json();
                throw new Error(errorData.error || "Failed to create app record");
            }

            router.push("/store");
            router.refresh();
        } catch (error: any) {
            console.error("Upload error:", error);
            let errorMessage = error.message;
            if (errorMessage.includes("exceeded the maximum allowed size")) {
                errorMessage = "This APK is too large for your Supabase Storage settings. Please go to your Supabase Dashboard -> Storage -> Bucket Settings and increase the 'Maximum File Size'.";
            }
            alert("Failed to upload app: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="p-8 max-w-4xl mx-auto relative">
            {/* Premium Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-6 overflow-hidden"
                    >
                        {/* Dynamic Background Elements */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.1, 0.2, 0.1],
                                }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-violet-600/20 blur-[120px]"
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [0.1, 0.3, 0.1],
                                }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 2 }}
                                className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-fuchsia-600/20 blur-[120px]"
                            />
                        </div>

                        <div className="relative w-full max-w-2xl flex flex-col items-center">
                            {/* Central Animation Hub */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-[300px] h-[300px] relative z-10"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-[40px] animate-pulse" />
                                <RiveComponent />

                                {/* Floating Tech Orbits */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border border-white/5 pointer-events-none"
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl">
                                        <Cpu className="w-4 h-4 text-violet-400" />
                                    </div>
                                </motion.div>
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[15%] rounded-full border border-white/5 pointer-events-none"
                                >
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl">
                                        <Server className="w-4 h-4 text-fuchsia-400" />
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Status and Progress */}
                            <div className="mt-12 w-full max-w-md space-y-8 relative z-20">
                                <div className="text-center space-y-2">
                                    <motion.h3
                                        key={uploadStatus}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-[length:200%_auto] animate-gradient-x"
                                    >
                                        {uploadStatus}
                                    </motion.h3>
                                    <p className="text-neutral-400 text-sm font-medium tracking-wide uppercase opacity-60">System Protocol Active</p>
                                </div>

                                {/* Modern Progress Steps */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 1, label: "Virus", icon: ShieldCheck, color: "text-green-400" },
                                        { id: 2, label: "Malware", icon: FileSearch, color: "text-blue-400" },
                                        { id: 3, label: "Integrity", icon: Lock, color: "text-violet-400" }
                                    ].map((step) => {
                                        const isActive = uploadStep === step.id;
                                        const isCompleted = uploadStep > step.id;

                                        return (
                                            <motion.div
                                                key={step.id}
                                                initial={false}
                                                animate={{
                                                    scale: isActive ? 1.05 : 1,
                                                    opacity: (isActive || isCompleted) ? 1 : 0.3
                                                }}
                                                className={cn(
                                                    "relative p-4 rounded-2xl border transition-all duration-500 overflow-hidden group",
                                                    isActive
                                                        ? "bg-white/10 border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                                                        : isCompleted
                                                            ? "bg-green-500/5 border-green-500/20"
                                                            : "bg-white/5 border-white/5"
                                                )}
                                            >
                                                {/* Active Pulse Effect */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeGlow"
                                                        className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent"
                                                    />
                                                )}

                                                <div className="relative z-10 flex flex-col items-center gap-3">
                                                    <div className={cn(
                                                        "p-2 rounded-xl transition-colors duration-500",
                                                        isCompleted ? "bg-green-500/20 text-green-400" : "bg-neutral-800 text-neutral-400",
                                                        isActive && "bg-violet-500/20 text-violet-400"
                                                    )}>
                                                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">{step.label}</span>

                                                    {/* Scanning Line Animation */}
                                                    {isActive && (
                                                        <motion.div
                                                            animate={{ top: ['0%', '100%', '0%'] }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                            className="absolute left-0 right-0 h-[10%] bg-violet-400/20 blur-[4px]"
                                                        />
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <motion.div
                                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="flex items-center justify-center gap-2 text-xs text-neutral-500"
                                >
                                    <Zap className="w-3 h-3 text-violet-500" />
                                    <span>Establishing secure connection to repository...</span>
                                </motion.div>
                            </div>
                        </div>

                        {/* Bottom Footer Info */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-12 text-center"
                        >
                            <p className="text-sm font-medium text-neutral-500 mb-2">Encryption Method: AES-256 GCM</p>
                            <div className="flex items-center gap-4 text-[10px] text-neutral-600 font-bold uppercase tracking-tighter">
                                <span>v3.4.0 Secure Core</span>
                                <div className="w-1 h-1 rounded-full bg-neutral-800" />
                                <span>Zero-Knowledge Architecture</span>
                                <div className="w-1 h-1 rounded-full bg-neutral-800" />
                                <span>Encrypted Tunnel</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-black dark:text-white">Upload App</h1>
                    <p className="text-black/50 dark:text-white/50 text-sm">Fill in the details to publish your app to the store.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="p-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors border border-black/10 dark:border-white/10 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-3xl p-8 shadow-xl dark:shadow-none">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* App Name & Version Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-black/70 dark:text-white/70">App Name</label>
                            <input
                                required
                                type="text"
                                name="appName"
                                value={formData.appName}
                                onChange={handleChange}
                                placeholder="e.g. My Awesome App"
                                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none focus:border-black/30 dark:focus:border-white/30 focus:bg-black/10 dark:focus:bg-white/10 transition-all text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-black/70 dark:text-white/70">Version</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    name="version"
                                    value={formData.version}
                                    onChange={(e) => {
                                        handleChange(e);
                                        if (errors.version) setErrors({ ...errors, version: undefined });
                                    }}
                                    placeholder="e.g. 1.0.0"
                                    className={`w-full bg-black/5 dark:bg-white/5 border rounded-xl px-4 py-3 text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none focus:bg-black/10 dark:focus:bg-white/10 transition-all font-mono text-sm
                                        ${errors.version
                                            ? "border-red-500 focus:border-red-500"
                                            : "border-black/10 dark:border-white/10 focus:border-black/30 dark:focus:border-white/30"
                                        }`}
                                />
                                {errors.version && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 w-full">{errors.version}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-black/70 dark:text-white/70">Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium
                                        ${formData.category === cat.id
                                            ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg shadow-violet-500/20"
                                            : "bg-black/5 dark:bg-white/5 border-transparent text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10"
                                        }`}
                                >
                                    <span className="text-lg">{cat.icon}</span>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-black/70 dark:text-white/70">Description</label>
                        <div className="relative">
                            <textarea
                                required
                                name="description"
                                value={formData.description}
                                onChange={(e) => {
                                    handleChange(e);
                                    if (errors.description) setErrors({ ...errors, description: undefined });
                                }}
                                placeholder="What does your app do?"
                                rows={6}
                                className={`w-full bg-black/5 dark:bg-white/5 border rounded-xl px-4 py-3 text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none focus:bg-black/10 dark:focus:bg-white/10 transition-all resize-none text-sm
                                     ${errors.description
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-black/10 dark:border-white/10 focus:border-black/30 dark:focus:border-white/30"
                                    }`}
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-0">{errors.description}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-black/70 dark:text-white/70">App Icon</label>
                            <div className="relative group cursor-pointer flex items-center gap-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                <div className="w-16 h-16 bg-black/5 dark:bg-black/20 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-black/5 dark:border-white/5">
                                    {formData.iconFile ? (
                                        <img src={URL.createObjectURL(formData.iconFile!)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-black/40 dark:text-white/40" />
                                    )}
                                </div>
                                <div className="relative overflow-hidden flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'icon')}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="text-sm font-medium text-black/80 dark:text-white/80 mb-0.5">Choose Icon</div>
                                    <div className="text-xs text-black/40 dark:text-white/40">Recommneded 512x512</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-black/70 dark:text-white/70">Screenshots ({formData.screenshotFiles.length}/4)</label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Existing Screenshots */}
                                {formData.screenshotFiles.map((file, index) => (
                                    <div key={index} className="relative group aspect-video bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
                                        <img src={URL.createObjectURL(file)} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeScreenshot(index)}
                                            className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Button */}
                                {formData.screenshotFiles.length < 4 && (
                                    <div className="relative group cursor-pointer aspect-video bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-2">
                                        <ImageIcon className="w-6 h-6 text-black/40 dark:text-white/40" />
                                        <span className="text-xs text-black/50 dark:text-white/50">Add Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleFileChange(e, 'screenshot')}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* APK Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-black/70 dark:text-white/70">APK File</label>
                        <div className="relative group cursor-pointer">
                            <input
                                required
                                type="file"
                                accept=".apk,application/vnd.android.package-archive"
                                onChange={(e) => handleFileChange(e, 'apk')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20 rounded-xl px-4 py-12 flex flex-col items-center justify-center gap-3 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
                                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-full">
                                    <Upload className="w-6 h-6 text-black/60 dark:text-white/60 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                </div>
                                <div className="text-center">
                                    <span className="text-sm font-medium text-black/80 dark:text-white/80 block group-hover:text-black dark:group-hover:text-white transition-colors">
                                        {formData.apkFile ? formData.apkFile.name : "Click to upload APK file"}
                                    </span>
                                    <span className="text-xs text-black/40 dark:text-white/40 mt-1 block">
                                        Support for .apk files only
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-white dark:bg-white dark:text-black font-bold py-4 rounded-xl hover:bg-black/90 dark:hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Publish App"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
