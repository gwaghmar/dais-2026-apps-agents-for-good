import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@databricks/appkit-ui/react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@databricks/appkit-ui/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingDown, Database, Zap, Globe, ArrowDown, CheckCircle2 } from 'lucide-react';

interface ScopeSummary { scope: number; co2e_tonnes: number }
interface BreakdownRow {
  scope: number; category: string; category_label: string;
  activity_unit: string; source: string; activity_value: number; co2e_tonnes: number;
}
interface EmissionsData {
  summary: ScopeSummary[]; breakdown: BreakdownRow[];
  total_co2e_tonnes: number; year: number;
}
interface TrendEntry { quarter: string; scope1?: number; scope2?: number; scope3?: number }

const S = { 1: '#ef4444', 2: '#f97316', 3: '#3b82f6' } as const;
const SL = { 1: 'Scope 1 · Direct', 2: 'Scope 2 · Energy', 3: 'Scope 3 · Value Chain' } as const;
const SI = { 1: Database, 2: Zap, 3: Globe } as const;

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}
function fmtN(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

const chartConfig = {
  scope1: { label: 'Scope 1', color: '#ef4444' },
  scope2: { label: 'Scope 2', color: '#f97316' },
  scope3: { label: 'Scope 3', color: '#3b82f6' },
} as const;

const SCOPE_DESCRIPTIONS: Record<number, string> = {
  1: 'Direct combustion from owned/controlled sources',
  2: 'Indirect from purchased electricity & steam',
  3: 'All other indirect emissions in the value chain',
};

export function DashboardPage() {
  const [data, setData] = useState<EmissionsData | null>(null);
  const [trend, setTrend] = useState<TrendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/emissions').then((r) => r.json()),
      fetch('/api/trend').then((r) => r.json()),
    ])
      .then(([em, tr]) => {
        setData(em as EmissionsData);
        setTrend((tr as { trend: TrendEntry[] }).trend ?? []);
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading emissions data from Lakebase...</p>
      </div>
    );
  }
  if (error) return <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm">Error: {error}</div>;
  if (!data) return null;

  const total = data.total_co2e_tonnes;

  const pieData = [1, 2, 3].map((scope) => {
    const row = data.summary.find((s) => Number(s.scope) === scope);
    return { name: `S${scope}`, value: row ? Number(row.co2e_tonnes) : 0 };
  });

  const barData = data.breakdown
    .filter((_, i) => i < 8)
    .map((r) => ({
      name: r.category_label.replace('Purchased Goods & Services', 'Purch. Goods').replace('Employee Commuting', 'Commuting').replace('Upstream Freight', 'Freight'),
      value: Number(r.co2e_tonnes),
      scope: r.scope,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GHG Emissions Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acme Corporation · FY2025 · GHG Protocol Corporate Standard · Materiality threshold: 1% of total
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-full px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live · Lakebase Postgres
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total GHG Emissions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-bold tracking-tight">{fmt(total)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">tCO₂e · FY2025</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
              <ArrowDown className="h-3 w-3" />
              <span>Target: −42% by 2030 (SBTi 1.5°C)</span>
            </div>
          </CardContent>
        </Card>

        {([1, 2, 3] as const).map((scope) => {
          const row = data.summary.find((s) => Number(s.scope) === scope);
          const val = row ? Number(row.co2e_tonnes) : 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
          const Icon = SI[scope];
          return (
            <Card key={scope} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-1" style={{ backgroundColor: S[scope] }} />
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" style={{ color: S[scope] }} />
                  {SL[scope]}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-3xl font-bold tracking-tight">{fmt(val)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">tCO₂e · {pct}% of total</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{SCOPE_DESCRIPTIONS[scope]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quarterly trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              Quarterly Emissions Trend (FY2025)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-52 w-full">
              <LineChart data={trend} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="scope1" stroke="var(--color-scope1)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="scope2" stroke="var(--color-scope2)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="scope3" stroke="var(--color-scope3)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Scope pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Emissions by Scope</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer config={chartConfig} className="h-44 w-full">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={[S[1], S[2], S[3]][i]} />
                  ))}
                </Pie>
                <ChartTooltip formatter={(v: number) => [`${fmt(v)} tCO₂e`, '']} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-1.5 mt-2 w-full">
              {([1, 2, 3] as const).map((scope) => {
                const row = data.summary.find((s) => Number(s.scope) === scope);
                const val = row ? Number(row.co2e_tonnes) : 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(0) : '0';
                return (
                  <div key={scope} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: S[scope] }} />
                      <span className="text-muted-foreground">{SL[scope]}</span>
                    </div>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Top Emission Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 100 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={95} />
              <ChartTooltip formatter={(v: number) => [`${v.toFixed(1)} tCO₂e`, 'Emissions']} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={S[entry.scope as 1 | 2 | 3] ?? '#6366f1'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed breakdown table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>GHG Inventory — Activity Data</span>
            <span className="text-xs font-normal text-muted-foreground">Source: Lakebase · workspace.esg.activity_data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">Scope</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Activity</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">tCO₂e</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">% Total</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Source System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.breakdown.map((row, i) => {
                  const pct = total > 0 ? (Number(row.co2e_tonnes) / total) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{row.category_label}</td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: S[row.scope as 1|2|3] }}>
                          S{row.scope}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-muted-foreground text-xs">
                        {fmtN(Number(row.activity_value))} {row.activity_unit}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                        {Number(row.co2e_tonnes).toFixed(1)}
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(pct * 3, 100)}%`, backgroundColor: S[row.scope as 1|2|3] }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{row.source}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-semibold">
                  <td className="pt-3 pr-4" colSpan={3}>
                    <span className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Total verified emissions
                    </span>
                  </td>
                  <td className="pt-3 pr-4 text-right tabular-nums">{total.toFixed(1)}</td>
                  <td className="pt-3 pr-4 text-right text-xs text-muted-foreground">100%</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Data pipeline: SAP · Oracle · Concur · Workday → Lakebase (Postgres) · Ref: workspace.esg.activity_data</span>
        <span>Emission factors: EPA eGRID 2024 · DEFRA 2024 · GHG Protocol Scope 3 Technical Guidance</span>
      </div>
    </div>
  );
}
