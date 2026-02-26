
"use client"

import { useState } from "react"
import Image from "next/image"

interface SmartIconProps {
    src?: string;
    name: string;
    className?: string;
}

export function SmartIcon({ src, name, className = "" }: SmartIconProps) {
    const [error, setError] = useState(false);

    if (src && !error) {
        return (
            <img
                src={src.includes('supabase.co') ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src}
                alt={name}
                className={`w-full h-full object-cover ${className}`}
                onError={() => setError(true)}
            />
        );
    }

    return (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-4xl font-bold ${className}`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}
