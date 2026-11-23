
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/user-menu";
import {
    getCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    type Campaign,
    type CampaignCreate,
} from "@/lib/api";

const emptyForm: CampaignCreate = {
    name: "",
    traffic_source: "",
    offer_name: "",
    geo: "",
    currency: "USD",
    status: "active",
    start_date: null,
};

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [geoFilter, setGeoFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CampaignCreate>(emptyForm);
    const [saving, setSaving] = useState(false);

    async function loadCampaigns() {
        try {
            setError("");
            const data = await getCampaigns();
            setCampaigns(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load campaigns");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCampaigns();
    }, []);

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((campaign) => {
            const matchesSearch =
                campaign.name.toLowerCase().includes(search.toLowerCase()) ||
                campaign.offer_name.toLowerCase().includes(search.toLowerCase());

            return (
                matchesSearch &&
                (geoFilter === "all" || campaign.geo === geoFilter) &&
                (sourceFilter === "all" || campaign.traffic_source === sourceFilter) &&
                (statusFilter === "all" || campaign.status.toLowerCase() === statusFilter)
            );
        });
    }, [campaigns, search, geoFilter, sourceFilter, statusFilter]);

    function openCreateModal() {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    }

    function openEditModal(campaign: Campaign) {
        setEditingId(campaign.id);
        setForm({
            name: campaign.name,
            traffic_source: campaign.traffic_source,
            offer_name: campaign.offer_name,
            geo: campaign.geo,
            currency: campaign.currency,
            status: campaign.status,
            start_date: campaign.start_date,
        });
        setModalOpen(true);
    }

    async function handleSave(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (editingId) {
                await updateCampaign(editingId, form);
            } else {
                await createCampaign(form);
            }

            setModalOpen(false);
            setForm(emptyForm);
            setEditingId(null);
            setLoading(true);
            await loadCampaigns();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save campaign");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(campaign: Campaign) {
        const confirmed = window.confirm(
            `Delete campaign "${campaign.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setError("");
            await deleteCampaign(campaign.id);
            setCampaigns((current) =>
                current.filter((item) => item.id !== campaign.id)
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete campaign");
        }
    }

    const uniqueGeos = [...new Set(campaigns.map((item) => item.geo))];
    const uniqueSources = [...new Set(campaigns.map((item) => item.traffic_source))];

    return (
        <main className="min-h-screen bg-[#0b0b0d] text-[#f5f5f5]">
            <div className="flex min-h-screen">
                <aside className="hidden w-[245px] shrink-0 border-r border-[#29292e] bg-[#101012] lg:flex lg:flex-col">
                    <div className="border-b border-[#29292e] p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff8a00] font-bold text-black">
                                F
                            </div>
                            <div>
                                <p className="font-bold tracking-wide">FLY.ANALYTICS</p>
                                <p className="text-[9px] tracking-[3px] text-[#92929a]">
                                    PERFORMANCE PLATFORM
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <p className="mb-4 text-[10px] font-semibold tracking-[3px] text-[#77777f]">
                            WORKSPACE
                        </p>
                        <nav className="space-y-2">
                            <a href="/" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ◫ Overview
                            </a>
                            <a href="/campaigns" className="block rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-3 text-sm text-[#ff9b26]">
                                ▤ Campaigns
                            </a>
                            <a href="/#analytics" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ⌁ Analytics
                            </a>
                            <a href="/#geo" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ◎ GEO Performance
                            </a>
                            <a href="/#reports" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ▥ Financial Reports
                            </a>
                        </nav>
                    </div>
                </aside>

                <section className="min-w-0 flex-1">
                    <header className="flex h-[82px] items-center justify-between border-b border-[#29292e] px-6 sm:px-9">
                        <div>
                            <p className="text-xs text-[#77777f]">Workspace / Campaigns</p>
                            <h1 className="mt-1 text-lg font-semibold">Campaign Management</h1>
                        </div>
                        <UserMenu />
                    </header>

                    <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
                        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">Your campaigns</h2>
                                <p className="mt-2 text-sm text-[#92929a]">
                                    Manage and monitor your advertising campaigns.
                                </p>
                            </div>
                            <button
                                onClick={openCreateModal}
                                className="rounded-lg bg-[#ff8a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9b26]"
                            >
                                + Create Campaign
                            </button>
                        </div>

                        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-[#29292e] bg-[#151518] p-4">
                                <p className="text-xs text-[#92929a]">Total campaigns</p>
                                <p className="mt-2 text-2xl font-bold">{campaigns.length}</p>
                            </div>
                            <div className="rounded-xl border border-[#29292e] bg-[#151518] p-4">
                                <p className="text-xs text-[#92929a]">Active campaigns</p>
                                <p className="mt-2 text-2xl font-bold text-[#22c55e]">
                                    {campaigns.filter((c) => c.status.toLowerCase() === "active").length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-[#29292e] bg-[#151518] p-4">
                                <p className="text-xs text-[#92929a]">Filtered results</p>
                                <p className="mt-2 text-2xl font-bold">{filteredCampaigns.length}</p>
                            </div>
                        </div>

                        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search campaigns..."
                                className="rounded-lg border border-[#333338] bg-[#151518] px-4 py-3 text-sm outline-none placeholder:text-[#66666e] focus:border-[#ff8a00]"
                            />

                            <select
                                value={geoFilter}
                                onChange={(e) => setGeoFilter(e.target.value)}
                                className="rounded-lg border border-[#333338] bg-[#151518] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                            >
                                <option value="all">All GEOs</option>
                                {uniqueGeos.map((geo) => (
                                    <option key={geo} value={geo}>{geo}</option>
                                ))}
                            </select>

                            <select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="rounded-lg border border-[#333338] bg-[#151518] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                            >
                                <option value="all">All traffic sources</option>
                                {uniqueSources.map((source) => (
                                    <option key={source} value={source}>{source}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-[#333338] bg-[#151518] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                            >
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-4 text-sm text-[#ef4444]">
                                {error}
                            </div>
                        )}

                        {/* Mobile campaign cards */}
                        <div className="space-y-3 md:hidden">
                            {loading ? (
                                <div className="rounded-xl border border-[#29292e] bg-[#151518] p-8 text-center text-sm text-[#92929a]">
                                    Loading campaigns...
                                </div>
                            ) : filteredCampaigns.length === 0 ? (
                                <div className="rounded-xl border border-[#29292e] bg-[#151518] p-8 text-center text-sm text-[#92929a]">
                                    No campaigns found. Create your first campaign.
                                </div>
                            ) : (
                                filteredCampaigns.map((campaign) => (
                                    <div key={campaign.id} className="rounded-xl border border-[#29292e] bg-[#151518] p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="break-words font-medium">{campaign.name}</p>
                                                <p className="mt-1 break-words text-xs text-[#77777f]">{campaign.offer_name}</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                                                campaign.status.toLowerCase() === "active"
                                                    ? "bg-[#22c55e]/10 text-[#22c55e]"
                                                    : "bg-[#77777f]/10 text-[#92929a]"
                                            }`}>
                                                {campaign.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-xs text-[#77777f]">GEO</p>
                                                <p className="mt-1 text-[#c4c4ca]">{campaign.geo}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#77777f]">Traffic source</p>
                                                <p className="mt-1 break-words text-[#c4c4ca]">{campaign.traffic_source}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#77777f]">Currency</p>
                                                <p className="mt-1 text-[#c4c4ca]">{campaign.currency}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-4 border-t border-[#29292e] pt-3">
                                            <Link
                                                href={`/campaigns/${campaign.id}`}
                                                className="text-xs font-medium text-[#ff9b26] hover:text-[#ffb45e]"
                                            >
                                                Open
                                            </Link>
                                            <button
                                                onClick={() => openEditModal(campaign)}
                                                className="text-xs font-medium text-[#ff9b26] hover:text-[#ffb45e]"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(campaign)}
                                                className="text-xs font-medium text-[#ef4444] hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop campaign table */}
                        <div className="hidden overflow-hidden rounded-xl border border-[#29292e] bg-[#151518] md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left text-sm">
                                    <thead className="bg-[#19191c] text-[11px] uppercase tracking-wider text-[#77777f]">
                                        <tr>
                                            <th className="px-5 py-4 font-medium">Campaign</th>
                                            <th className="px-4 py-4 font-medium">GEO</th>
                                            <th className="px-4 py-4 font-medium">Traffic source</th>
                                            <th className="px-4 py-4 font-medium">Currency</th>
                                            <th className="px-4 py-4 font-medium">Status</th>
                                            <th className="px-5 py-4 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#29292e]">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-10 text-center text-[#92929a]">
                                                    Loading campaigns...
                                                </td>
                                            </tr>
                                        ) : filteredCampaigns.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-10 text-center text-[#92929a]">
                                                    No campaigns found. Create your first campaign.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredCampaigns.map((campaign) => (
                                                <tr key={campaign.id} className="transition hover:bg-[#1b1b1f]">
                                                    <td className="px-5 py-4">
                                                        <p className="break-words font-medium">{campaign.name}</p>
                                                        <p className="mt-1 break-words text-xs text-[#77777f]">{campaign.offer_name}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-[#c4c4ca]">{campaign.geo}</td>
                                                    <td className="px-4 py-4 text-[#c4c4ca]">{campaign.traffic_source}</td>
                                                    <td className="px-4 py-4 text-[#c4c4ca]">{campaign.currency}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] ${
                                                            campaign.status.toLowerCase() === "active"
                                                                ? "bg-[#22c55e]/10 text-[#22c55e]"
                                                                : "bg-[#77777f]/10 text-[#92929a]"
                                                        }`}>
                                                            {campaign.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <Link
                                                            href={`/campaigns/${campaign.id}`}
                                                            className="mr-3 text-xs font-medium text-[#ff9b26] hover:text-[#ffb45e]"
                                                        >
                                                            Open
                                                        </Link>
                                                        <button
                                                            onClick={() => openEditModal(campaign)}
                                                            className="mr-3 text-xs font-medium text-[#ff9b26] hover:text-[#ffb45e]"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(campaign)}
                                                            className="text-xs font-medium text-[#ef4444] hover:text-red-300"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-[#66666e]">
                            Campaign data is stored in FLY Analytics.
                        </p>
                    </div>
                </section>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
                    <div className="my-auto w-full max-w-xl rounded-2xl border border-[#333338] bg-[#151518] p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {editingId ? "Edit campaign" : "Create campaign"}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-xl text-[#92929a] hover:text-white"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs text-[#92929a]">Campaign name</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Nutra | Germany"
                                    className="w-full rounded-lg border border-[#333338] bg-[#0b0b0d] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs text-[#92929a]">Traffic source</label>
                                    <select
                                        required
                                        value={form.traffic_source}
                                        onChange={(e) =>
                                            setForm({ ...form, traffic_source: e.target.value })
                                        }
                                        className="w-full rounded-lg border border-[#333338] bg-[#0b0b0d] px-4 py-3 text-sm text-white outline-none focus:border-[#FF8A00]"
                                    >
                                        <option value="">Select traffic source</option>
                                        <option value="Meta Ads">Meta Ads</option>
                                        <option value="TikTok Ads">TikTok Ads</option>
                                        <option value="Google Ads">Google Ads</option>
                                        <option value="Snapchat Ads">Snapchat Ads</option>
                                        <option value="Microsoft Ads">Microsoft Ads</option>
                                        <option value="Push">Push Notifications</option>
                                        <option value="Popunder">Popunder</option>
                                        <option value="Native Ads">Native Ads</option>
                                        <option value="In-App">In-App Advertising</option>
                                        <option value="SEO">SEO</option>
                                        <option value="Email">Email Marketing</option>
                                        <option value="Influencer">Influencer Marketing</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs text-[#92929a]">Offer name</label>
                                    <input
                                        required
                                        value={form.offer_name}
                                        onChange={(e) => setForm({ ...form, offer_name: e.target.value })}
                                        placeholder="Offer name"
                                        className="w-full rounded-lg border border-[#333338] bg-[#0b0b0d] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs text-[#92929a]">GEO</label>
                                    <select
                                        required
                                        value={form.geo}
                                        onChange={(e) => setForm({ ...form, geo: e.target.value })}
                                        className="w-full rounded-lg border border-[#333338] bg-[#0b0b0d] px-4 py-3 text-sm text-white outline-none focus:border-[#FF8A00]"
                                    >
                                        <option value="">Select GEO</option>
                                        <option value="DE">Germany (DE)</option>
                                        <option value="PL">Poland (PL)</option>
                                        <option value="US">United States (US)</option>
                                        <option value="UK">United Kingdom (UK)</option>
                                        <option value="FR">France (FR)</option>
                                        <option value="ES">Spain (ES)</option>
                                        <option value="IT">Italy (IT)</option>
                                        <option value="BR">Brazil (BR)</option>
                                        <option value="MX">Mexico (MX)</option>
                                        <option value="CO">Colombia (CO)</option>
                                        <option value="IN">India (IN)</option>
                                        <option value="ID">Indonesia (ID)</option>
                                        <option value="VN">Vietnam (VN)</option>
                                        <option value="TH">Thailand (TH)</option>
                                        <option value="PH">Philippines (PH)</option>
                                        <option value="TR">Turkey (TR)</option>
                                        <option value="RO">Romania (RO)</option>
                                        <option value="CZ">Czechia (CZ)</option>
                                        <option value="PT">Portugal (PT)</option>
                                        <option value="NL">Netherlands (NL)</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs text-[#92929a]">Currency</label>
                                    <select
                                        value={form.currency}
                                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                        className="w-full rounded-lg border border-[#333338] bg-[#0b0b0d] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="UAH">UAH</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs text-[#92929a]">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full rounded-lg border border-[#333338] bg-[#0b0b0d] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs text-[#92929a]">Start date</label>
                                    <input
                                        type="date"
                                        value={form.start_date ?? ""}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value || null })}
                                        className="w-full rounded-lg border border-[#333338] bg-[#0b0b0d] px-4 py-3 text-sm outline-none focus:border-[#ff8a00]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-[#29292e] pt-5">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg border border-[#333338] px-5 py-3 text-sm text-[#c4c4ca] hover:bg-[#222226]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-[#ff8a00] px-5 py-3 text-sm font-semibold text-black hover:bg-[#ff9b26] disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : editingId ? "Save changes" : "Create campaign"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
