import { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button,
} from '@databricks/appkit-ui/react';

interface EFMeta {
  key: string;
  scope: number;
  label: string;
  unit: string;
  factor: number;
}

interface UploadRow {
  category: string;
  activity_value: number;
  period: string;
  source: string;
}

interface ParsedRow {
  rawCategory: string;
  mappedCategory: string;
  rawValue: string;
  period: string;
  source: string;
}

const SCOPE_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f97316', 3: '#3b82f6' };

const EXAMPLE_CSV = `category,activity_value,period,source
electricity,150000,2025-Q1,Utility Bill
natural_gas,8500,2025-Q1,Gas Invoice
air_travel,125000,2025-Q1,Travel System
employee_commute,2000000,2025-Q1,HR System`;

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
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows: ParsedRow[] = lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim());
      const get = (key: string) => cells[headers.indexOf(key)] ?? '';
      const rawCat = get('category');
      return {
        rawCategory: rawCat,
        mappedCategory: rawCat,
        rawValue: get('activity_value'),
        period: get('period') || '2025',
        source: get('source') || 'Upload',
      };
    });
    setParsed(rows);
  }

  function updateMapping(idx: number, newCat: string) {
    setParsed((prev) => prev.map((r, i) => (i === idx ? { ...r, mappedCategory: newCat } : r)));
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

    if (rows.length === 0) return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = (await res.json()) as { inserted?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setResultMsg(`${data.inserted} records ingested successfully`);
      setStatus('done');
      setCsvText('');
      setParsed([]);
    } catch (e: unknown) {
      setResultMsg((e as Error).message);
      setStatus('error');
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Data Ingestion</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Import activity data from ERP, utility, or travel systems. Map columns, validate, and push to Lakebase.
        </p>
      </div>

      {/* Supported sources */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['SAP / ERP', 'Oracle Utilities', 'Concur Travel', 'HR Systems'].map((src) => (
          <div key={src} className="border rounded-lg p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30">
            {src}
          </div>
        ))}
      </div>

      {/* CSV upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Upload Activity Data (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Expected columns: <code className="bg-muted px-1 rounded">category, activity_value, period, source</code>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCsvText(EXAMPLE_CSV); parseCSV(EXAMPLE_CSV); }}
          >
            Load example data
          </Button>
          <textarea
            className="w-full h-32 rounded-md border px-3 py-2 text-sm bg-background font-mono resize-none"
            placeholder="Paste CSV here or use example above..."
            value={csvText}
            onChange={(e) => { setCsvText(e.target.value); parseCSV(e.target.value); }}
          />
        </CardContent>
      </Card>

      {/* Column mapping */}
      {parsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Column Mapping & Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Raw Category</th>
                    <th className="pb-2 pr-4 font-medium">Map to Standard</th>
                    <th className="pb-2 pr-4 font-medium">Scope</th>
                    <th className="pb-2 pr-4 font-medium text-right">Value</th>
                    <th className="pb-2 pr-4 font-medium">Period</th>
                    <th className="pb-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => {
                    const matched = factors.find((f) => f.key === row.mappedCategory);
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{row.rawCategory}</td>
                        <td className="py-2 pr-4">
                          <select
                            className="rounded border px-2 py-1 text-xs bg-background"
                            value={row.mappedCategory}
                            onChange={(e) => updateMapping(i, e.target.value)}
                          >
                            <option value="">-- select --</option>
                            {factors.map((f) => (
                              <option key={f.key} value={f.key}>{f.label} ({f.unit})</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          {matched && (
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
                              style={{ backgroundColor: SCOPE_COLORS[matched.scope] }}
                            >
                              S{matched.scope}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {isNaN(Number(row.rawValue)) ? (
                            <span className="text-destructive">{row.rawValue}</span>
                          ) : (
                            Number(row.rawValue).toLocaleString()
                          )}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.period}</td>
                        <td className="py-2 text-muted-foreground text-xs">{row.source}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={handleSubmit}
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Ingesting...' : `Ingest ${parsed.length} rows`}
              </Button>
              {status === 'done' && <p className="text-sm text-green-600">{resultMsg}</p>}
              {status === 'error' && <p className="text-sm text-destructive">{resultMsg}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emission factors reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Supported Emission Categories & Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Category</th>
                  <th className="pb-2 pr-4 font-medium">Scope</th>
                  <th className="pb-2 pr-4 font-medium">Unit</th>
                  <th className="pb-2 font-medium">Factor (kgCO₂e/unit)</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((f) => (
                  <tr key={f.key} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{f.label}</td>
                    <td className="py-1.5 pr-4">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: SCOPE_COLORS[f.scope] }}
                      >
                        S{f.scope}
                      </span>
                    </td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{f.unit}</td>
                    <td className="py-1.5 font-mono text-xs">{f.factor}</td>
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
