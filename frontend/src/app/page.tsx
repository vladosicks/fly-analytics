"use client";

import { useEffect, useState } from "react";
import {
  getCampaigns,
  getCampaignAnalytics,
  getProfitOverTime,
  type Campaign,
  type CampaignAnalytics,
  type ProfitOverTimePoint,
} from "@/lib/api";


const navigation = [
  { label: "Overview", icon: "◫", href: "/", active: true },
  { label: "Campaigns", icon: "▤", href: "/campaigns", active: false },
  { label: "Analytics", icon: "⌁", href: "/analytics", active: false },
  { label: "GEO Performance", icon: "◎", href: null, active: false },
  { label: "Financial Reports", icon: "▥", href: null, active: false },
];

const campaigns = [
  { name: "Nutra | Germany", network: "Meta Ads", geo: "DE", spend: "$1,240.00", revenue: "$2,180.00", profit: "+$940.00", roi: "75.8%", status: "Active" },
  { name: "Dating | Brazil", network: "TikTok Ads", geo: "BR", spend: "$860.00", revenue: "$1,120.00", profit: "+$260.00", roi: "30.2%", status: "Active" },
  { name: "Sweepstakes | Poland", network: "Meta Ads", geo: "PL", spend: "$640.00", revenue: "$420.00", profit: "-$220.00", roi: "-34.4%", status: "Paused" },
  { name: "Nutra | Spain", network: "Google Ads", geo: "ES", spend: "$520.00", revenue: "$890.00", profit: "+$370.00", roi: "71.1%", status: "Active" },
];

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-lg leading-none">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
  positive = true,
}: {
  label: string;
  value: string;
  change: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#29292e] bg-[#151518] p-5 transition hover:border-[#48403a]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#92929a]">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff8a00]/10 text-lg text-[#ff8a00]">
          {icon}
        </span>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className={positive ? "text-[#22c55e]" : "text-[#ef4444]"}>
          {change}
        </span>
        <span className="text-[#77777f]">vs. previous period</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics[]>([]);
  const [profitData, setProfitData] = useState<ProfitOverTimePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [campaignData, profitResponse] = await Promise.all([
          getCampaigns(),
          getProfitOverTime(),
        ]);

        const analyticsData = await Promise.all(
          campaignData.map((campaign) =>
            getCampaignAnalytics(campaign.id)
          )
        );

        if (!cancelled) {
          setCampaigns(campaignData);
          setAnalytics(analyticsData);
          setProfitData(profitResponse.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalRevenue = analytics.reduce(
    (sum, item) => sum + Number(item.metrics.revenue),
    0
  );

  const totalSpend = analytics.reduce(
    (sum, item) => sum + Number(item.metrics.spend),
    0
  );

  const totalProfit = totalRevenue - totalSpend;

  const totalConversions = analytics.reduce(
    (sum, item) => sum + item.metrics.conversions,
    0
  );

  const totalClicks = analytics.reduce(
    (sum, item) => sum + item.metrics.clicks,
    0
  );

  const conversionRate =
    totalClicks > 0
      ? (totalConversions / totalClicks) * 100
      : null;

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status.toLowerCase() === "active"
  ).length;

  const currencies = [...new Set(
    campaigns.map((campaign) => campaign.currency.toUpperCase())
  )];

  const hasMixedCurrencies = currencies.length > 1;
  const currency = currencies[0] ?? "USD";

  const totalRoi =
    !hasMixedCurrencies && totalSpend > 0
      ? (totalProfit / totalSpend) * 100
      : null;

  const formatMoney = (value: number) =>
    hasMixedCurrencies
      ? "Multiple currencies"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
        }).format(value);

  const chartValues = hasMixedCurrencies
    ? []
    : profitData.map((item) => Number(item.profit));

  const chartMin = Math.min(0, ...chartValues);
  const chartMax = Math.max(0, ...chartValues);
  const chartRange = chartMax - chartMin || 1;

  const chartPoints = profitData.map((item, index) => {
    const x =
      profitData.length === 1
        ? 365
        : 45 + (index / (profitData.length - 1)) * 640;

    const y = 185 - ((Number(item.profit) - chartMin) / chartRange) * 150;

    return {
      x,
      y,
      date: item.date,
      profit: Number(item.profit),
    };
  });

  const chartLine = chartPoints
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const chartArea =
    chartPoints.length > 0
      ? `${chartLine} L ${chartPoints[chartPoints.length - 1].x} 200 L ${chartPoints[0].x} 200 Z`
      : "";

  const chartTotalProfit = chartValues.reduce(
    (sum, value) => sum + value,
    0
  );

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-[#f5f5f5]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[250px] shrink-0 border-r border-[#242428] bg-[#101012] lg:flex lg:flex-col">
          <div className="flex h-[76px] items-center gap-3 border-b border-[#242428] px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff8a00] text-lg font-black text-black">
              F
            </div>
            <div>
              <div className="text-lg font-bold tracking-wide">
                FLY<span className="text-[#ff8a00]">.</span>ANALYTICS
              </div>
              <div className="text-[10px] tracking-[2px] text-[#77777f]">
                PERFORMANCE PLATFORM
              </div>
            </div>
          </div>

          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[1.8px] text-[#66666e]">
              Workspace
            </p>
            <nav className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.label}
                  href={item.href ?? undefined}
                  aria-disabled={!item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${item.active
                    ? "border border-[#ff8a00]/20 bg-[#ff8a00]/10 font-medium text-[#ff9b26]"
                    : "text-[#92929a] hover:bg-[#1b1b1f] hover:text-white"
                    }`}
                >
                  <Icon>{item.icon}</Icon>
                  {item.label}
                  {item.active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ff8a00]" />
                  )}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-[#242428] p-4">
            <div className="rounded-xl border border-[#29292e] bg-[#171719] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff8a00]/15 text-sm text-[#ff8a00]">
                  V
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">My Workspace</p>
                  <p className="text-xs text-[#77777f]">Free plan</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#303036]">
                <div className="h-full w-[35%] rounded-full bg-[#ff8a00]" />
              </div>
              <p className="mt-2 text-[11px] text-[#77777f]">
                7 of 20 campaigns used
              </p>
              <a href="#" className="mt-3 block text-xs font-medium text-[#ff9b26]">
                Upgrade plan →
              </a>
            </div>
            <div className="mt-4 flex items-center gap-3 px-2 py-2 text-sm text-[#92929a]">
              <span>⚙</span>
              Settings
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="min-w-0 flex-1">
          {/* Header */}
          <header className="flex h-[76px] items-center justify-between border-b border-[#242428] px-5 sm:px-8">
            <div>
              <p className="text-xs text-[#77777f]">Workspace / Overview</p>
              <h1 className="mt-1 text-lg font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-lg border border-[#29292e] bg-[#151518] px-3 py-2 text-xs text-[#92929a] sm:block">
                November 2026
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#333338] bg-[#19191c] text-sm font-semibold">
                V
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            {/* Welcome */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-[#92929a]">Saturday, November 22, 2026</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome back<span className="text-[#ff8a00]">.</span>
                </h2>
                <p className="mt-2 text-sm text-[#92929a]">
                  Here&apos;s what&apos;s happening with your campaigns today.
                </p>
              </div>
              <a
                href="#campaigns"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ff8a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ffa12e]"
              >
                <span className="text-lg">+</span>
                New campaign
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Revenue"
                value={formatMoney(totalRevenue)}
                change={loading ? "Loading..." : "Live data"}
                icon="↗"
              />
              <StatCard
                label="Total Ad Spend"
                value={formatMoney(totalSpend)}
                change={loading ? "Loading..." : "Live data"}
                icon="↗"
              />
              <StatCard
                label="Net Profit"
                value={formatMoney(totalProfit)}
                change={loading ? "Loading..." : "Live data"}
                icon="$"
                positive={hasMixedCurrencies || totalProfit >= 0}
              />
              <StatCard
                label="Average ROI"
                value={hasMixedCurrencies ? "N/A" : totalRoi === null ? "N/A" : `${totalRoi.toFixed(1)}%`}
                change={loading ? "Loading..." : "Live data"}
                icon="%"
                positive={totalRoi === null || totalRoi >= 0}
              />
            </div>

            {/* Chart and summary */}
            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
              <div className="rounded-xl border border-[#29292e] bg-[#151518] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Profit overview</h3>
                    <p className="mt-1 text-xs text-[#77777f]">
                      Your campaign performance over time
                    </p>
                  </div>
                  <span className="rounded-lg border border-[#333338] bg-[#1c1c20] px-3 py-2 text-xs text-[#c4c4ca]">
                    Last 30 days⌄
                  </span>
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <span className="text-3xl font-bold">
                    {hasMixedCurrencies ? "Multiple currencies" : formatMoney(chartTotalProfit)}
                  </span>
                  <span className="mb-1 text-xs font-medium text-[#92929a]">
                    Total net profit
                  </span>
                </div>

                <div className="mt-5 w-full">
                  {loading ? (
                    <div className="flex h-[230px] items-center justify-center text-sm text-[#77777f]">
                      Loading chart data...
                    </div>
                  ) : error ? (
                    <div className="flex h-[230px] items-center justify-center text-sm text-[#ef4444]">
                      Unable to load chart data
                    </div>
                  ) : hasMixedCurrencies ? (
                    <div className="flex h-[230px] items-center justify-center text-center text-sm text-[#ffb454]">
                      Profit chart unavailable because campaigns use different currencies.
                    </div>
                  ) : chartPoints.length === 0 ? (
                    <div className="flex h-[230px] items-center justify-center text-sm text-[#77777f]">
                      No profit data available yet
                    </div>
                  ) : (
                    <svg
                      viewBox="0 0 700 230"
                      className="h-auto w-full"
                      role="img"
                      aria-label="Net profit over time"
                    >
                      <defs>
                        <linearGradient
                          id="profitGradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#ff8a00" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#ff8a00" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {[35, 85, 135, 185].map((y) => (
                        <line
                          key={y}
                          x1="45"
                          y1={y}
                          x2="685"
                          y2={y}
                          stroke="#303036"
                          strokeDasharray="4 5"
                        />
                      ))}

                      {chartPoints.length > 1 && (
                        <>
                          <path
                            d={chartArea}
                            fill="url(#profitGradient)"
                          />
                          <path
                            d={chartLine}
                            fill="none"
                            stroke="#ff8a00"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      )}

                      {chartPoints.map((point) => (
                        <circle
                          key={point.date}
                          cx={point.x}
                          cy={point.y}
                          r="5"
                          fill="#ff8a00"
                          stroke="#151518"
                          strokeWidth="3"
                        />
                      ))}

                      {chartPoints.map((point, index) => {
                        const visible =
                          index === 0 ||
                          index === Math.floor((chartPoints.length - 1) / 2) ||
                          index === chartPoints.length - 1;

                        if (!visible) return null;

                        return (
                          <text
                            key={`date-${point.date}`}
                            x={point.x}
                            y="222"
                            fill="#77777f"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {new Date(`${point.date}T00:00:00`).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "2-digit" }
                            )}
                          </text>
                        );
                      })}
                    </svg>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-5 text-xs text-[#92929a]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#ff8a00]" />
                    Net profit
                  </span>
                  <span className="text-[#66666e]">
                    Actual campaign data · Last 30 days
                  </span>
                </div>

              </div>

              {/* Performance summary */}
              <div className="rounded-xl border border-[#29292e] bg-[#151518] p-5 sm:p-6">
                <h3 className="font-semibold">Performance summary</h3>
                <p className="mt-1 text-xs text-[#77777f]">
                  Key campaign indicators
                </p>

                <div className="mt-7 space-y-6">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#92929a]">Conversion rate</span>
                      <span className="font-semibold">
                        {loading
                          ? "Loading..."
                          : conversionRate === null
                            ? "N/A"
                            : `${conversionRate.toFixed(2)}%`}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#303036]">
                      <div
                        className="h-full rounded-full bg-[#ff8a00] transition-all"
                        style={{
                          width: `${Math.min(Math.max(conversionRate ?? 0, 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#92929a]">Approval rate</span>
                      <span className="font-semibold text-[#92929a]">N/A</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#303036]" />
                    <p className="mt-2 text-xs text-[#66666e]">
                      Requires confirmed conversion data
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#92929a]">Active campaigns</span>
                      <span className="font-semibold">
                        {loading ? "Loading..." : `${activeCampaigns} / ${campaigns.length}`}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#303036]">
                      <div
                        className="h-full rounded-full bg-[#ff8a00] transition-all"
                        style={{
                          width: `${campaigns.length > 0
                            ? (activeCampaigns / campaigns.length) * 100
                            : 0
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg border border-[#ff8a00]/20 bg-[#ff8a00]/[0.06] p-4">
                  <p className="text-xs font-medium text-[#ff9b26]">
                    Performance insight
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#c4c4ca]">
                    {loading
                      ? "Analyzing campaign performance..."
                      : campaigns.length === 0
                        ? "Add your first campaign to start analyzing performance."
                        : totalProfit > 0
                          ? `Your campaigns are generating ${formatMoney(totalProfit)} in net profit.`
                          : totalProfit < 0
                            ? `Your campaigns are currently generating a net loss of ${formatMoney(Math.abs(totalProfit))}.`
                            : "Your campaigns are currently breaking even."}
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign table */}
            <div id="campaigns" className="mt-6 overflow-hidden rounded-xl border border-[#29292e] bg-[#151518]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#29292e] p-5 sm:px-6">
                <div>
                  <h3 className="font-semibold">Recent campaigns</h3>
                  <p className="mt-1 text-xs text-[#77777f]">
                    Overview of your latest advertising activity
                  </p>
                </div>
                <a href="#campaigns" className="text-xs font-medium text-[#ff9b26] hover:text-[#ffb45e]">
                  View all campaigns →
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-[#19191c] text-[11px] uppercase tracking-wider text-[#77777f]">
                    <tr>
                      <th className="px-6 py-4 font-medium">Campaign</th>
                      <th className="px-4 py-4 font-medium">GEO</th>
                      <th className="px-4 py-4 font-medium">Spend</th>
                      <th className="px-4 py-4 font-medium">Revenue</th>
                      <th className="px-4 py-4 font-medium">Profit</th>
                      <th className="px-4 py-4 font-medium">ROI</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#29292e]">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-[#92929a]">
                          Loading campaigns...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-[#ef4444]">
                          {error}
                        </td>
                      </tr>
                    ) : campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-[#92929a]">
                          No campaigns yet. Create your first campaign.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((campaign) => {
                        const result = analytics.find(
                          (item) => item.campaign_id === campaign.id
                        );

                        const spend = Number(result?.metrics.spend ?? 0);
                        const revenue = Number(result?.metrics.revenue ?? 0);
                        const profit = revenue - spend;
                        const roi = result?.metrics.roi;

                        const money = (value: number) =>
                          new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: campaign.currency,
                          }).format(value);

                        return (
                          <tr key={campaign.id} className="transition hover:bg-[#1b1b1f]">
                            <td className="px-6 py-4">
                              <p className="font-medium text-white">{campaign.name}</p>
                              <p className="mt-1 text-xs text-[#77777f]">
                                {campaign.traffic_source}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-[#c4c4ca]">{campaign.geo}</td>
                            <td className="px-4 py-4 text-[#c4c4ca]">{money(spend)}</td>
                            <td className="px-4 py-4 text-[#c4c4ca]">{money(revenue)}</td>
                            <td className={`px-4 py-4 font-medium ${profit >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                              {money(profit)}
                            </td>
                            <td className={`px-4 py-4 font-medium ${roi == null ? "text-[#92929a]" : Number(roi) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                              {roi == null ? "—" : `${Number(roi).toFixed(1)}%`}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] ${campaign.status.toLowerCase() === "active" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#77777f]/10 text-[#92929a]"}`}>
                                {campaign.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#29292e] px-6 py-3 text-xs text-[#66666e]">
                Data stored in FLY Analytics · Ad network integrations coming soon              </div>
            </div>

            <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#242428] py-5 text-xs text-[#66666e] sm:flex-row">
              <span>© 2026 FLY Analytics. All rights reserved.</span>
              <span>Performance starts with data.</span>
            </footer>
          </div>
        </section >
      </div >
    </main >
  );
}
