"use client";

import { motion } from "framer-motion";
import { 
  Shield, 
  Users, 
  Coins, 
  Globe, 
  Lock, 
  Terminal 
} from "lucide-react";

const features = [
  {
    title: "All-or-Nothing Assurance",
    description: "Campaign funds are held in a secure smart contract. If the goal isn't met, everyone gets a full refund automatically.",
    icon: Shield,
    className: "md:col-span-2 md:row-span-1 bg-gradient-to-br from-blue-500/10 to-transparent",
  },
  {
    title: "Global Participation",
    description: "Accept contributions from anyone, anywhere, instantly.",
    icon: Globe,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "0% Platform Fees",
    description: "Direct peer-to-peer funding. No middleman taking a cut of your impact.",
    icon: Coins,
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Trustless Execution",
    description: "Programmable finance ensures that rules are enforced by code, not promises. Immutable, transparent, and auditable on-chain.",
    icon: Lock,
    className: "md:col-span-2 md:row-span-1 bg-gradient-to-br from-purple-500/10 to-transparent",
  },
];

export default function BentoFeatures() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 tracking-tight">Built for the <span className="text-gradient">New Economy</span></h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          We've abstracted the complexity of blockchain to give you a powerful 
          crowdfunding experience that is safe, fast, and completely open.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            className={`glass-card p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group ${feature.className}`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
            <p className="text-gray-500 leading-relaxed text-sm md:text-base">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
