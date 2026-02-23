"use client"

import React, { useRef } from "react"
import { useScroll, useTransform, motion, MotionValue } from "framer-motion"

export const ContainerScroll = ({
    titleComponent,
    children,
}: {
    titleComponent: string | React.ReactNode
    children: React.ReactNode
}) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"], // CRITICAL: This triggers the animation as you scroll through the component
    })

    // Adjusted values for a smoother, more noticeable effect
    const rotate = useTransform(scrollYProgress, [0, 1], [20, 0])
    const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1])
    const translate = useTransform(scrollYProgress, [0, 1], [0, -100])

    return (
        <div
            ref={containerRef}
            // HEIGHT IS CRITICAL: h-[60rem]/h-[80rem] forces the page to be scrollable
            className="h-[40rem] md:h-[60rem] flex items-center justify-center relative p-2 md:p-10"
        >
            <div
                // sticky: keeps the card in view while the background scrolls
                className="py-10 w-full relative flex flex-col items-center sticky top-0"
                style={{
                    perspective: "1000px",
                }}
            >
                <Header translate={translate} titleComponent={titleComponent} />

                <Card rotate={rotate} translate={translate} scale={scale}>
                    {children}
                </Card>
            </div>
        </div>
    )
}

const Header = ({ translate, titleComponent }: any) => {
    return (
        <motion.div
            style={{
                translateY: translate,
            }}
            className="div max-w-5xl mx-auto text-center"
        >
            {titleComponent}
        </motion.div>
    )
}

const Card = ({
    rotate,
    scale,
    translate,
    children,
}: {
    rotate: MotionValue<number>
    scale: MotionValue<number>
    translate: MotionValue<number>
    children: React.ReactNode
}) => {
    return (
        <motion.div
            style={{
                rotateX: rotate, // This controls the 3D tilt
                scale,           // This controls the zoom
                boxShadow:
                    "0 0 #912bda95, 0 9px 20px #c069ff73, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
            }}
            className="
        max-w-3xl 
        -mt-12 
        mx-auto 
        h-[20rem] 
        md:h-[30rem] 
        w-full 
        border-4 border-[#6C6C6C] 
        p-2 md:p-6 
        bg-[#222222] 
        rounded-[30px] 
        shadow-2xl
      "
        >
            <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4">
                {children}
            </div>
        </motion.div>
    )
}