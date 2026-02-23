"use client";

import React, { forwardRef, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { IconBrandApple, IconBrandAndroid } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const CircleWrapper = forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "z-10 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-black p-3 shadow-[0_0_20px_-12px_rgba(255,255,255,0.5)]",
                className,
            )}
        >
            {children}
        </div>
    );
});

CircleWrapper.displayName = "CircleWrapper";

export function AnimatedBeamDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const div1Ref = useRef<HTMLDivElement>(null);
    const div2Ref = useRef<HTMLDivElement>(null);
    const div3Ref = useRef<HTMLDivElement>(null);
    const div4Ref = useRef<HTMLDivElement>(null);
    const div5Ref = useRef<HTMLDivElement>(null);
    const div6Ref = useRef<HTMLDivElement>(null);
    const div7Ref = useRef<HTMLDivElement>(null);

    const [logo, setLogo] = useState<'android' | 'apple'>('android');

    useEffect(() => {
        const interval = setInterval(() => {
            setLogo((prev) => (prev === 'android' ? 'apple' : 'android'));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className={cn(
                "relative flex h-[500px] w-full items-center justify-center overflow-hidden bg-black p-10",
            )}
            ref={containerRef}
        >
            <div className="flex h-full w-full max-w-4xl flex-row items-stretch justify-between gap-10">
                <div className="flex flex-col justify-between">
                    <CircleWrapper ref={div1Ref}>
                        <Image src="/github_dark.svg" alt="GitHub" width={24} height={24} className="h-6 w-6" />
                    </CircleWrapper>
                    <CircleWrapper ref={div2Ref}>
                        <Image src="/vscode.svg" alt="VS Code" width={24} height={24} className="h-6 w-6" />
                    </CircleWrapper>
                    <CircleWrapper ref={div3Ref}>
                        <Image src="/android-icon.svg" alt="Android Studio" width={24} height={24} className="h-6 w-6" />
                    </CircleWrapper>
                </div>

                <div className="flex flex-col justify-center">
                    <CircleWrapper ref={div4Ref} className="h-24 w-24 border-white/40 bg-neutral-900 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {logo === 'android' ? (
                                <motion.div
                                    key="android"
                                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <IconBrandAndroid className="h-12 w-12 text-green-500 fill-current" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="apple"
                                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <IconBrandApple className="h-12 w-12 text-white fill-current" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CircleWrapper>
                </div>

                <div className="flex flex-col justify-between">
                    <CircleWrapper ref={div5Ref}>
                        <Image src="/flutter.svg" alt="Flutter" width={24} height={24} className="h-6 w-6" />
                    </CircleWrapper>
                    <CircleWrapper ref={div6Ref}>
                        <Image src="/react_light.svg" alt="React Native" width={24} height={24} className="h-6 w-6" />
                    </CircleWrapper>
                    <CircleWrapper ref={div7Ref}>
                        <Image src="/swift.svg" alt="Swift" width={24} height={24} className="h-6 w-6" />
                    </CircleWrapper>
                </div>
            </div>

            {/* Left to Center Beams */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div1Ref}
                toRef={div4Ref}
                curvature={-50} // Bows Upwards
                endYOffset={-10}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div2Ref}
                toRef={div4Ref}
                curvature={0}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div3Ref}
                toRef={div4Ref}
                curvature={50} // Bows Downwards
                endYOffset={10}
            />

            {/* Right to Center Beams (Directed TO Center) */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div5Ref}
                toRef={div4Ref}
                curvature={-50} // Bows Upwards
                endYOffset={-10}
                reverse={true} // Animate towards center (Right to Left visual flow)?? 
            // Wait, if fromRef is Right and toRef is Center, path is Right->Center.
            // Default animation is Start->End.
            // So animation will flow Right->Center.
            // If I want it to look like inputs flowing in, this is correct.
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div6Ref}
                toRef={div4Ref}
                curvature={0}
                reverse={true}
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={div7Ref}
                toRef={div4Ref}
                curvature={50} // Bows Downwards
                endYOffset={10}
                reverse={true}
            />
        </div>
    );
}
