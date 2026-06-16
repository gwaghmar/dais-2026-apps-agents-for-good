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
  co2e_tonnes: number;
}

interface EmissionsData {
  summary: ScopeSummary[];
  breakdown: BreakdownRow[];
  total_co2e_tonnes: number;
  year: number;
}

interface Company {
  name: string;
  industry: string;
  reporting_year: number;
  country: string;
  employee_count: number;
}

function fmtNum(n: number, dec = 0) {
  return n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function ReportPage() {
  const [emissions, setEmissions] = useState<EmissionsData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/emissions').then((r) => r.json() as Promise<EmissionsData>),
      fetch('/api/company').then((r) => r.json() as Promise<Company>),
    ]).then(([em, co]) => {
      setEmissions(em);
      setCompany(co);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Generating report...</div>;
  if (!emissions || !company) return null;

  const s1 = Number(emissions.summary.find((s) => Number(s.scope) === 1)?.co2e_tonnes ?? 0);
  const s2 = Number(emissions.summary.find((s) => Number(s.scope) === 2)?.co2e_tonnes ?? 0);
  const s3 = Number(emissions.summary.find((s) => Number(s.scope) === 3)?.co2e_tonnes ?? 0);
  const total = emissions.total_co2e_tonnes;
  const intensity = total / (company.employee_count || 1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">CSR Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Annual sustainability report · FY{company.reporting_year} · GHG Protocol
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Export PDF
        </button>
      </div>

      {/* Report content - printable */}
      <div id="csr-report" className="space-y-6 print:text-black">

        {/* Cover */}
        <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950 dark:to-blue-950 border-0">
          <CardContent className="py-10 text-center space-y-2">
            <div className="text-5xl font-black text-emerald-700 dark:text-emerald-400">
              {fmtNum(total, 0)}
            </div>
            <p className="text-lg text-muted-foreground">metric tonnes CO₂e (FY{company.reporting_year})</p>
            <p className="text-2xl font-bold text-foreground mt-4">{company.name}</p>
            <p className="text-sm text-muted-foreground">
              {company.industry} · {company.country} · {fmtNum(company.employee_count)} employees
            </p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
              <span>GHG Protocol Corporate Standard</span>
              <span>·</span>
              <span>EPA eGRID 2024</span>
              <span>·</span>
              <span>Scope 3 Technical Guidance</span>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              {company.name} has completed its FY{company.reporting_year} greenhouse gas (GHG) inventory
              in accordance with the GHG Protocol Corporate Standard. This report covers all material
              emission sources across Scope 1, 2, and 3 categories.
            </p>
            <p>
              Our total GHG footprint for FY{company.reporting_year} is <strong className="text-foreground">{fmtNum(total, 0)} tCO₂e</strong>,
              representing an emissions intensity of <strong className="text-foreground">{intensity.toFixed(1)} tCO₂e per employee</strong>.
              Value chain (Scope 3) emissions account for the largest share at{' '}
              <strong className="text-foreground">{total > 0 ? ((s3 / total) * 100).toFixed(0) : 0}%</strong> of total emissions,
              primarily driven by purchased goods and services and employee commuting.
            </p>
            <p>
              We are committed to achieving net-zero emissions by 2040, with an interim target of
              50% absolute reduction in Scope 1 and 2 by 2030 (against a 2023 baseline), aligned
              with Science Based Targets initiative (SBTi) criteria.
            </p>
          </CardContent>
        </Card>

        {/* GHG Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>GHG Inventory — FY{company.reporting_year}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">GHG Category</th>
                  <th className="pb-2 pr-4 font-medium text-right">tCO₂e</th>
                  <th className="pb-2 font-medium text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-red-50 dark:bg-red-950/20 font-semibold">
                  <td className="py-2 pr-4 text-red-700 dark:text-red-400">Scope 1 — Direct Emissions</td>
                  <td className="py-2 pr-4 text-right">{fmtNum(s1, 0)}</td>
                  <td className="py-2 text-right">{total > 0 ? ((s1 / total) * 100).toFixed(1) : 0}%</td>
                </tr>
                {emissions.breakdown.filter((r) => r.scope === 1).map((r, i) => (
                  <tr key={i} className="border-b text-muted-foreground">
                    <td className="py-1.5 pr-4 pl-4">↳ {r.category_label}</td>
                    <td className="py-1.5 pr-4 text-right">{fmtNum(Number(r.co2e_tonnes), 0)}</td>
                    <td className="py-1.5 text-right">{total > 0 ? ((Number(r.co2e_tonnes) / total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
                <tr className="border-b bg-orange-50 dark:bg-orange-950/20 font-semibold">
                  <td className="py-2 pr-4 text-orange-700 dark:text-orange-400">Scope 2 — Indirect Energy</td>
                  <td className="py-2 pr-4 text-right">{fmtNum(s2, 0)}</td>
                  <td className="py-2 text-right">{total > 0 ? ((s2 / total) * 100).toFixed(1) : 0}%</td>
                </tr>
                {emissions.breakdown.filter((r) => r.scope === 2).map((r, i) => (
                  <tr key={i} className="border-b text-muted-foreground">
                    <td className="py-1.5 pr-4 pl-4">↳ {r.category_label}</td>
                    <td className="py-1.5 pr-4 text-right">{fmtNum(Number(r.co2e_tonnes), 0)}</td>
                    <td className="py-1.5 text-right">{total > 0 ? ((Number(r.co2e_tonnes) / total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
                <tr className="border-b bg-blue-50 dark:bg-blue-950/20 font-semibold">
                  <td className="py-2 pr-4 text-blue-700 dark:text-blue-400">Scope 3 — Value Chain</td>
                  <td className="py-2 pr-4 text-right">{fmtNum(s3, 0)}</td>
                  <td className="py-2 text-right">{total > 0 ? ((s3 / total) * 100).toFixed(1) : 0}%</td>
                </tr>
                {emissions.breakdown.filter((r) => r.scope === 3).map((r, i) => (
                  <tr key={i} className="border-b text-muted-foreground">
                    <td className="py-1.5 pr-4 pl-4">↳ {r.category_label}</td>
                    <td className="py-1.5 pr-4 text-right">{fmtNum(Number(r.co2e_tonnes), 0)}</td>
                    <td className="py-1.5 text-right">{total > 0 ? ((Number(r.co2e_tonnes) / total) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold">
                  <td className="pt-2 pr-4">Total GHG Emissions</td>
                  <td className="pt-2 pr-4 text-right">{fmtNum(total, 0)}</td>
                  <td className="pt-2 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Targets */}
        <Card>
          <CardHeader>
            <CardTitle>Reduction Targets & Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Scope 1+2 absolute reduction by 2030 (SBTi 1.5°C)', target: 50, progress: 8 },
              { label: 'Renewable electricity by 2025 (RE100)', target: 100, progress: 35 },
              { label: 'Scope 3 supplier engagement (coverage)', target: 70, progress: 22 },
              { label: 'Net Zero by 2040 (SBTi Corporate Net-Zero Standard)', target: 100, progress: 3 },
            ].map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{t.label}</span>
                  <span className="text-muted-foreground">{t.progress}% / {t.target}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(t.progress / t.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Frameworks */}
        <Card>
          <CardHeader>
            <CardTitle>Reporting Frameworks & Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'GHG Protocol', status: 'Full alignment', color: 'emerald' },
                { name: 'CSRD / ESRS E1', status: 'Preparing', color: 'blue' },
                { name: 'CDP Climate A-list', status: 'Submitted', color: 'emerald' },
                { name: 'TCFD', status: 'Full disclosure', color: 'emerald' },
                { name: 'GRI Standards', status: 'Core option', color: 'emerald' },
                { name: 'SBTi Corporate', status: 'Committed', color: 'yellow' },
              ].map((fw) => (
                <div key={fw.name} className={`border rounded-lg p-3 bg-${fw.color}-50 dark:bg-${fw.color}-950/20`}>
                  <p className="font-semibold text-sm">{fw.name}</p>
                  <p className={`text-xs text-${fw.color}-700 dark:text-${fw.color}-400 mt-0.5`}>{fw.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Prepared using Databricks ESG Reporter · Powered by Lakebase + Agent Bricks · Data sourced from ERP, utilities, and travel systems
        </p>
      </div>
    </div>
  );
}
