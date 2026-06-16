import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@databricks/appkit-ui/react';
import { Button } from '@databricks/appkit-ui/react';
import { CheckCircle2, AlertCircle, Upload, ArrowRight, Database } from 'lucide-react';

interface EFMeta { key: string; scope: number; label: string; unit: string; factor: number }
interface UploadRow { category: string; activity_value: number; period: string; source: string }
interface ParsedRow {
  rawCategory: string; mappedCategory: string;
  rawValue: string; period: string; source: string;
}

const S: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#3b82f6' };

const EXAMPLE_CSV = `category,activity_value,period,source
electricity,150000,2025-Q1,Utility Bill
natural_gas,8500,2025-Q1,Gas Invoice
air_travel,125000,2025-Q1,Concur Travel
employee_commute,2000000,2025-Q1,HR System`;

const ERP_SOURCES = [
  { name: 'SAP S/4HANA', type: 'ERP', connected: true, desc: 'Purchase orders, freight, waste' },
  { name: 'Oracle Cloud', type: 'ERP', connected: true, desc: 'Utilities, facilities spend' },
  { name: 'Concur Travel', type: 'Travel', connected: true, desc: 'Air travel, hotels, rental cars' },
  { name: 'Workday', type: 'HR', connected: false, desc: 'Headcount, commute survey data' },
  { name: 'PG&E Utility', type: 'Utility', connected: true, desc: 'Electricity & gas consumption' },
  { name: 'Watershed CSV', type: 'Import', connected: false, desc: 'Bulk import from any source' },
];

export function IngestionPage() {
  const [factors, setFactors] = useState<EFMeta[]>([]);
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  useEffect(() => {
    fetch('/api/emission-factors')
      .then((r) => r.json())
      .then((d: EFMeta[]) => setFactors(d))
      .catch(console.error);
  }, []);

  function parseCSV(text: string) {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { setParsed([]); return; }
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    setParsed(
      lines.slice(1).map((line) => {
        const cells = line.split(',').map((c) => c.trim());
        const get = (key: string) => cells[headers.indexOf(key)] ?? '';
        const rawCat = get('category');
        return {
          rawCategory: rawCat, mappedCategory: rawCat,
          rawValue: get('activity_value'), period: get('period') || '2025',
          source: get('source') || 'Upload',
        };
      })
    );
  }

  function updateMapping(idx: number, val: string) {
    setParsed((prev) => prev.map((r, i) => (i === idx ? { ...r, mappedCategory: val } : r)));
  }

  async function handleSubmit() {
    const rows: UploadRow[] = parsed
      .filter((r) => r.mappedCategory && !isNaN(Number(r.rawValue)))
      .map((r) => ({
        category: r.mappedCategory,
        activity_value: Number(r.rawValue),
        period: r.period,
        source: r.source,
      }));
    if (!rows.length) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = (await res.json()) as { inserted?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setResultMsg(`${data.inserted ?? 0} records written to Lakebase (workspace.esg.activity_data)`);
      setStatus('done');
      setCsvText('');
      setParsed([]);
    } catch (e: unknown) {
      setResultMsg((e as Error).message);
      setStatus('error');
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Ingestion</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connect enterprise systems, map activity data to GHG Protocol categories, and push to Lakebase.
        </p>
      </div>

      {/* Data pipeline banner */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center gap-3 text-sm">
        <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-muted-foreground">Pipeline:</span>
        {['ERP / Utility', 'CSV Import', 'Column Mapping', 'Emission Calc', 'Lakebase · workspace.esg'].map((step, i, arr) => (
          <span key={step} className="flex items-center gap-2">
            <span className={i === arr.length - 1 ? 'font-medium text-foreground' : ''}>{step}</span>
            {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </span>
        ))}
      </div>

      {/* Connected sources */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Enterprise Connections</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ERP_SOURCES.map((src) => (
            <div
              key={src.name}
              className="border rounded-lg p-3 flex flex-col gap-1 relative overflow-hidden"
            >
              {src.connected && (
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[24px] border-l-transparent border-t-[24px] border-t-emerald-500/20" />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{src.name}</p>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{src.type}</span>
                </div>
                {src.connected
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
              </div>
              <p className="text-xs text-muted-foreground">{src.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CSV upload card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Activity Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Expected columns: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">category, activity_value, period, source</code>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCsvText(EXAMPLE_CSV); parseCSV(EXAMPLE_CSV); }}
          >
            Load example CSV
          </Button>
          <textarea
            className="w-full h-28 rounded-md border px-3 py-2 text-sm bg-background font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Paste CSV data here or click 'Load example CSV'..."
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); parseCSV(e.target.value); }}
          />
        </CardContent>
      </Card>

      {/* Column mapping */}
      {parsed.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Column Mapping & Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Raw Category</th>
                    <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">GHG Standard Category</th>
                    <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Scope</th>
                    <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Activity Value</th>
                    <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Period</th>
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {parsed.map((row, i) => {
                    const matched = factors.find((f) => f.key === row.mappedCategory);
                    return (
                      <tr key={i}>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{row.rawCategory}</td>
                        <td className="py-2.5 pr-4">
                          <select
                            className="rounded-md border px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            value={row.mappedCategory}
                            onChange={(e) => updateMapping(i, e.target.value)}
                          >
                            <option value="">-- select --</option>
                            {factors.map((f) => (
                              <option key={f.key} value={f.key}>{f.label} ({f.unit})</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 pr-4">
                          {matched ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: S[matched.scope] }}>
                              S{matched.scope}
                            </span>
                          ) : <span className="text-muted-foreground/40">—</span>}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {isNaN(Number(row.rawValue))
                            ? <span className="text-destructive flex items-center justify-end gap-1"><AlertCircle className="h-3 w-3" />{row.rawValue}</span>
                            : Number(row.rawValue).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">{row.period}</td>
                        <td className="py-2.5 text-xs text-muted-foreground">{row.source}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleSubmit} disabled={status === 'submitting'}>
                {status === 'submitting'
                  ? <span className="flex items-center gap-2"><span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" /> Ingesting...</span>
                  : `Ingest ${parsed.length} rows → Lakebase`}
              </Button>
              {status === 'done' && (
                <p className="text-sm text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {resultMsg}
                </p>
              )}
              {status === 'error' && <p className="text-sm text-destructive">{resultMsg}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emission factors reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Supported GHG Protocol Categories & Emission Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Scope</th>
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Unit</th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">kgCO₂e / unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {factors.map((f) => (
                  <tr key={f.key} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-4 font-medium text-sm">{f.label}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: S[f.scope] }}>
                        S{f.scope}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground text-xs">{f.unit}</td>
                    <td className="py-2 font-mono text-xs font-semibold">{f.factor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
