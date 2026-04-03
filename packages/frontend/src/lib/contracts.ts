import CrowdfundFactoryABI from "@/abis/CrowdfundFactory.json";
import CampaignABI from "@/abis/Campaign.json";

export const FACTORY_ADDRESS =
    process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

export const FACTORY_ABI = CrowdfundFactoryABI;
export const CAMPAIGN_ABI = CampaignABI;