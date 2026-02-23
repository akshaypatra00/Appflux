'use client';

import { Github, Linkedin, Instagram, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CometCard } from '@/components/ui/comet-card';

export function PricingSection() {
    return (
        <section className="relative w-full py-32 px-4 bg-black flex justify-center items-center overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm"
            >
                <CometCard className="w-full h-full bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/50">
                    <div className="flex flex-col h-full w-full">
                        {/* Image Area */}
                        <div className="relative h-56 w-full bg-zinc-800 overflow-hidden group rounded-t-3xl">
                            <Image
                                src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800"
                                alt="Developer Coffee"
                                fill
                                className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10 transition-transform group-hover:scale-105">
                                <span className="text-xs font-medium text-white">Free Forever</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 text-center space-y-6 relative z-10 bg-zinc-900/0">
                            <div className="space-y-3">
                                <h2 className="text-3xl font-bold text-white tracking-tight">
                                    Pricing? <span className="text-zinc-500">Nah.</span>
                                </h2>
                                <p className="text-zinc-400 font-medium leading-relaxed">
                                    "Nah nah bro. Just buy me a coffee if you want to."
                                </p>
                            </div>

                            <Button
                                asChild
                                className="w-full bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black font-bold h-12 rounded-xl shadow-[0_0_20px_-5px_#FFDD00] hover:shadow-[0_0_25px_-5px_#FFDD00] transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <Link href="https://buymeacoffee.com/appflux" target="_blank">
                                    <Coffee className="mr-2 h-5 w-5 fill-black/20" />
                                    Buy Me A Coffee
                                </Link>
                            </Button>

                            {/* Social Icons */}
                            <div className="pt-6 border-t border-zinc-800/50 flex justify-center gap-8">
                                <Link
                                    href="https://github.com/akshaypatra00"
                                    target="_blank"
                                    className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                                >
                                    <Github className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="https://www.instagram.com/ok_akshay_/"
                                    target="_blank"
                                    className="text-zinc-500 hover:text-[#E1306C] transition-colors p-2 hover:bg-white/5 rounded-full"
                                >
                                    <Instagram className="w-5 h-5" />
                                </Link>
                                <Link
                                    href="https://www.linkedin.com/in/akshaypatra/"
                                    target="_blank"
                                    className="text-zinc-500 hover:text-[#0077b5] transition-colors p-2 hover:bg-white/5 rounded-full"
                                >
                                    <Linkedin className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </CometCard>
            </motion.div>
        </section>
    );
}
