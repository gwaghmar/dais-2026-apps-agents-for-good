import { Application } from 'express';

type LakebaseQuery = (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

interface AppKitEsg {
  lakebase: { query: LakebaseQuery };
  server: { extend(fn: (app: Application) => void): void };
}

const EF = {
  natural_gas:        { scope: 1, factor: 53.06,   unit: 'MMBtu',    label: 'Natural Gas' },
  diesel:             { scope: 1, factor: 10.21,    unit: 'gallon',   label: 'Diesel' },
  gasoline:           { scope: 1, factor: 8.78,    unit: 'gallon',   label: 'Gasoline' },
  refrigerants:       { scope: 1, factor: 1430,    unit: 'kg',       label: 'HFC Refrigerants' },
  electricity:        { scope: 2, factor: 0.386,   unit: 'kWh',      label: 'Electricity' },
  steam:              { scope: 2, factor: 0.273,   unit: 'kWh',      label: 'Steam/Heat' },
  air_travel:         { scope: 3, factor: 0.255,   unit: 'km',       label: 'Air Travel' },
  employee_commute:   { scope: 3, factor: 0.171,   unit: 'km',       label: 'Employee Commuting' },
  hotel_stays:        { scope: 3, factor: 31.2,    unit: 'night',    label: 'Hotel Stays' },
  purchased_goods:    { scope: 3, factor: 0.42,    unit: 'USD_1k',   label: 'Purchased Goods & Services' },
  waste:              { scope: 3, factor: 573,     unit: 'tonne',    label: 'Waste to Landfill' },
  upstream_logistics: { scope: 3, factor: 0.0312,  unit: 'tonne_km', label: 'Upstream Freight' },
} as const;

type EFKey = keyof typeof EF;

const SEED: Array<{ cat: EFKey; val: number; period: string; source: string }> = [
  { cat: 'natural_gas',        val: 100_000,    period: '2025', source: 'Utility Provider' },
  { cat: 'diesel',             val: 10_000,     period: '2025', source: 'Fleet Management' },
  { cat: 'electricity',        val: 8_000_000,  period: '2025', source: 'Utility Provider' },
  { cat: 'air_travel',         val: 5_000_000,  period: '2025', source: 'Travel Management' },
  { cat: 'employee_commute',   val: 50_000_000, period: '2025', source: 'HR System' },
  { cat: 'hotel_stays',        val: 12_000,     period: '2025', source: 'Travel Management' },
  { cat: 'purchased_goods',    val: 25_000,     period: '2025', source: 'ERP / SAP' },
  { cat: 'waste',              val: 200,        period: '2025', source: 'Facilities Management' },
  { cat: 'upstream_logistics', val: 5_000_000,  period: '2025', source: 'Supply Chain ERP' },
];

export const EMISSION_FACTORS = EF;

export async function setupEsgRoutes(appkit: AppKitEsg) {
  const q = (sql: string, params?: unknown[]) => appkit.lakebase.query(sql, params);

  try {
    await q(`CREATE SCHEMA IF NOT EXISTS esg`);

    await q(`
      CREATE TABLE IF NOT EXISTS esg.companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL DEFAULT 'Demo Corporation',
        industry TEXT DEFAULT 'Technology',
        reporting_year INTEGER DEFAULT 2025,
        country TEXT DEFAULT 'US',
        employee_count INTEGER DEFAULT 2500
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS esg.activity_data (
        id SERIAL PRIMARY KEY,
        scope INTEGER NOT NULL,
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        activity_value DOUBLE PRECISION NOT NULL,
        activity_unit TEXT NOT NULL,
        emission_factor DOUBLE PRECISION NOT NULL,
        co2e_tonnes DOUBLE PRECISION NOT NULL,
        period TEXT DEFAULT '2025',
        source TEXT DEFAULT 'Manual',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const { rows: check } = await q(`SELECT id FROM esg.companies LIMIT 1`);
    if (check.length === 0) {
      await q(`INSERT INTO esg.companies (name, industry) VALUES ('Demo Corporation', 'Technology')`);

      for (const row of SEED) {
        const meta = EF[row.cat];
        const co2e_tonnes = (row.val * meta.factor) / 1000;
        await q(
          `INSERT INTO esg.activity_data
           (scope, category, category_label, activity_value, activity_unit, emission_factor, co2e_tonnes, period, source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [meta.scope, row.cat, meta.label, row.val, meta.unit, meta.factor, co2e_tonnes, row.period, row.source],
        );
      }
      console.log('[esg] Schema and seed data created');
    }
  } catch (err) {
    console.warn('[esg] Setup error:', (err as Error).message);
  }

  appkit.server.extend((app) => {
    app.get('/api/company', async (_req, res) => {
      try {
        const { rows } = await q(`SELECT * FROM esg.companies LIMIT 1`);
        res.json(rows[0] ?? { name: 'Demo Corporation', industry: 'Technology', reporting_year: 2025 });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    app.get('/api/emissions', async (_req, res) => {
      try {
        const { rows: summary } = await q(`
          SELECT scope, SUM(co2e_tonnes) AS co2e_tonnes
          FROM esg.activity_data
          GROUP BY scope ORDER BY scope
        `);
        const { rows: breakdown } = await q(`
          SELECT scope, category, category_label, activity_unit, source,
                 SUM(activity_value) AS activity_value,
                 SUM(co2e_tonnes) AS co2e_tonnes
          FROM esg.activity_data
          GROUP BY scope, category, category_label, activity_unit, source
          ORDER BY scope, co2e_tonnes DESC
        `);
        const total = summary.reduce((s, r) => s + Number(r.co2e_tonnes), 0);
        res.json({ summary, breakdown, total_co2e_tonnes: total, year: 2025 });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    app.post('/api/upload', async (req, res) => {
      try {
        const rows = req.body?.rows as Array<{ category: string; activity_value: number; period?: string; source?: string }>;
        if (!Array.isArray(rows) || rows.length === 0) {
          res.status(400).json({ error: 'rows array required' });
          return;
        }
        let inserted = 0;
        for (const row of rows) {
          const meta = EF[row.category as EFKey];
          if (!meta) continue;
          const co2e_tonnes = (Number(row.activity_value) * meta.factor) / 1000;
          await q(
            `INSERT INTO esg.activity_data
             (scope, category, category_label, activity_value, activity_unit, emission_factor, co2e_tonnes, period, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [meta.scope, row.category, meta.label, row.activity_value, meta.unit, meta.factor, co2e_tonnes, row.period ?? '2025', row.source ?? 'Upload'],
          );
          inserted++;
        }
        res.json({ inserted });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    app.get('/api/emission-factors', (_req, res) => {
      res.json(
        Object.entries(EF).map(([key, v]) => ({
          key,
          scope: v.scope,
          label: v.label,
          unit: v.unit,
          factor: v.factor,
        })),
      );
    });
  });
}
