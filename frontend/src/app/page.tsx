
const navigation = [
  { label: "Overview", icon: "◫", active: true },
  { label: "Campaigns", icon: "▤" },
  { label: "Analytics", icon: "⌁" },
  { label: "GEO Performance", icon: "◎" },
  { label: "Financial Reports", icon: "▥" },
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
                  href="#"
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                    item.active
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
              <StatCard label="Total Revenue" value="$12,840.00" change="+18.6%" icon="↗" />
              <StatCard label="Total Ad Spend" value="$5,240.00" change="+8.2%" icon="↗" />
              <StatCard label="Net Profit" value="$7,600.00" change="+24.3%" icon="$" />
              <StatCard label="Average ROI" value="145.0%" change="+12.8%" icon="%" />
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
                  <span className="text-3xl font-bold">$7,600</span>
                  <span className="mb-1 text-xs font-medium text-[#22c55e]">↑ 24.3%</span>
                </div>

                <div className="mt-5 w-full">
                  <svg viewBox="0 0 700 230" className="h-auto w-full" role="img" aria-label="Illustrative profit trend chart">
                    <defs>
                      <linearGradient id="profitGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ff8a00" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#ff8a00" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[35, 85, 135, 185].map((y) => (
                      <line key={y} x1="45" y1={y} x2="685" y2={y} stroke="#303036" strokeDasharray="4 5" />
                    ))}
                    <path
                      d="M45 175 C85 160 95 170 130 145 S190 155 225 120 S285 135 320 105 S380 120 415 82 S480 100 515 68 S580 83 615 45 S655 54 685 28 L685 200 L45 200 Z"
                      fill="url(#profitGradient)"
                    />
                    <path
                      d="M45 175 C85 160 95 170 130 145 S190 155 225 120 S285 135 320 105 S380 120 415 82 S480 100 515 68 S580 83 615 45 S655 54 685 28"
                      fill="none"
                      stroke="#ff8a00"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="685" cy="28" r="5" fill="#ff8a00" stroke="#151518" strokeWidth="3" />
                    {["Oct 24", "Oct 29", "Nov 03", "Nov 08", "Nov 13", "Nov 18", "Nov 22"].map((label, i) => (
                      <text key={label} x={45 + i * 106} y="222" fill="#77777f" fontSize="10" textAnchor="middle">
                        {label}
                      </text>
                    ))}
                  </svg>
                </div>
                <div className="mt-3 flex items-center gap-5 text-xs text-[#92929a]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#ff8a00]" />
                    Net profit
                  </span>
                  <span className="text-[#66666e]">Illustrative demo data</span>
                </div>
              </div>

              {/* Performance summary */}
              <div className="rounded-xl border border-[#29292e] bg-[#151518] p-5 sm:p-6">
                <h3 className="font-semibold">Performance summary</h3>
                <p className="mt-1 text-xs text-[#77777f]">Key campaign indicators</p>

                <div className="mt-7 space-y-6">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#92929a]">Conversion rate</span>
                      <span className="font-semibold">4.82%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#303036]">
                      <div className="h-full w-[68%] rounded-full bg-[#ff8a00]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#92929a]">Approval rate</span>
                      <span className="font-semibold">68.4%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#303036]">
                      <div className="h-full w-[68.4%] rounded-full bg-[#22c55e]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#92929a]">Active campaigns</span>
                      <span className="font-semibold">12 / 20</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[#303036]">
                      <div className="h-full w-[60%] rounded-full bg-[#ff8a00]" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg border border-[#ff8a00]/20 bg-[#ff8a00]/[0.06] p-4">
                  <p className="text-xs font-medium text-[#ff9b26]">Performance insight</p>
                  <p className="mt-2 text-sm leading-6 text-[#c4c4ca]">
                    Your current demo data shows positive overall campaign profitability.
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
                <table className="w-full min-w-[760px] text-left text-sm">
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
                    {campaigns.map((campaign) => (
                      <tr key={campaign.name} className="transition hover:bg-[#1b1b1f]">
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{campaign.name}</p>
                          <p className="mt-1 text-xs text-[#77777f]">{campaign.network}</p>
                        </td>
                        <td className="px-4 py-4 text-[#c4c4ca]">{campaign.geo}</td>
                        <td className="px-4 py-4 text-[#c4c4ca]">{campaign.spend}</td>
                        <td className="px-4 py-4 text-[#c4c4ca]">{campaign.revenue}</td>
                        <td className={`px-4 py-4 font-medium ${campaign.profit.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {campaign.profit}
                        </td>
                        <td className={`px-4 py-4 font-medium ${campaign.roi.startsWith("-") ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
                          {campaign.roi}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] ${campaign.status === "Active" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#77777f]/10 text-[#92929a]"}`}>
                            {campaign.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#29292e] px-6 py-3 text-xs text-[#66666e]">
                Sample campaign data · Not connected to a live advertising account
              </div>
            </div>

            <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#242428] py-5 text-xs text-[#66666e] sm:flex-row">
              <span>© 2026 FLY Analytics. All rights reserved.</span>
              <span>Performance starts with data.</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
