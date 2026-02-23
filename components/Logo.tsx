'use client'

import Image from "next/image"

export function Logo() {
    return (
        <div className="fixed top-6 left-6 z-50 flex items-center gap-2">
            <Image
                src="/finlogo.svg"   // your SVG
                alt="AppFlux Logo"
                width={50}
                height={50}
                className="w-10 h-10 md:w-[50px] md:h-[50px]"
                priority
            />
            <span className="text-white text-lg font-semibold tracking-tight">

            </span>
        </div>
    )
}
