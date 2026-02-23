'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'

const Spline = dynamic(() => import('@splinetool/react-spline'), {
    ssr: false,
})

export function SplineScene() {
    const [isLoading, setIsLoading] = useState(true)

    return (
        <div className="relative w-full h-full">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                </div>
            )}
            <Spline
                scene="/scene.splinecode"
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
            />
        </div>
    )
}


