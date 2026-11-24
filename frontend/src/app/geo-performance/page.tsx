"use client";

import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/user-menu";
import {
  getGeoPerformance,
  type GeoPerformancePoint,
} from "@/lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function getDate(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function number(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
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

function metric(
  value: number | string | null | undefined,
  suffix = ""
): string {
  return value === null || value === undefined
    ? "N/A"
    : `${number(value).toFixed(2)}${suffix}`;
}

export default function GeoPerformancePage() {
  const [data, setData] = useState<GeoPerformancePoint[]>([]);
  const [dateFrom, setDateFrom] = useState(getDate(29));
  const [dateTo, setDateTo] = useState(getDate());
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await getGeoPerformance({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        });

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load GEO performance"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError("Start date cannot be later than end date.");
      setLoading(false);
      return;
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [dateFrom, dateTo]);

  const currencies = useMemo(
    () => [...new Set(data.map((item) => item.currency))].sort(),
    [data]
  );

  const visibleData = useMemo(
    () =>
      selectedCurrency === "all"
        ? data
        : data.filter((item) => item.currency === selectedCurrency),
    [data, selectedCurrency]
  );

  const hasMixedCurrencies = selectedCurrency === "all" && currencies.length > 1;

  const totals = useMemo(
    () =>
      visibleData.reduce(
        (acc, item) => ({
          spend: acc.spend + number(item.spend),
          revenue: acc.revenue + number(item.revenue),
          profit: acc.profit + number(item.profit),
          campaigns: acc.campaigns + item.campaign_count,
          impressions: acc.impressions + item.impressions,
          clicks: acc.clicks + item.clicks,
          conversions: acc.conversions + item.conversions,
        }),
        {
          spend: 0,
          revenue: 0,
          profit: 0,
          campaigns: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
        }
      ),
    [visibleData]
  );

  const roi =
    !hasMixedCurrencies && totals.spend > 0
      ? (totals.profit / totals.spend) * 100
      : null;

  const roas =
    !hasMixedCurrencies && totals.spend > 0
      ? totals.revenue / totals.spend
      : null;

  const currency =
    selectedCurrency === "all"
      ? currencies.length === 1
        ? currencies[0]
        : "USD"
      : selectedCurrency;

  const rankedData = useMemo(
    () =>
      [...visibleData].sort(
        (a, b) => number(b.profit) - number(a.profit)
      ),
    [visibleData]
  );

  const chartData = useMemo(
    () =>
      hasMixedCurrencies
        ? []
        : rankedData.map((item) => ({
            geo: item.geo,
            Spend: number(item.spend),
            Revenue: number(item.revenue),
            Profit: number(item.profit),
          })),
    [rankedData, hasMixedCurrencies]
  );

  const kpis = [
    {
      label: "Total Spend",
      value: hasMixedCurrencies
        ? "Multiple currencies"
        : money(totals.spend, currency),
      color: "text-white",
    },
    {
      label: "Total Revenue",
      value: hasMixedCurrencies
        ? "Multiple currencies"
        : money(totals.revenue, currency),
      color: "text-white",
    },
    {
      label: "Net Profit",
      value: hasMixedCurrencies
        ? "Multiple currencies"
        : money(totals.profit, currency),
      color: hasMixedCurrencies
        ? "text-white"
        : totals.profit >= 0
          ? "text-[#22c55e]"
          : "text-[#ef4444]",
    },
    {
      label: "Average ROI",
      value: hasMixedCurrencies ? "N/A" : metric(roi, "%"),
      color: roi !== null && roi >= 0
        ? "text-[#22c55e]"
        : "text-[#ef4444]",
    },
  ];

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
              <a href="/campaigns" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                ▤ Campaigns
              </a>
              <a href="/analytics" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                ⌁ Analytics
              </a>
              <a href="/geo-performance" className="block rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-3 text-sm text-[#ff9b26]">
                ◎ GEO Performance
              </a>
              <a href="/#reports" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                ▥ Financial Reports
              </a>
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[82px] items-center justify-between border-b border-[#29292e] px-5 sm:px-9">
            <div>
              <p className="text-xs text-[#77777f]">
                Workspace / GEO Performance
              </p>
              <h1 className="mt-1 text-lg font-semibold">
                GEO Performance
              </h1>
            </div>
            <UserMenu />
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div>
                <h2 className="text-2xl font-bold">
                  Geographic Performance
                </h2>
                <p className="mt-2 text-sm text-[#92929a]">
                  Compare advertising performance and profitability across GEOs.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="text-xs text-[#92929a]">
                  From
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="mt-2 block w-full rounded-lg border border-[#333338] bg-[#151518] px-3 py-3 text-sm text-white outline-none focus:border-[#ff8a00]"
                  />
                </label>

                <label className="text-xs text-[#92929a]">
                  To
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="mt-2 block w-full rounded-lg border border-[#333338] bg-[#151518] px-3 py-3 text-sm text-white outline-none focus:border-[#ff8a00]"
                  />
                </label>

                <label className="text-xs text-[#92929a]">
                  Currency
                  <select
                    value={selectedCurrency}
                    onChange={(event) => setSelectedCurrency(event.target.value)}
                    className="mt-2 block w-full rounded-lg border border-[#333338] bg-[#151518] px-4 py-3 text-sm text-white outline-none focus:border-[#ff8a00]"
                  >
                    <option value="all">All currencies</option>
                    {currencies.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {hasMixedCurrencies && !loading && (
              <div className="mb-5 rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/10 p-4 text-sm text-[#ffb454]">
                Multiple currencies are present. Financial totals and chart
                values are hidden to prevent mixing currencies. Select one
                currency to view comparable financial metrics.
              </div>
            )}

            {loading ? (
              <div className="rounded-xl border border-[#29292e] bg-[#151518] p-10 text-center text-sm text-[#92929a]">
                Loading GEO performance...
              </div>
            ) : (
              <>
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-[#29292e] bg-[#151518] p-5"
                    >
                      <p className="text-xs text-[#92929a]">{item.label}</p>
                      <p className={`mt-3 break-all text-2xl font-bold ${item.color}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    { label: "Campaigns", value: totals.campaigns },
                    { label: "Impressions", value: totals.impressions },
                    { label: "Clicks", value: totals.clicks },
                    { label: "Conversions", value: totals.conversions },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-[#29292e] bg-[#151518] p-4"
                    >
                      <p className="text-xs text-[#92929a]">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold">
                        {item.value.toLocaleString("en-US")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-5 rounded-xl border border-[#29292e] bg-[#151518] p-5">
                  <div className="mb-5">
                    <h3 className="font-semibold">GEO Comparison</h3>
                    <p className="mt-1 text-xs text-[#92929a]">
                      Advertising spend vs. generated revenue
                    </p>
                  </div>

                  {chartData.length > 0 ? (
                    <div className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid
                            stroke="#29292e"
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="geo"
                            tick={{ fill: "#92929a", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fill: "#92929a", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#19191c",
                              border: "1px solid #333338",
                              borderRadius: 8,
                              color: "#f5f5f5",
                            }}
                            formatter={(value) =>
                              money(Number(value), currency)
                            }
                          />
                          <Bar
                            dataKey="Spend"
                            fill="#ff8a00"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="Revenue"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-center text-sm text-[#77777f]">
                      {hasMixedCurrencies
                        ? "Select a currency to display the comparison chart."
                        : "No GEO data available for this period."}
                    </div>
                  )}
                </div>

                <div className="mb-5 rounded-xl border border-[#29292e] bg-[#151518] p-5">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">GEO Ranking</h3>
                      <p className="mt-1 text-xs text-[#92929a]">
                        Countries ranked by net profit
                      </p>
                    </div>
                    <span className="rounded-lg border border-[#333338] bg-[#1c1c20] px-3 py-2 text-xs text-[#92929a]">
                      {rankedData.length} GEOs
                    </span>
                  </div>

                  {rankedData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[#77777f]">
                      No GEO data available for this period.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {rankedData.slice(0, 5).map((item, index) => {
                        const maxProfit = Math.max(
                          1,
                          ...rankedData.map((entry) =>
                            Math.max(number(entry.profit), 0)
                          )
                        );
                        const width = Math.max(
                          0,
                          (number(item.profit) / maxProfit) * 100
                        );

                        return (
                          <div key={`${item.geo}-${item.currency}`}>
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#242428] text-xs font-semibold text-[#ff9b26]">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">
                                    {item.geo}
                                  </p>
                                  <p className="text-xs text-[#77777f]">
                                    {item.campaign_count} campaigns
                                  </p>
                                </div>
                              </div>
                              <span className={`shrink-0 text-sm font-semibold ${
                                number(item.profit) >= 0
                                  ? "text-[#22c55e]"
                                  : "text-[#ef4444]"
                              }`}>
                                {money(number(item.profit), item.currency)}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-[#303036]">
                              <div
                                className={`h-full rounded-full ${
                                  number(item.profit) >= 0
                                    ? "bg-[#22c55e]"
                                    : "bg-[#ef4444]"
                                }`}
                                style={{ width: `${Math.min(width, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[#29292e] bg-[#151518] p-5">
                  <div className="mb-5">
                    <h3 className="font-semibold">GEO Performance Details</h3>
                    <p className="mt-1 text-xs text-[#92929a]">
                      Detailed advertising and conversion metrics by country
                    </p>
                  </div>

                  {rankedData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[#77777f]">
                      No performance records found.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1050px] text-left text-sm">
                        <thead className="border-b border-[#29292e] text-xs text-[#92929a]">
                          <tr>
                            <th className="px-3 py-3">GEO</th>
                            <th className="px-3 py-3">Campaigns</th>
                            <th className="px-3 py-3">Clicks</th>
                            <th className="px-3 py-3">Conversions</th>
                            <th className="px-3 py-3">Spend</th>
                            <th className="px-3 py-3">Revenue</th>
                            <th className="px-3 py-3">Profit</th>
                            <th className="px-3 py-3">ROI</th>
                            <th className="px-3 py-3">ROAS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#29292e]">
                          {rankedData.map((item) => (
                            <tr key={`${item.geo}-${item.currency}`}>
                              <td className="px-3 py-4 font-semibold">
                                {item.geo}
                                <span className="ml-2 text-xs text-[#77777f]">
                                  {item.currency}
                                </span>
                              </td>
                              <td className="px-3 py-4">
                                {item.campaign_count}
                              </td>
                              <td className="px-3 py-4">
                                {item.clicks.toLocaleString("en-US")}
                              </td>
                              <td className="px-3 py-4">
                                {item.conversions.toLocaleString("en-US")}
                              </td>
                              <td className="px-3 py-4">
                                {money(number(item.spend), item.currency)}
                              </td>
                              <td className="px-3 py-4">
                                {money(number(item.revenue), item.currency)}
                              </td>
                              <td className={`px-3 py-4 font-semibold ${
                                number(item.profit) >= 0
                                  ? "text-[#22c55e]"
                                  : "text-[#ef4444]"
                              }`}>
                                {money(number(item.profit), item.currency)}
                              </td>
                              <td className="px-3 py-4">
                                {metric(item.roi, "%")}
                              </td>
                              <td className="px-3 py-4 text-[#ff9b26]">
                                {metric(item.roas, "x")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
