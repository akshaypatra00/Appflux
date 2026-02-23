'use client'

import { motion } from "framer-motion"

export function TopRightLight() {
    return (
        <>
            {/* Large ambient purple glow */}
            <motion.div
                className="pointer-events-none absolute"
                style={{
                    width: "900px",
                    height: "900px",
                    top: "-300px",
                    right: "-300px",
                    background: "#c069ff73",
                    filter: "blur(280px)",
                    borderRadius: "50%",
                }}
                animate={{
                    opacity: [0.35, 0.6, 0.35],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Inner concentrated glow */}
            <motion.div
                className="pointer-events-none absolute"
                style={{
                    width: "420px",
                    height: "420px",
                    top: "-140px",
                    right: "-120px",
                    background: "rgba(192, 105, 255, 0.65)",
                    filter: "blur(160px)",
                    borderRadius: "50%",
                }}
                animate={{
                    opacity: [0.5, 0.85, 0.5],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </>
    )
}
