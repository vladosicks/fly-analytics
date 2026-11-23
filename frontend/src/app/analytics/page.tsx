"use client";

import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/user-menu";
import {
  getCampaigns,
  getCampaignAnalytics,
  getProfitOverTime,
  type Campaign,
  type AnalyticsMetrics,
  type ProfitOverTimePoint,
} from "@/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function number(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function metric(value: number | string | null | undefined, suffix = ""): string {
  return value === null || value === undefined
    ? "N/A"
    : `${number(value).toFixed(2)}${suffix}`;
}

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [metrics, setMetrics] = useState<Record<string, AnalyticsMetrics | null>>({});
  const [chartData, setChartData] = useState<ProfitOverTimePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const [campaignData, profitData] = await Promise.all([
          getCampaigns(),
          getProfitOverTime(),
        ]);

        setCampaigns(campaignData);
        setChartData(profitData.data);

        const analytics = await Promise.all(
          campaignData.map(async (campaign) => {
            try {
              const result = await getCampaignAnalytics(campaign.id);
              return [campaign.id, result.metrics] as const;
            } catch {
              return [campaign.id, null] as const;
            }
          })
        );

        setMetrics(Object.fromEntries(analytics));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const visibleCampaigns = useMemo(
    () => selectedCampaign === "all"
      ? campaigns
      : campaigns.filter((campaign) => campaign.id === selectedCampaign),
    [campaigns, selectedCampaign]
  );

  const selectedMetrics = useMemo(
    () => visibleCampaigns
      .map((campaign) => metrics[campaign.id])
      .filter((item): item is AnalyticsMetrics => item !== null && item !== undefined),
    [visibleCampaigns, metrics]
  );

  const totals = useMemo(() => {
    return selectedMetrics.reduce(
      (acc, item) => ({
        revenue: acc.revenue + number(item.revenue),
        spend: acc.spend + number(item.spend),
        profit: acc.profit + number(item.profit),
        conversions: acc.conversions + item.conversions,
        clicks: acc.clicks + item.clicks,
        impressions: acc.impressions + item.impressions,
        leads: acc.leads + item.leads,
      }),
      {
        revenue: 0,
        spend: 0,
        profit: 0,
        conversions: 0,
        clicks: 0,
        impressions: 0,
        leads: 0,
      }
    );
  }, [selectedMetrics]);

  const roi = totals.spend > 0
    ? (totals.profit / totals.spend) * 100
    : null;

  const roas = totals.spend > 0
    ? totals.revenue / totals.spend
    : null;

  const currencies = useMemo(
    () => [...new Set(visibleCampaigns.map((campaign) => campaign.currency))],
    [visibleCampaigns]
  );

  const hasMixedCurrencies = selectedCampaign === "all" && currencies.length > 1;

  const selectedCurrency = selectedCampaign === "all"
    ? currencies[0] ?? "USD"
    : visibleCampaigns[0]?.currency ?? "USD";

  const chartVisible = useMemo(
    () => selectedCampaign === "all" && !hasMixedCurrencies ? chartData : [],
    [chartData, selectedCampaign, hasMixedCurrencies]
  );

  const kpis = [
    { label: "Revenue", value: hasMixedCurrencies ? "Mixed currencies" : money(totals.revenue, selectedCurrency), color: "text-white" },
    { label: "Ad Spend", value: hasMixedCurrencies ? "Mixed currencies" : money(totals.spend, selectedCurrency), color: "text-white" },
    { label: "Profit", value: hasMixedCurrencies ? "Mixed currencies" : money(totals.profit, selectedCurrency), color: totals.profit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]" },
    { label: "ROI", value: hasMixedCurrencies ? "N/A" : roi === null ? "N/A" : `${roi.toFixed(2)}%`, color: roi !== null && roi >= 0 ? "text-[#22c55e]" : "text-[#ef4444]" },
    { label: "ROAS", value: hasMixedCurrencies ? "N/A" : roas === null ? "N/A" : `${roas.toFixed(2)}x`, color: "text-[#ff9b26]" },
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
              <a href="/" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">◫ Overview</a>
              <a href="/campaigns" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">▤ Campaigns</a>
              <a href="/analytics" className="block rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-3 text-sm text-[#ff9b26]">⌁ Analytics</a>
              <a href="/#geo" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">◎ GEO Performance</a>
              <a href="/#reports" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">▥ Financial Reports</a>
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[82px] items-center justify-between border-b border-[#29292e] px-5 sm:px-9">
            <div>
              <p className="text-xs text-[#77777f]">Workspace / Analytics</p>
              <h1 className="mt-1 text-lg font-semibold">Performance Analytics</h1>
            </div>
            <UserMenu />
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Analytics Overview</h2>
                <p className="mt-2 text-sm text-[#92929a]">Track your advertising performance and profitability.</p>
              </div>
              <select
                value={selectedCampaign}
                onChange={(event) => setSelectedCampaign(event.target.value)}
                className="w-full rounded-lg border border-[#333338] bg-[#151518] px-4 py-3 text-sm outline-none focus:border-[#ff8a00] sm:w-auto"
              >
                <option value="all">All campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
            )}

            {loading ? (
              <div className="rounded-xl border border-[#29292e] bg-[#151518] p-10 text-center text-sm text-[#92929a]">Loading analytics...</div>
            ) : (
              <>
                {hasMixedCurrencies && (
                  <div className="mb-5 rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/10 p-4 text-sm text-[#ffb454]">
                    Campaigns use different currencies. Financial totals and the combined profit chart are unavailable. Select a single campaign to view accurate financial metrics.
                  </div>
                )}

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {kpis.map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#29292e] bg-[#151518] p-5">
                      <p className="text-xs text-[#92929a]">{item.label}</p>
                      <p className={`mt-3 break-all text-2xl font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Impressions", value: totals.impressions.toLocaleString("en-US") },
                    { label: "Clicks", value: totals.clicks.toLocaleString("en-US") },
                    { label: "Leads", value: totals.leads.toLocaleString("en-US") },
                    { label: "Conversions", value: totals.conversions.toLocaleString("en-US") },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-[#29292e] bg-[#151518] p-4">
                      <p className="text-xs text-[#92929a]">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-5 rounded-xl border border-[#29292e] bg-[#151518] p-5">
                  <div className="mb-5">
                    <h3 className="font-semibold">Profit Over Time</h3>
                    <p className="mt-1 text-xs text-[#92929a]">Daily revenue, ad spend and profit · Last 30 days</p>
                  </div>
                  {chartVisible.length > 0 ? (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartVisible}>
                          <defs>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff8a00" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ff8a00" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#29292e" strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fill: "#92929a", fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: "#92929a", fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: "#19191c", border: "1px solid #333338", borderRadius: 8, color: "#f5f5f5" }} />
                          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" fill="transparent" strokeWidth={2} />
                          <Area type="monotone" dataKey="spend" name="Ad Spend" stroke="#ef4444" fill="transparent" strokeWidth={2} />
                          <Area type="monotone" dataKey="profit" name="Profit" stroke="#ff8a00" fill="url(#profitGradient)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-[#77777f]">
                      {selectedCampaign === "all" ? "No profit data available yet." : "The daily chart currently shows all campaigns. Select All campaigns to view it."}
                    </div>
                  )}
                </div>

                <section className="mb-5 rounded-xl border border-[#29292e] bg-[#151518] p-5">
                  <div className="mb-5">
                    <h3 className="font-semibold">Advanced Performance Metrics</h3>
                    <p className="mt-1 text-xs text-[#92929a]">
                      Detailed traffic and conversion efficiency by campaign
                    </p>
                  </div>

                  {visibleCampaigns.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[#77777f]">
                      No campaign metrics available.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleCampaigns.map((campaign) => {
                        const index = campaigns.findIndex(
                          (item) => item.id === campaign.id
                        );
                        const item = metrics[index];

                        const advancedMetrics = [
                          { label: "CTR", value: item ? metric(item.ctr, "%") : "N/A" },
                          { label: "CPM", value: item ? money(number(item.cpm), campaign.currency) : "N/A", unavailable: item?.cpm == null },
                          { label: "CPC", value: item ? money(number(item.cpc), campaign.currency) : "N/A", unavailable: item?.cpc == null },
                          { label: "CPL", value: item ? money(number(item.cpl), campaign.currency) : "N/A", unavailable: item?.cpl == null },
                          { label: "CPA", value: item ? money(number(item.cpa), campaign.currency) : "N/A", unavailable: item?.cpa == null },
                          { label: "CR", value: item ? metric(item.cr, "%") : "N/A" },
                          { label: "EPC", value: item ? money(number(item.epc), campaign.currency) : "N/A", unavailable: item?.epc == null },
                        ];

                        return (
                          <div
                            key={campaign.id}
                            className="rounded-lg border border-[#29292e] bg-[#101012] p-4"
                          >
                            <div className="mb-4 flex items-center justify-between gap-2">
                              <h4 className="min-w-0 break-words text-sm font-semibold">
                                {campaign.name}
                              </h4>
                              <span className="shrink-0 text-xs text-[#92929a]">
                                {campaign.geo}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {advancedMetrics.map((entry) => (
                                <div key={entry.label}>
                                  <p className="text-xs text-[#92929a]">{entry.label}</p>
                                  <p className="mt-1 break-all text-lg font-semibold">
                                    {entry.unavailable ? "N/A" : entry.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <div className="rounded-xl border border-[#29292e] bg-[#151518] p-5">
                  <h3 className="mb-4 font-semibold">Campaign Performance</h3>

                  {visibleCampaigns.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[#77777f]">No campaigns found.</p>
                  ) : (
                    <>
                      <div className="space-y-3 lg:hidden">
                        {visibleCampaigns.map((campaign) => {
                          const index = campaigns.findIndex((item) => item.id === campaign.id);
                          const item = metrics[index];

                          return (
                            <div key={campaign.id} className="rounded-lg border border-[#29292e] bg-[#101012] p-4">
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="break-words font-semibold">{campaign.name}</p>
                                  <p className="mt-1 text-xs text-[#92929a]">GEO: {campaign.geo}</p>
                                </div>
                                <span className="shrink-0 rounded-md bg-[#19191c] px-2 py-1 text-xs text-[#92929a]">
                                  {campaign.currency}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-[#92929a]">Spend</p>
                                  <p className="mt-1 font-medium">{money(number(item?.spend), campaign.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#92929a]">Revenue</p>
                                  <p className="mt-1 font-medium">{money(number(item?.revenue), campaign.currency)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#92929a]">Profit</p>
                                  <p className={`mt-1 font-medium ${number(item?.profit) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                                    {money(number(item?.profit), campaign.currency)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#92929a]">ROI</p>
                                  <p className="mt-1 font-medium">{item ? metric(item.roi, "%") : "N/A"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#92929a]">ROAS</p>
                                  <p className="mt-1 font-medium text-[#ff9b26]">{item ? metric(item.roas, "x") : "N/A"}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="border-b border-[#29292e] text-xs text-[#92929a]">
                            <tr>
                              <th className="px-3 py-3">Campaign</th>
                              <th className="px-3 py-3">GEO</th>
                              <th className="px-3 py-3">Spend</th>
                              <th className="px-3 py-3">Revenue</th>
                              <th className="px-3 py-3">Profit</th>
                              <th className="px-3 py-3">ROI</th>
                              <th className="px-3 py-3">ROAS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#29292e]">
                            {visibleCampaigns.map((campaign) => {
                              const index = campaigns.findIndex((item) => item.id === campaign.id);
                              const item = metrics[index];

                              return (
                                <tr key={campaign.id}>
                                  <td className="px-3 py-4 font-medium">{campaign.name}</td>
                                  <td className="px-3 py-4 text-[#92929a]">{campaign.geo}</td>
                                  <td className="px-3 py-4">{money(number(item?.spend), campaign.currency)}</td>
                                  <td className="px-3 py-4">{money(number(item?.revenue), campaign.currency)}</td>
                                  <td className={`px-3 py-4 ${number(item?.profit) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{money(number(item?.profit), campaign.currency)}</td>
                                  <td className="px-3 py-4">{item ? metric(item.roi, "%") : "N/A"}</td>
                                  <td className="px-3 py-4">{item ? metric(item.roas, "x") : "N/A"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
