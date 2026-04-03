import { getCampaigns } from "@/lib/api";
import CampaignCard from "@/components/CampaignCard";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BentoFeatures from "@/components/BentoFeatures";
import Footer from "@/components/Footer";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const params = await searchParams;
  const status = (params.status as "active" | "successful" | "failed") || undefined;

  const campaigns = await getCampaigns(status);

  const tabs = [
    { label: "All Projects", value: undefined },
    { label: "Active", value: "active" },
    { label: "Completed", value: "successful" },
    { label: "Failed", value: "failed" },
  ];

  return (
    <main className="min-h-screen bg-black text-white relative">
      <Navbar />

      {/* Marketing Section */}
      <Hero />
      <BentoFeatures />

      {/* Discovery Section */}
      <section id="explore" className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="flex flex-col md:row items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Explore Campaigns</h2>
            <p className="text-gray-500 text-sm">Discover and fund innovative projects from around the world.</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-gray-900/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
            {tabs.map((tab) => {
              const href = tab.value ? `/?status=${tab.value}#explore` : "/#explore";
              const isActive = status === tab.value;
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Campaign Grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-32 glass-card rounded-3xl border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="text-2xl text-gray-500">🔍</span>
            </div>
            <p className="text-gray-400 text-lg mb-6">
              No campaigns found for the selected category.
            </p>
            <Link
              href="/create"
              className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              Start the first one
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.address} campaign={campaign} />
            ))}
          </div>
        )}

        {/* Call to Action for Creator */}
        {campaigns.length > 0 && (
           <div className="mt-24 p-8 md:p-12 glass-card rounded-3xl border-blue-500/20 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl transition-all group-hover:bg-blue-600/20" />
              <div className="relative z-10 flex flex-col md:row items-center justify-between gap-8">
                  <div className="max-w-md text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-3">Ready to bring your idea to life?</h3>
                      <p className="text-gray-500">Join a global community of innovators and get your project funded today.</p>
                  </div>
                  <Link
                      href="/create"
                      className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all whitespace-nowrap"
                  >
                      Create Your Campaign
                  </Link>
              </div>
           </div>
        )}
      </section>

      <Footer />
    </main>
  );
}