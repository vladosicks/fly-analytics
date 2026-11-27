
"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/user-menu";
import {
    getFinancialSummary,
    getDailyFinancialReport,
    getCampaignFinancialReport,
    type FinancialSummaryPoint,
    type DailyFinancialPoint,
    type CampaignFinancialPoint,
} from "@/lib/api";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
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

function exportCSV(rows: CampaignFinancialPoint[]) {
    const headers = [
        "Campaign",
        "Traffic Source",
        "Offer",
        "GEO",
        "Status",
        "Currency",
        "Spend",
        "Revenue",
        "Profit",
        "ROI",
        "ROAS",
        "Impressions",
        "Clicks",
        "Leads",
        "Conversions",
    ];

    const escape = (value: unknown) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvRows = rows.map((row) =>
        [
            row.campaign_name,
            row.traffic_source,
            row.offer_name,
            row.geo,
            row.status,
            row.currency,
            row.spend,
            row.revenue,
            row.profit,
            row.roi,
            row.roas,
            row.impressions,
            row.clicks,
            row.leads,
            row.conversions,
        ]
            .map(escape)
            .join(",")
    );

    const csv = "\uFEFF" + [headers.map(escape).join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fly-financial-report.csv";
    link.click();

    URL.revokeObjectURL(url);
}

export default function FinancialReportsPage() {
    const [summary, setSummary] = useState<FinancialSummaryPoint[]>([]);
    const [daily, setDaily] = useState<DailyFinancialPoint[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignFinancialPoint[]>([]);

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
                const filters = {
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                };

                const [summaryResponse, dailyResponse, campaignResponse] =
                    await Promise.all([
                        getFinancialSummary(filters),
                        getDailyFinancialReport(filters),
                        getCampaignFinancialReport(filters),
                    ]);

                if (!cancelled) {
                    setSummary(summaryResponse.data);
                    setDaily(dailyResponse.data);
                    setCampaigns(campaignResponse.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load financial reports"
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (dateFrom && dateTo && dateFrom > dateTo) {
            return;
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [dateFrom, dateTo]);

    const currencies = useMemo(
        () => [...new Set(summary.map((item) => item.currency))].sort(),
        [summary]
    );

    const visibleSummary = useMemo(
        () =>
            selectedCurrency === "all"
                ? summary
                : summary.filter((item) => item.currency === selectedCurrency),
        [summary, selectedCurrency]
    );

    const visibleCampaigns = useMemo(
        () =>
            selectedCurrency === "all"
                ? campaigns
                : campaigns.filter((item) => item.currency === selectedCurrency),
        [campaigns, selectedCurrency]
    );

    const visibleDaily = useMemo(
        () =>
            selectedCurrency === "all"
                ? daily
                : daily.filter((item) => item.currency === selectedCurrency),
        [daily, selectedCurrency]
    );

    const hasMixedCurrencies =
        selectedCurrency === "all" && currencies.length > 1;

    const singleCurrency =
        selectedCurrency !== "all"
            ? selectedCurrency
            : currencies.length === 1
                ? currencies[0]
                : null;

    const totals = useMemo(
        () =>
            visibleSummary.reduce(
                (acc, item) => ({
                    spend: acc.spend + number(item.spend),
                    revenue: acc.revenue + number(item.revenue),
                    profit: acc.profit + number(item.profit),
                    campaigns: acc.campaigns + item.campaign_count,
                    impressions: acc.impressions + item.impressions,
                    clicks: acc.clicks + item.clicks,
                    leads: acc.leads + item.leads,
                    conversions: acc.conversions + item.conversions,
                }),
                {
                    spend: 0,
                    revenue: 0,
                    profit: 0,
                    campaigns: 0,
                    impressions: 0,
                    clicks: 0,
                    leads: 0,
                    conversions: 0,
                }
            ),
        [visibleSummary]
    );

    const roi =
        singleCurrency && totals.spend > 0
            ? (totals.profit / totals.spend) * 100
            : null;

    const roas =
        singleCurrency && totals.spend > 0
            ? totals.revenue / totals.spend
            : null;

    const chartData = useMemo(() => {
        if (!singleCurrency) return [];

        return visibleDaily.map((item) => ({
            date: item.date,
            Spend: number(item.spend),
            Revenue: number(item.revenue),
            Profit: number(item.profit),
        }));
    }, [visibleDaily, singleCurrency]);

    const kpis = [
        {
            label: "Total Revenue",
            value: singleCurrency
                ? money(totals.revenue, singleCurrency)
                : "Multiple currencies",
            color: "text-white",
        },
        {
            label: "Ad Spend",
            value: singleCurrency
                ? money(totals.spend, singleCurrency)
                : "Multiple currencies",
            color: "text-white",
        },
        {
            label: "Net Profit",
            value: singleCurrency
                ? money(totals.profit, singleCurrency)
                : "Multiple currencies",
            color:
                singleCurrency && totals.profit >= 0
                    ? "text-[#22c55e]"
                    : singleCurrency
                        ? "text-[#ef4444]"
                        : "text-white",
        },
        {
            label: "ROI",
            value: singleCurrency ? metric(roi, "%") : "N/A",
            color:
                roi !== null && roi >= 0
                    ? "text-[#22c55e]"
                    : "text-[#ef4444]",
        },
        {
            label: "ROAS",
            value: singleCurrency ? metric(roas, "x") : "N/A",
            color: "text-[#ff9b26]",
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
                            <Link href="/" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ◫ Overview
                            </Link>
                            <Link href="/campaigns" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ▤ Campaigns
                            </Link>
                            <a href="/analytics" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ⌁ Analytics
                            </a>
                            <a href="/geo-performance" className="block rounded-lg px-4 py-3 text-sm text-[#92929a] hover:bg-[#19191c]">
                                ◎ GEO Performance
                            </a>
                            <a href="/financial-reports" className="block rounded-lg border border-[#ff8a00]/30 bg-[#ff8a00]/10 px-4 py-3 text-sm text-[#ff9b26]">
                                ▥ Financial Reports
                            </a>
                        </nav>
                    </div>
                </aside>

                <section className="min-w-0 flex-1">
                    <header className="flex h-[82px] items-center justify-between border-b border-[#29292e] px-5 sm:px-9">
                        <div>
                            <p className="text-xs text-[#77777f]">
                                Workspace / Financial Reports
                            </p>
                            <h1 className="mt-1 text-lg font-semibold">
                                Financial Reports
                            </h1>
                        </div>
                        <UserMenu />
                    </header>

                    <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
                        <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Financial Overview
                                </h2>
                                <p className="mt-2 text-sm text-[#92929a]">
                                    Track revenue, advertising costs, profit and campaign
                                    profitability.
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
                                        onChange={(event) =>
                                            setSelectedCurrency(event.target.value)
                                        }
                                        className="mt-2 block w-full rounded-lg border border-[#333338] bg-[#151518] px-4 py-3 text-sm text-white outline-none focus:border-[#ff8a00]"
                                    >
                                        <option value="all">All currencies</option>
                                        {currencies.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <button
                                    type="button"
                                    onClick={() => exportCSV(visibleCampaigns)}
                                    disabled={visibleCampaigns.length === 0}
                                    className="self-end rounded-lg bg-[#ff8a00] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#ff9b26] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Export CSV
                                </button>
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
                                values are separated by currency. Select one currency to view
                                comparable financial metrics.
                            </div>
                        )}

                        {loading ? (
                            <div className="rounded-xl border border-[#29292e] bg-[#151518] p-10 text-center text-sm text-[#92929a]">
                                Loading financial reports...
                            </div>
                        ) : (
                            <>
                                {hasMixedCurrencies ? (
                                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {visibleSummary.map((item) => (
                                            <div
                                                key={item.currency}
                                                className="rounded-xl border border-[#29292e] bg-[#151518] p-5"
                                            >
                                                <p className="mb-4 text-sm font-semibold text-[#ff9b26]">
                                                    {item.currency} Overview
                                                </p>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-[#92929a]">Revenue</span>
                                                        <span>{money(number(item.revenue), item.currency)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-[#92929a]">Ad Spend</span>
                                                        <span>{money(number(item.spend), item.currency)}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-[#92929a]">Net Profit</span>
                                                        <span className={number(item.profit) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                                                            {money(number(item.profit), item.currency)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-[#92929a]">Campaigns</span>
                                                        <span>{item.campaign_count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                                )}

                                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                                        <h3 className="font-semibold">Financial Performance</h3>
                                        <p className="mt-1 text-xs text-[#92929a]">
                                            Daily advertising spend, revenue and profit
                                        </p>
                                    </div>

                                    {singleCurrency && chartData.length > 0 ? (
                                        <div className="h-[340px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <CartesianGrid
                                                        stroke="#29292e"
                                                        strokeDasharray="3 3"
                                                        vertical={false}
                                                    />
                                                    <XAxis
                                                        dataKey="date"
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
                                                            money(Number(value), singleCurrency)
                                                        }
                                                    />
                                                    <Legend />
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
                                                    <Bar
                                                        dataKey="Profit"
                                                        fill="#3b82f6"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="flex h-[220px] items-center justify-center text-center text-sm text-[#77777f]">
                                            {hasMixedCurrencies
                                                ? "Select one currency to display the financial chart."
                                                : "No financial data available for this period."}
                                        </div>
                                    )}
                                </div>

                                <div className="overflow-hidden rounded-xl border border-[#29292e] bg-[#151518]">
                                    <div className="flex flex-col justify-between gap-3 border-b border-[#29292e] p-5 sm:flex-row sm:items-center">
                                        <div>
                                            <h3 className="font-semibold">Campaign Financial Breakdown</h3>
                                            <p className="mt-1 text-xs text-[#92929a]">
                                                Revenue, costs and profitability by campaign
                                            </p>
                                        </div>
                                        <span className="text-xs text-[#92929a]">
                                            {visibleCampaigns.length} campaigns
                                        </span>
                                    </div>

                                    {visibleCampaigns.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[1050px] text-left text-sm">
                                                <thead className="bg-[#19191c] text-xs text-[#92929a]">
                                                    <tr>
                                                        <th className="px-5 py-4">Campaign</th>
                                                        <th className="px-4 py-4">GEO</th>
                                                        <th className="px-4 py-4">Currency</th>
                                                        <th className="px-4 py-4">Spend</th>
                                                        <th className="px-4 py-4">Revenue</th>
                                                        <th className="px-4 py-4">Profit</th>
                                                        <th className="px-4 py-4">ROI</th>
                                                        <th className="px-4 py-4">ROAS</th>
                                                        <th className="px-4 py-4">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#29292e]">
                                                    {visibleCampaigns.map((campaign) => (
                                                        <tr
                                                            key={campaign.campaign_id}
                                                            className="transition hover:bg-[#1b1b1f]"
                                                        >
                                                            <td className="px-5 py-4">
                                                                <p className="font-medium">{campaign.campaign_name}</p>
                                                                <p className="mt-1 text-xs text-[#77777f]">
                                                                    {campaign.traffic_source || "No source"}
                                                                </p>
                                                            </td>
                                                            <td className="px-4 py-4 text-[#c5c5cc]">
                                                                {campaign.geo || "—"}
                                                            </td>
                                                            <td className="px-4 py-4">{campaign.currency}</td>
                                                            <td className="px-4 py-4">
                                                                {money(number(campaign.spend), campaign.currency)}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {money(number(campaign.revenue), campaign.currency)}
                                                            </td>
                                                            <td className={`px-4 py-4 font-semibold ${number(campaign.profit) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                                                                {money(number(campaign.profit), campaign.currency)}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {metric(campaign.roi, "%")}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {metric(campaign.roas, "x")}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="rounded-full bg-[#252529] px-3 py-1 text-xs text-[#c5c5cc]">
                                                                    {campaign.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center text-sm text-[#77777f]">
                                            No campaigns found for the selected filters.
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
