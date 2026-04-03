"use client";

import Link from "next/link";
import { MessageSquare, Globe, Share2, ExternalLink } from "lucide-react";

export default function Footer() {
  const sections = [
    {
      title: "Protocol",
      links: [
        { label: "Explore", href: "#" },
        { label: "Create", href: "/create" },
        { label: "Documentation", href: "#" },
        { label: "Governance", href: "#" },
      ],
    },
    {
      title: "Development",
      links: [
        { label: "GitHub", href: "#" },
        { label: "Status", href: "#" },
        { label: "Audit", href: "#" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Twitter", href: "#" },
        { label: "Discord", href: "#" },
        { label: "Mirror", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-black border-t border-white/5 pt-20 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white mb-4 block">
              ⛓ CrowdFund
            </Link>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
              The world's most transparent, decentralized crowdfunding platform. 
              Open-source and community-driven.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                <Globe size={20} />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                <MessageSquare size={20} />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                <Share2 size={20} />
              </Link>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-bold mb-6">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-gray-500 hover:text-white transition-colors text-sm flex items-center gap-1 group"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © 2026 CrowdFund. Built on Ethereum.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-600 hover:text-white text-xs transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-600 hover:text-white text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-600 hover:text-white text-xs transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
