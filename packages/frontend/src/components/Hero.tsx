"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.png"
          alt="Abstract Background"
          fill
          priority
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Decentralized Trust Protocol
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
            Fund the Future, <br />
            <span className="text-gradient">One Block at a Time.</span>
          </h1>

          <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed px-4 md:px-0">
            Direct peer-to-peer crowdfunding on the Ethereum blockchain. 
            All-or-nothing assurance, zero intermediaries, and complete transparency for every contribution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-6 md:px-0">
            <Link
              href="/create"
              className="w-full sm:w-auto bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              Start Your Campaign
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="#explore"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg border border-border bg-white/5 hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2"
            >
              Explore Innovation
            </Link>
          </div>

          {/* Key Points */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { icon: Zap, label: "Instant Deployment", text: "Launch in seconds with zero paperwork." },
              { icon: ShieldCheck, label: "Trustless Assurance", text: "Funds only release if the goal is met." },
              { icon: ArrowRight, label: "Global Reach", text: "Connect with contributors anywhere on earth." },
            ].map((point, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <point.icon className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="text-white font-semibold mb-1">{point.label}</h3>
                   <p className="text-gray-500 text-sm">{point.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
