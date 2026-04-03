"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount
} from "wagmi";
import { parseEther } from "viem";
import {
    FACTORY_ADDRESS,
    FACTORY_ABI
} from "@/lib/contracts";
import Navbar from "@/components/Navbar";

export default function CreateCampaignPage() {
    const router = useRouter();
    const { isConnected } = useAccount();

    const [form, setForm] = useState({
        title: "",
        description: "",
        goal: "",
        days: "",
    });

    // wagmi hook for writing to the contract
    const { writeContract, data: txHash, isPending, error } = useWriteContract();

    // Watch for the transaction to be confirmed
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Redirect to home once confirmed
    if (isSuccess) {
        // Give the backend 3 seconds to index the event
        setTimeout(() => router.push("/"), 3000);
    }

    function handleSubmit() {
        if (!form.title || !form.goal || !form.days) return;

        // Convert days to a unix timestamp deadline
        const deadline = BigInt(
            Math.floor(Date.now() / 1000) + parseInt(form.days) * 86400
        );

        writeContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: "createCampaign",
            args: [
                form.title,
                form.description,
                parseEther(form.goal),  // convert ETH string to wei
                deadline,
            ],
        });
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="max-w-xl mx-auto px-6 pt-24 pb-12">
                <h1 className="text-3xl font-bold mb-2">Create Campaign</h1>
                <p className="text-gray-400 mb-8">
                    Deploy a new crowdfunding campaign on Ethereum
                </p>

                {!isConnected ? (
                    <div className="bg-gray-900 rounded-xl p-8 text-center">
                        <p className="text-gray-400 mb-4">
                            Connect your wallet to create a campaign
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5">

                        {/* Title */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Campaign Title
                            </label>
                            <input
                                type="text"
                                placeholder="Build a school in Lagos"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 
                                           rounded-lg px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none 
                                           focus:border-blue-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Description
                            </label>
                            <textarea
                                placeholder="What are you raising funds for?"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="w-full bg-gray-900 border border-gray-700 
                                           rounded-lg px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none 
                                           focus:border-blue-500 resize-none"
                            />
                        </div>

                        {/* Goal */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Funding Goal (ETH)
                            </label>
                            <input
                                type="number"
                                placeholder="1.5"
                                value={form.goal}
                                onChange={e => setForm({ ...form, goal: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 
                                           rounded-lg px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none 
                                           focus:border-blue-500"
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                Duration (days)
                            </label>
                            <input
                                type="number"
                                placeholder="30"
                                value={form.days}
                                onChange={e => setForm({ ...form, days: e.target.value })}
                                className="w-full bg-gray-900 border border-gray-700 
                                           rounded-lg px-4 py-3 text-white 
                                           placeholder-gray-600 focus:outline-none 
                                           focus:border-blue-500"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 
                                            rounded-lg px-4 py-3 text-red-400 text-sm">
                                {error.message.slice(0, 150)}
                            </div>
                        )}

                        {/* Success */}
                        {isSuccess && (
                            <div className="bg-green-500/10 border border-green-500/30 
                                            rounded-lg px-4 py-3 text-green-400 text-sm">
                                ✅ Campaign created! Redirecting...
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={isPending || isConfirming}
                            className="w-full bg-blue-600 hover:bg-blue-700 
                                       disabled:bg-blue-800 disabled:cursor-not-allowed
                                       text-white font-semibold py-3 rounded-lg 
                                       transition-colors"
                        >
                            {isPending ? "Confirm in wallet..." :
                                isConfirming ? "Waiting for block..." :
                                    "Deploy Campaign"}
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}