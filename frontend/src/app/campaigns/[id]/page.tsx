"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import UserMenu from "@/components/user-menu";
import {
  getCampaign,
  getCampaignStats,
  createCampaignStat,
  updateCampaignStat,
  deleteCampaignStat,
  type Campaign,
  type CampaignStat,
  type CampaignStatCreate,
} from "@/lib/api";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const emptyForm = (): CampaignStatCreate => ({
  stat_date: today(),
  impressions: 0,
  clicks: 0,
  leads: 0,
  conversions: 0,
  spend: 0,
  revenue: 0,
});

function number(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB");
}

export default function CampaignDetailsPage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStat[]>([]);
  const [form, setForm] = useState<CampaignStatCreate>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [campaignData, statsData] = await Promise.all([
          getCampaign(campaignId),
          getCampaignStats(campaignId),
        ]);

        if (cancelled) return;

        setError("");
        setCampaign(campaignData);
        setStats(
          [...statsData].sort((a, b) =>
            b.stat_date.localeCompare(a.stat_date)
          )
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load campaign."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  async function refreshData() {
    try {
      const [campaignData, statsData] = await Promise.all([
        getCampaign(campaignId),
        getCampaignStats(campaignId),
      ]);

      setCampaign(campaignData);
      setStats(
        [...statsData].sort((a, b) =>
          b.stat_date.localeCompare(a.stat_date)
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load campaign."
      );
    }
  }

  const totals = useMemo(
    () =>
      stats.reduce(
        (result, item) => ({
          impressions: result.impressions + item.impressions,
          clicks: result.clicks + item.clicks,
          leads: result.leads + item.leads,
          conversions: result.conversions + item.conversions,
          spend: result.spend + number(item.spend),
          revenue: result.revenue + number(item.revenue),
        }),
        {
          impressions: 0,
          clicks: 0,
          leads: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
        }
      ),
    [stats]
  );

  const profit = totals.revenue - totals.spend;
  const roi = totals.spend > 0 ? (profit / totals.spend) * 100 : null;
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : null;

  function updateField<K extends keyof CampaignStatCreate>(
    field: K,
    value: CampaignStatCreate[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEditing(stat: CampaignStat) {
    setEditingId(stat.id);
    setForm({
      stat_date: stat.stat_date,
      impressions: stat.impressions,
      clicks: stat.clicks,
      leads: stat.leads,
      conversions: stat.conversions,
      spend: number(stat.spend),
      revenue: number(stat.revenue),
    });
    setError("");
    setSuccess("");
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload: CampaignStatCreate = {
      ...form,
      impressions: Number.isFinite(form.impressions) ? form.impressions : 0,
      clicks: Number.isFinite(form.clicks) ? form.clicks : 0,
      leads: Number.isFinite(form.leads) ? form.leads : 0,
      conversions: Number.isFinite(form.conversions) ? form.conversions : 0,
      spend: Number.isFinite(form.spend) ? form.spend : 0,
      revenue: Number.isFinite(form.revenue) ? form.revenue : 0,
    };

    try {
      if (editingId) {
        await updateCampaignStat(campaignId, editingId, payload);
        setSuccess("Statistics updated successfully.");
      } else {
        await createCampaignStat(campaignId, payload);
        setSuccess("Daily statistics added successfully.");
      }

      setEditingId(null);
      setForm(emptyForm());
      await refreshData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save statistics."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(statId: string) {
    if (!window.confirm("Delete statistics for this date?")) return;

    setError("");
    setSuccess("");

    try {
      await deleteCampaignStat(campaignId, statId);
      if (editingId === statId) cancelEditing();
      setSuccess("Statistics deleted successfully.");
      await refreshData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete statistics."
      );
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#333338] bg-[#101012] px-3 py-2.5 text-sm text-white outline-none focus:border-[#ff8a00]";

  const labelClass = "mb-2 block text-xs text-[#92929a]";

  const kpis = [
    { label: "Revenue", value: money(totals.revenue, campaign?.currency ?? "USD"), color: "text-white" },
    { label: "Ad Spend", value: money(totals.spend, campaign?.currency ?? "USD"), color: "text-white" },
    { label: "Profit", value: money(profit, campaign?.currency ?? "USD"), color: profit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]" },
    { label: "ROI", value: roi === null ? "N/A" : `${roi.toFixed(2)}%`, color: roi !== null && roi >= 0 ? "text-[#22c55e]" : "text-[#ef4444]" },
    { label: "ROAS", value: roas === null ? "N/A" : `${roas.toFixed(2)}x`, color: "text-[#ff9b26]" },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-[#f5f5f5]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[245px] shrink-0 border-r border-[#29292e] bg-[#101012] lg:flex lg:flex-col">
          <div className="border-b border-[#29292e] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff8a00] font-bold text-black">F</div>
              <div>
                <p className="font-bold tracking-wide">FLY.ANALYTICS</p>
                <p className="text-[9px] tracking-[3px] text-[#92929a]">PERFORMANCE PLATFORM</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="mb-4 text-[10px] font-semibold tracking-[3px] text-[#77777f]">WORKSPACE</p>
            <nav className="space-y-2">
              <Link href="/" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">Overview</Link>
              <Link href="/campaigns" className="block rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-3 text-sm text-[#ff9b26]">Campaigns</Link>
              <Link href="/analytics" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">Analytics</Link>
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[82px] items-center justify-between border-b border-[#29292e] px-5 sm:px-9">
            <div>
              <p className="text-xs text-[#77777f]">Workspace / Campaigns / Details</p>
              <h1 className="mt-1 text-lg font-semibold">
                {campaign?.name ?? "Campaign details"}
              </h1>
            </div>
            <UserMenu />
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <Link href="/campaigns" className="mb-6 inline-flex text-sm text-[#ff9b26] hover:text-[#ffb45e]">
              ← Back to campaigns
            </Link>

            {error && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
                {success}
              </div>
            )}

            {loading ? (
              <div className="rounded-xl border border-[#29292e] bg-[#151518] p-10 text-center text-sm text-[#92929a]">
                Loading campaign...
              </div>
            ) : campaign ? (
              <>
                <div className="mb-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">{campaign.name}</h2>
                      <p className="mt-2 text-sm text-[#92929a]">
                        {campaign.offer_name} · {campaign.traffic_source} · {campaign.geo}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#22c55e]/10 px-3 py-1.5 text-xs text-[#22c55e]">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[#77777f]">
                    Currency: {campaign.currency}
                    {campaign.start_date ? ` · Started ${formatDate(campaign.start_date)}` : ""}
                  </p>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {kpis.map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#29292e] bg-[#151518] p-5">
                      <p className="text-xs text-[#92929a]">{item.label}</p>
                      <p className={`mt-3 break-all text-2xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Impressions", value: totals.impressions },
                    { label: "Clicks", value: totals.clicks },
                    { label: "Leads", value: totals.leads },
                    { label: "Conversions", value: totals.conversions },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#29292e] bg-[#151518] p-4">
                      <p className="text-xs text-[#92929a]">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold">{item.value.toLocaleString("en-US")}</p>
                    </div>
                  ))}
                </div>

                <div className={editingId ? "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4" : "mb-7"}><div className={editingId ? "my-auto max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[#29292e] bg-[#151518] p-5 shadow-2xl sm:p-6" : "rounded-xl border border-[#29292e] bg-[#151518] p-5 sm:p-6"}>
                  <h2 className="mb-5 text-lg font-semibold">
                    {editingId ? "Edit daily statistics" : "Add daily statistics"}
                  </h2>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className={labelClass}>Date *</label>
                      <input
                        className={inputClass}
                        type="date"
                        required
                        value={form.stat_date}
                        onChange={(event) => updateField("stat_date", event.target.value)}
                      />
                    </div>

                    {([
                      ["impressions", "Impressions"],
                      ["clicks", "Clicks"],
                      ["leads", "Leads"],
                      ["conversions", "Conversions"],
                      ["spend", "Ad Spend"],
                      ["revenue", "Revenue"],
                    ] as const).map(([field, label]) => (
                      <div key={field}>
                        <label className={labelClass}>{label}</label>
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          step={field === "spend" || field === "revenue" ? "0.01" : "1"}
                          required
                          value={Number.isNaN(form[field]) ? "" : form[field] ?? 0}
                          onChange={(event) => {
                            const value = event.target.value;
                            updateField(
                              field,
                              (value === "" ? Number.NaN : Number(value)) as never
                            );
                          }}
                        />
                      </div>
                    ))}

                    <div className="flex flex-wrap items-end gap-3 sm:col-span-2 xl:col-span-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-[#ff8a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9b26] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? "Saving..." : editingId ? "Save changes" : "Add statistics"}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-lg border border-[#333338] px-5 py-3 text-sm text-[#c4c4ca] hover:bg-[#222226]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                  <p className="mt-4 text-xs text-[#77777f]">
                    Only one statistics record can exist per campaign per date.
                  </p>
                </div></div>

                <div className="overflow-hidden rounded-xl border border-[#29292e] bg-[#151518]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#29292e] p-5">
                    <div>
                      <h2 className="text-lg font-semibold">Daily statistics history</h2>
                      <p className="mt-1 text-xs text-[#77777f]">{stats.length} records</p>
                    </div>
                  </div>

                  {stats.length === 0 ? (
                    <div className="p-10 text-center">
                      <p className="font-medium">No statistics yet</p>
                      <p className="mt-2 text-sm text-[#92929a]">
                        Add your first daily statistics using the form above.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[950px] text-left text-sm">
                        <thead className="bg-[#19191c] text-[11px] uppercase tracking-wider text-[#77777f]">
                          <tr>
                            <th className="px-4 py-4">Date</th>
                            <th className="px-4 py-4">Impressions</th>
                            <th className="px-4 py-4">Clicks</th>
                            <th className="px-4 py-4">Leads</th>
                            <th className="px-4 py-4">Conversions</th>
                            <th className="px-4 py-4">Spend</th>
                            <th className="px-4 py-4">Revenue</th>
                            <th className="px-4 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#29292e]">
                          {stats.map((stat) => (
                            <tr key={stat.id} className="transition hover:bg-[#1b1b1f]">
                              <td className="whitespace-nowrap px-4 py-4">{formatDate(stat.stat_date)}</td>
                              <td className="px-4 py-4">{stat.impressions.toLocaleString("en-US")}</td>
                              <td className="px-4 py-4">{stat.clicks.toLocaleString("en-US")}</td>
                              <td className="px-4 py-4">{stat.leads.toLocaleString("en-US")}</td>
                              <td className="px-4 py-4">{stat.conversions.toLocaleString("en-US")}</td>
                              <td className="whitespace-nowrap px-4 py-4">{money(number(stat.spend), campaign.currency)}</td>
                              <td className="whitespace-nowrap px-4 py-4">{money(number(stat.revenue), campaign.currency)}</td>
                              <td className="whitespace-nowrap px-4 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => startEditing(stat)}
                                  className="mr-3 text-xs font-medium text-[#ff9b26] hover:text-[#ffb45e]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(stat.id)}
                                  className="text-xs font-medium text-[#ef4444] hover:text-red-300"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-[#29292e] bg-[#151518] p-10 text-center">
                <p className="font-semibold">Campaign not found</p>
                <Link href="/campaigns" className="mt-4 inline-block text-sm text-[#ff9b26]">
                  Return to campaigns
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
