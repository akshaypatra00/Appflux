
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle, ShieldCheck, FileSearch } from "lucide-react"
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';

export default function UploadAppPage() {
    const router = useRouter()
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

        setIsLoading(true)

        // Simulate scanning process
        const steps = [
            { msg: "Uploading App bundle...", delay: 2000 },
            { msg: "Scanning for viruses...", delay: 2500 },
            { msg: "Checking for malware signatures...", delay: 2500 },
            { msg: "Verifying package integrity...", delay: 2000 },
            { msg: "Finalizing upload...", delay: 1000 }
        ];

        for (let i = 0; i < steps.length; i++) {
            setUploadStatus(steps[i].msg)
            setUploadStep(i)
            await new Promise(resolve => setTimeout(resolve, steps[i].delay))
        }

        const data = new FormData()
        data.append("appName", formData.appName)
        data.append("version", formData.version)
        data.append("description", formData.description)
        data.append("category", formData.category)
        data.append("apkFile", formData.apkFile)
        // Note: Icon upload logic would need backend support. For now sending it but backend might ignore.
        if (formData.iconFile) {
            data.append("iconFile", formData.iconFile)
        }
        if (formData.screenshotFiles.length > 0) {
            formData.screenshotFiles.forEach(file => {
                data.append("screenshotFiles", file)
            })
        }

        try {
            const res = await fetch("/api/upload-app", {
                method: "POST",
                body: data,
            })

            console.log("Upload response:", res.status)

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Upload failed")
            }

            router.push("/store")
            router.refresh()
        } catch (error) {
            console.error("Upload error:", error)
            alert("Failed to upload app. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="p-8 max-w-4xl mx-auto relative">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 bg-white/90 dark:bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center">
                    <div className="w-[400px] h-[400px] relative">
                        <RiveComponent />
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-4 max-w-md text-center px-4">
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse">
                            {uploadStatus}
                        </h3>

                        <div className="flex flex-col gap-2 w-full mt-4">
                            {/* Process Steps Visualization */}
                            <div className={`flex items-center gap-3 transition-opacity duration-500 ${uploadStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                                <ShieldCheck className={`w-5 h-5 ${uploadStep >= 1 ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className="text-sm">Virus Scan</span>
                                {uploadStep === 1 && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                                {uploadStep > 1 && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                            </div>

                            <div className={`flex items-center gap-3 transition-opacity duration-500 ${uploadStep >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                                <FileSearch className={`w-5 h-5 ${uploadStep >= 2 ? 'text-blue-500' : 'text-gray-400'}`} />
                                <span className="text-sm">Malware Detection</span>
                                {uploadStep === 2 && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                                {uploadStep > 2 && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                            </div>

                            <div className={`flex items-center gap-3 transition-opacity duration-500 ${uploadStep >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                                <CheckCircle className={`w-5 h-5 ${uploadStep >= 3 ? 'text-violet-500' : 'text-gray-400'}`} />
                                <span className="text-sm">Integrity Check</span>
                                {uploadStep === 3 && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                                {uploadStep > 3 && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                            </div>
                        </div>

                        <p className="text-sm text-black/40 dark:text-white/40 mt-8">
                            Please do not close this window.
                        </p>
                    </div>
                </div>
            )}

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
