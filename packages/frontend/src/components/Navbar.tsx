"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass-nav"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg md:text-xl tracking-tighter flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-lg flex-shrink-0">⛓</span>
          <span className="hidden xs:block">CrowdFund</span>
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          <Link
            href="/create"
            className="hidden md:block text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Create Campaign
          </Link>
          
          {/* Mobile Create Link (Icon Only) */}
          <Link
            href="/create"
            className="md:hidden w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white"
          >
            <span className="text-xl">+</span>
          </Link>

          <div className="hidden md:block h-4 w-[1px] bg-white/10" />
          
          <ConnectButton 
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
        </div>
      </div>
    </motion.nav>
  );
}