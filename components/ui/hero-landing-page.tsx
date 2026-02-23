"use client"

import { ArrowRight } from "lucide-react"
import { useEffect, useRef } from "react"
import { Navbar } from "@/components/Navbar"
import { Logo } from "@/components/Logo"
import { ParticleCanvas } from "./particle-canvas"
import { SplineScene } from "@/components/SplineScene"
import { motion } from "framer-motion"
import { ContainerScroll } from "@/components/container-scroll-animation"
import { FeaturesSectionWithHoverEffects } from "@/components/feature-section-with-hover-effects"
import { TextHoverEffect } from "@/components/hover-footer"
import { AnimatedBeamDemo } from "@/components/animated-beam-demo"
import Image from "next/image"
import Link from "next/link"

function useLiquidCursor() {
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const r = useRef({ x: 0, y: 0 })
  const d = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", move)

    let raf: number
    const loop = () => {
      r.current.x += (mouse.current.x - r.current.x) * 0.12
      r.current.y += (mouse.current.y - r.current.y) * 0.12
      d.current.x += (mouse.current.x - d.current.x) * 0.3
      d.current.y += (mouse.current.y - d.current.y) * 0.3

      if (ring.current && dot.current) {
        ring.current.style.transform = `translate(${r.current.x - 18}px, ${r.current.y - 18}px)`
        dot.current.style.transform = `translate(${d.current.x - 4}px, ${d.current.y - 4}px)`
      }

      raf = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", move)
    }
  }, [])

  return { ring, dot }
}

export function TuringLanding({ user }: { user?: any }) {
  const { ring, dot } = useLiquidCursor()

  return (
    <div className="relative bg-black text-white overflow-x-hidden">

      {/* Ambient Glow */}
      <motion.div
        className="pointer-events-none absolute z-0"
        style={{
          width: "900px",
          height: "900px",
          top: "-320px",
          right: "-320px",
          background: "rgba(192, 105, 255, 0.45)",
          filter: "blur(280px)",
          borderRadius: "50%",
        }}
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <ParticleCanvas />

      <div ref={ring} className="fixed top-0 left-0 z-[9999] h-9 w-9 rounded-full border border-white/30 pointer-events-none" />
      <div ref={dot} className="fixed top-0 left-0 z-[9999] h-2 w-2 rounded-full bg-white pointer-events-none" />

      <Logo />
      <Navbar user={user} />

      {/* HERO SECTION */}
      {/* HERO SECTION */}
      <main className="relative z-10 w-full flex items-center pt-32 md:pt-10 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 w-full h-full items-center px-6 md:px-12 lg:px-20 gap-16 md:gap-10 overflow-visible">

          {/* Left Side: Text Content */}
          <div className="lg:col-span-2 flex flex-col justify-center z-20">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              Accelerate your <br />
              <span className="text-white/50">Application deployment</span>
            </h1>

            <p className="text-white/60 text-base md:text-lg leading-relaxed mb-8 max-w-md">
              The free alternative to app stores. Publish instantly,
              download securely, and connect with a community of indie
              developers building the next generation of apps.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs md:text-sm font-medium text-white/50 mb-8">
              <div className="flex items-center gap-1.5">
                <span className="text-violet-500 font-bold">✓</span>
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-violet-500 font-bold">✓</span>
                <span>Instant publishing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-violet-500 font-bold">✓</span>
                <span>Zero fees</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href={user ? "/dashboard" : "/sign-in"} className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:scale-105 transition-transform flex items-center gap-2">
                {user ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button className="px-6 py-2.5 rounded-full border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                View Demo
              </button>
            </div>
          </div>

          {/* Right Side: Spline Container (Fixed Overlap/Clipping) */}
          <div className="hidden md:flex lg:col-span-3 relative w-full h-[50vh] lg:h-[80vh] items-center justify-center overflow-visible">
            {/* 1. Removed 'origin-center' to prevent clipping when scaling.
                2. Used 'absolute' and 'w-[120%]' to allow the model to bleed out of 
                   its grid cell, preventing the "cut-off" box look.
                3. Reduced scale slightly to 85% for a cleaner fit.
             */}
            <div className="absolute inset--5 w-[150%] h-full scale-[0.6] md:scale-[0.70] lg:translate-x-0 lg:translate-y-2 z-2">
              <SplineScene />
            </div>
          </div>
        </div>
      </main>

      {/* DASHBOARD SECTION */}
      <section className="relative z-10 bg-black pt-0 pb-10">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center mb-10">
              <h2 className="text-2xl md:text-4xl font-semibold text-white text-center">
                Unleash the power of
              </h2>
              <span className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
                Your Skill
              </span>
            </div>
          }
        >
          <Image
            src="/dashimg.png"
            alt="dashboard"
            height={800}
            width={1200}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </ContainerScroll>
      </section>

      {/* ANIMATED BEAM SECTION */}
      <section className="relative z-10 bg-black py-20 overflow-hidden">
        <div className="flex flex-col items-center justify-center mb-10 text-center px-4">
          <h2 className="text-4xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Connect. Build. <span className="text-[#c069ff73]">Deploy</span>
          </h2>
          <p className="text-white/60 max-w-lg">
            Connect your favorite tools and deploy instantly.
          </p>
        </div>
        <AnimatedBeamDemo />
      </section>

      {/* FEATURES SECTION */}
      <section className="relative z-10 bg-black py-20">
        <div className="flex flex-col items-center justify-center mb-16 text-center px-4">
          <h2 className="text-4xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Powerful Features
          </h2>
          <p className="text-white/60 max-w-lg text-lg">
            Everything you need to build, deploy, and scale your applications with speed and confidence.
          </p>
        </div>
        <FeaturesSectionWithHoverEffects />
      </section>

      {/* FOOTER SECTION */}
      <footer className="relative z-10 bg-black py-20 flex flex-col items-center justify-center overflow-hidden">
        <div className="h-[20rem] md:h-[30rem] w-full flex items-center justify-center">
          <TextHoverEffect text="APPFLUX" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/50 text-sm">

          <a href="https://github.com/akshaypatra00" className="hover:text-white transition-colors">GitHub</a>
          <a href="https://www.linkedin.com/in/akshaypatra/" className="hover:text-white transition-colors">Linkedin</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
        </div>

        <p className="text-white/30 text-xs mt-8">
          © {new Date().getFullYear()} Appflux. All rights reserved.
        </p>
      </footer>

    </div>
  )
}