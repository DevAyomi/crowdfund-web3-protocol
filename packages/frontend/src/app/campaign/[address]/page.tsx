"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { CAMPAIGN_ABI } from "@/lib/contracts";
import { getCampaign } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { useEffect, useRef } from "react";
import type { Campaign } from "@/lib/api";

export default function CampaignPage() {
    const params = useParams();
    const address = params.address as `0x${string}`;

    const { address: userAddress } = useAccount();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [ethAmount, setEthAmount] = useState("");

    // Fetch campaign from your Node backend
    useEffect(() => {
        getCampaign(address)
            .then(setCampaign)
            .finally(() => setLoading(false));
    }, [address]);

    // Read user's contribution directly from chain
    const { data: myContribution, refetch: refetchMyContribution } = useReadContract({
        address,
        abi: CAMPAIGN_ABI,
        functionName: "contributions",
        args: [userAddress!],
        query: { enabled: !!userAddress },
    });

    // Real-time: Read totalRaised and withdrawn status directly from chain
    const { data: chainTotalRaised, refetch: refetchTotalRaised } = useReadContract({
        address,
        abi: CAMPAIGN_ABI,
        functionName: "totalRaised",
    });

    const { data: chainWithdrawn, refetch: refetchWithdrawn } = useReadContract({
        address,
        abi: CAMPAIGN_ABI,
        functionName: "withdrawn",
    });

    // Write hooks
    const {
        writeContract,
        data: txHash,
        isPending,
        error,
    } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Refresh campaign data after tx confirms
    useEffect(() => {
        if (isSuccess) {
            // Trigger parallel refetches for instant UI feedback
            refetchTotalRaised();
            refetchMyContribution();
            refetchWithdrawn();

            // Also poll backend for any metadata updates (like new contributions list)
            setTimeout(() => getCampaign(address).then(setCampaign), 3000);
        }
    }, [isSuccess, refetchTotalRaised, refetchMyContribution, refetchWithdrawn, address]);

    function contribute() {
        if (!ethAmount) return;
        writeContract({
            address,
            abi: CAMPAIGN_ABI,
            functionName: "contribute",
            value: parseEther(ethAmount),
        });
    }

    function withdraw() {
        writeContract({
            address,
            abi: CAMPAIGN_ABI,
            functionName: "withdraw",
        });
    }

    function refund() {
        writeContract({
            address,
            abi: CAMPAIGN_ABI,
            functionName: "refund",
        });
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white">
                <Navbar />
                <div className="flex items-center justify-center py-40">
                    <p className="text-gray-400">Loading campaign...</p>
                </div>
            </main>
        );
    }

    if (!campaign) {
        return (
            <main className="min-h-screen bg-black text-white">
                <Navbar />
                <div className="flex items-center justify-center py-40">
                    <p className="text-gray-400">Campaign not found</p>
                </div>
            </main>
        );
    }

    const isCreator = userAddress?.toLowerCase() === campaign.creator;
    const deadlineDate = new Date(campaign.deadline * 1000).toLocaleDateString();
    const myAmount = myContribution ? formatEther(myContribution as bigint) : "0";

    // Use chain values if available, fallback to backend
    const currentRaised = chainTotalRaised !== undefined
        ? formatEther(chainTotalRaised as bigint)
        : campaign.total_raised_eth;

    const isWithdrawn = chainWithdrawn !== undefined
        ? chainWithdrawn as boolean
        : campaign.withdrawn;

    // Recalculate progress using real-time raised amount (with 1 decimal precision)
    const goalWei = parseEther(campaign.goal_eth);
    const raisedWei = chainTotalRaised !== undefined ? (chainTotalRaised as bigint) : parseEther(campaign.total_raised_eth);
    
    // Calculate percentage with 1 decimal place (e.g., 10.5%)
    const progressPct = goalWei > BigInt(0)
        ? Number((raisedWei * BigInt(1000)) / goalWei) / 10
        : 0;

    // Visual: ensure the bar shows at least a 1% sliver if there's any money raised
    const visualWidth = raisedWei > BigInt(0) ? Math.max(progressPct, 1) : 0;
    

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 pt-24 pb-12">

                {/* Title + Status */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{campaign.title}</h1>
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${campaign.is_active
                                ? "bg-green-500/20 text-green-400"
                                : campaign.is_successful
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-red-500/20 text-red-400"
                            }`}>
                            {campaign.is_active ? "Active"
                                : campaign.is_successful ? "Successful"
                                    : "Failed"}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm font-mono">
                        Creator: {campaign.creator}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    {/* Stats */}
                    {[
                        { label: "Raised", value: `${currentRaised} ETH` },
                        { label: "Goal", value: `${campaign.goal_eth} ETH` },
                        { label: "Deadline", value: deadlineDate },
                    ].map(stat => (
                        <div key={stat.label}
                            className="bg-gray-900 border border-gray-800 
                                        rounded-xl p-5 text-center">
                            <p className="text-2xl font-bold text-white mb-1">
                                {stat.value}
                            </p>
                            <p className="text-gray-500 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-900 border border-gray-800 
                                rounded-xl p-6 mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-white font-medium">Progress</span>
                        <span className="text-blue-400 font-bold">
                            {progressPct.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                        <div
                            className="bg-blue-500 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(visualWidth, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-900 border border-gray-800 
                                rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Actions</h2>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 
                                        rounded-lg px-4 py-3 text-red-400 
                                        text-sm mb-4">
                            {error.message.slice(0, 200)}
                        </div>
                    )}

                    {/* Success */}
                    {isSuccess && (
                        <div className="bg-green-500/10 border border-green-500/30 
                                        rounded-lg px-4 py-3 text-green-400 
                                        text-sm mb-4">
                            ✅ Transaction confirmed!
                        </div>
                    )}

                    {/* Contribute — only if active */}
                    {campaign.is_active && (
                        <div className="flex flex-col md:flex-row gap-3 mb-4">
                            <input
                                type="number"
                                placeholder="0.1"
                                value={ethAmount}
                                onChange={e => setEthAmount(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 
                                           rounded-lg px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none 
                                           focus:border-blue-500"
                            />
                            <button
                                onClick={contribute}
                                disabled={isPending || isConfirming}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 
                                           disabled:bg-blue-800 text-white 
                                           font-bold px-8 py-3 rounded-lg 
                                           transition-colors whitespace-nowrap"
                            >
                                {isPending || isConfirming
                                    ? "Processing..."
                                    : "Contribute ETH"}
                            </button>
                        </div>
                    )}

                    {/* Your contribution */}
                    {parseFloat(myAmount) > 0 && (
                        <p className="text-gray-400 text-sm mb-4">
                            Your contribution: <span className="text-white font-medium">
                                {myAmount} ETH
                            </span>
                        </p>
                    )}

                    {/* Withdraw — creator only, if successful */}
                    {isCreator && campaign.is_successful && !isWithdrawn && (
                        <button
                            onClick={withdraw}
                            disabled={isPending || isConfirming}
                            className="w-full bg-green-600 hover:bg-green-700 
                                       disabled:bg-green-800 text-white 
                                       font-semibold py-3 rounded-lg 
                                       transition-colors mb-3"
                        >
                            {isPending || isConfirming
                                ? "Processing..."
                                : `Withdraw ${currentRaised} ETH`}
                        </button>
                    )}

                    {/* Refund — contributor, if failed */}
                    {campaign.is_failed && parseFloat(myAmount) > 0 && (
                        <button
                            onClick={refund}
                            disabled={isPending || isConfirming}
                            className="w-full bg-orange-600 hover:bg-orange-700 
                                       disabled:bg-orange-800 text-white 
                                       font-semibold py-3 rounded-lg 
                                       transition-colors"
                        >
                            {isPending || isConfirming
                                ? "Processing..."
                                : `Claim Refund (${myAmount} ETH)`}
                        </button>
                    )}
                </div>

                {/* Contributions List */}
                {campaign.contributions && campaign.contributions.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Contributions ({campaign.contributions.length})
                        </h2>
                        <div className="space-y-3">
                            {campaign.contributions.map((c) => (
                                <div key={c.id}
                                    className="flex justify-between items-center 
                                                py-3 border-b border-gray-800 
                                                last:border-0">
                                    <span className="text-gray-400 font-mono text-sm">
                                        {c.contributor.slice(0, 6)}...
                                        {c.contributor.slice(-4)}
                                    </span>
                                    <span className="text-white font-medium">
                                        {c.amount_eth} ETH
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}