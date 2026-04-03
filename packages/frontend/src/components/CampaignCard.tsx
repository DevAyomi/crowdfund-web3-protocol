"use client";

import Link from "next/link";
import { Campaign } from "@/lib/api";
import { useReadContract } from "wagmi";
import { CAMPAIGN_ABI } from "@/lib/contracts";
import { formatEther, parseEther } from "viem";

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
    const deadlineDate = new Date(campaign.deadline * 1000).toLocaleDateString();

    // Real-time: Read totalRaised directly from chain for this specific card
    const { data: chainTotalRaised } = useReadContract({
        address: campaign.address as `0x${string}`,
        abi: CAMPAIGN_ABI,
        functionName: "totalRaised",
    });

    // Use chain value if available, fallback to backend
    const currentRaised = chainTotalRaised !== undefined
        ? formatEther(chainTotalRaised as bigint)
        : campaign.total_raised_eth;

    // Recalculate progress using real-time raised amount (with 1 decimal precision)
    const goalWei = parseEther(campaign.goal_eth);
    const raisedWei = chainTotalRaised !== undefined 
        ? (chainTotalRaised as bigint) 
        : parseEther(campaign.total_raised_eth);
    
    // Calculate percentage with 1 decimal place (e.g., 10.5%)
    const progressPct = goalWei > BigInt(0)
        ? Number((raisedWei * BigInt(1000)) / goalWei) / 10
        : 0;

    // Visual: ensure the bar shows at least a 1% sliver if there's any money raised
    const visualWidth = raisedWei > BigInt(0) ? Math.max(progressPct, 1) : 0;

    const statusBadge = campaign.is_active
        ? { label: "Active", color: "bg-green-500/20 text-green-400" }
        : campaign.is_successful
            ? { label: "Successful", color: "bg-blue-500/20 text-blue-400" }
            : { label: "Failed", color: "bg-red-500/20 text-red-400" };

    return (
        <Link href={`/campaign/${campaign.address}`}>
            <div className="glass-card rounded-2xl p-6 border border-white/5 
                            hover:border-blue-500/30 transition-all cursor-pointer 
                            group hover:shadow-2xl hover:shadow-blue-500/10 
                            hover:transform hover:-translate-y-1 overflow-hidden relative">
                
                {/* Accent Background Glow */}
                <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-colors" />


                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-semibold text-lg leading-tight 
                                   line-clamp-2 flex-1 mr-3">
                        {campaign.title}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium 
                                     whitespace-nowrap ${statusBadge.color}`}>
                        {statusBadge.label}
                    </span>
                </div>

                {/* Creator */}
                <p className="text-gray-500 text-xs mb-4 font-mono">
                    by {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                </p>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-medium">
                            {currentRaised} ETH
                        </span>
                        <span className="text-gray-400">
                            {progressPct.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(visualWidth, 100)}%` }}
                        />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                        Goal: {campaign.goal_eth} ETH
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between text-xs text-gray-500 
                                pt-3 border-t border-gray-800">
                    <span>⏰ {campaign.is_active ? `Ends ${deadlineDate}` : `Ended ${deadlineDate}`}</span>
                    <span>🏦 {currentRaised} / {campaign.goal_eth} ETH</span>
                </div>
            </div>
        </Link>
    );
}