'use client'

import { useEffect, useRef } from "react"

interface Particle {
    x: number
    y: number
    ox: number
    oy: number
    vx: number
    vy: number
    size: number
}

export function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particles = useRef<Particle[]>([])
    const mouse = useRef({ x: -1000, y: -1000 })

    useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext("2d")!

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            init()
        }

        const init = () => {
            particles.current = []
            const count = Math.floor(canvas.width * canvas.height * 0.00025)

            for (let i = 0; i < count; i++) {
                const x = Math.random() * canvas.width
                const y = Math.random() * canvas.height
                particles.current.push({
                    x, y, ox: x, oy: y, vx: 0, vy: 0, size: Math.random() * 2 + 0.5
                })
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            for (const p of particles.current) {
                const dx = mouse.current.x - p.x
                const dy = mouse.current.y - p.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 160) {
                    p.vx -= dx / dist
                    p.vy -= dy / dist
                }

                p.vx += (p.ox - p.x) * 0.04
                p.vy += (p.oy - p.y) * 0.04
                p.vx *= 0.88
                p.vy *= 0.88
                p.x += p.vx
                p.y += p.vy

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = "rgba(255,255,255,0.6)"
                ctx.fill()
            }

            requestAnimationFrame(animate)
        }

        window.addEventListener("mousemove", e => {
            mouse.current = { x: e.clientX, y: e.clientY }
        })

        resize()
        animate()
        window.addEventListener("resize", resize)

        return () => window.removeEventListener("resize", resize)
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0"
        />
    )
}
