const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Campaign {
    address: string;
    creator: string;
    title: string;
    goal: string;
    goal_eth: string;
    deadline: number;
    created_at: number;
    total_raised: string;
    total_raised_eth: string;
    withdrawn: boolean;
    is_active: boolean;
    is_successful: boolean;
    is_failed: boolean;
    progress_pct: number;
    contributions?: Contribution[];
}

export interface Contribution {
    id: number;
    campaign_address: string;
    contributor: string;
    amount: string;
    amount_eth: string;
    created_at: number;
}

// Fetch all campaigns with optional status filter
export async function getCampaigns(
    status?: "active" | "successful" | "failed"
): Promise<Campaign[]> {
    try {
        const url = status
            ? `${API_URL}/api/campaigns?status=${status}`
            : `${API_URL}/api/campaigns`;

        const res = await fetch(url, { next: { revalidate: 30 } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data ?? [];
    } catch (err) {
        console.error("[API] getCampaigns failed:", err);
        return [];
    }
}

// Fetch single campaign with contributions
export async function getCampaign(address: string): Promise<Campaign | null> {
    try {
        const res = await fetch(`${API_URL}/api/campaigns/${address}`, {
            next: { revalidate: 10 }
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.data ?? null;
    } catch (err) {
        console.error("[API] getCampaign failed:", err);
        return null;
    }
}