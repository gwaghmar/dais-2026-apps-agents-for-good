import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@databricks/appkit-ui/react';

interface ScopeSummary {
  scope: number;
  co2e_tonnes: number;
}

interface BreakdownRow {
  scope: number;
  category: string;
  category_label: string;
  activity_unit: string;
  source: string;
  activity_value: number;
  co2e_tonnes: number;
}

interface EmissionsData {
  summary: ScopeSummary[];
  breakdown: BreakdownRow[];
  total_co2e_tonnes: number;
  year: number;
}

const SCOPE_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#3b82f6',
};

const SCOPE_LABELS: Record<number, string> = {
  1: 'Scope 1 — Direct',
  2: 'Scope 2 — Energy',
  3: 'Scope 3 — Value Chain',
};

function fmtTonnes(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

export function DashboardPage() {
  const [data, setData] = useState<EmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/emissions')
      .then((r) => r.json())
      .then((d: EmissionsData) => setData(d))
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading emissions data...</div>;
  if (error) return <div className="text-destructive p-4">Error: {error}</div>;
  if (!data) return null;

  const total = data.total_co2e_tonnes;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">GHG Emissions Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          FY{data.year} · GHG Protocol Corporate Standard · tCO₂e
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: '#6366f1' }}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{fmtTonnes(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">tCO₂e</p>
          </CardContent>
        </Card>

        {[1, 2, 3].map((scope) => {
          const row = data.summary.find((s) => Number(s.scope) === scope);
          const val = row ? Number(row.co2e_tonnes) : 0;
          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
          return (
            <Card key={scope} className="border-l-4" style={{ borderLeftColor: SCOPE_COLORS[scope] }}>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">{SCOPE_LABELS[scope]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{fmtTonnes(val)}</p>
                <p className="text-xs text-muted-foreground mt-1">tCO₂e · {pct}% of total</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scope breakdown bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Emissions by Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((scope) => {
            const row = data.summary.find((s) => Number(s.scope) === scope);
            const val = row ? Number(row.co2e_tonnes) : 0;
            const pct = total > 0 ? (val / total) * 100 : 0;
            return (
              <div key={scope}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{SCOPE_LABELS[scope]}</span>
                  <span className="text-muted-foreground">{fmtTonnes(val)} tCO₂e ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: SCOPE_COLORS[scope] }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Category breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Emissions by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Scope</th>
                  <th className="pb-2 pr-4 font-medium text-right">Activity</th>
                  <th className="pb-2 pr-4 font-medium text-right">tCO₂e</th>
                  <th className="pb-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 pr-4 font-medium">{row.category_label}</td>
                    <td className="py-2 pr-4">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: SCOPE_COLORS[row.scope] }}
                      >
                        S{row.scope}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-muted-foreground">
                      {Number(row.activity_value).toLocaleString()} {row.activity_unit}
                    </td>
                    <td className="py-2 pr-4 text-right font-semibold">
                      {Number(row.co2e_tonnes).toFixed(1)}
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{row.source}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="pt-2 pr-4" colSpan={3}>Total</td>
                  <td className="pt-2 pr-4 text-right">{total.toFixed(1)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Data source: Lakebase Postgres · Emission factors: EPA eGRID 2024, GHG Protocol Scope 3 Technical Guidance
      </p>
    </div>
  );
}
