import { Application, Request, Response } from 'express';

type LakebaseQuery = (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
interface AppKitFacility {
  lakebase: { query: LakebaseQuery };
  server: { extend(fn: (app: Application) => void): void };
}

const REAL_CAT = 'databricks_virtue_foundation_dataset_dais_2026.virtue_foundation_dataset';
const WAREHOUSE_ID = '9aa3ec8c00420cfc';

function trustSignal(row: Record<string, string | null>) {
  const social = Number(row['distinct_social_media_presence_count'] ?? 0);
  const facts = Number(row['number_of_facts_about_the_organization'] ?? 0);
  const staff = row['affiliated_staff_presence'] === 'True';
  const logo = row['custom_logo_presence'] === 'True';
  const score = social + (facts >= 5 ? 2 : facts >= 2 ? 1 : 0) + (staff ? 1 : 0) + (logo ? 1 : 0);
  if (score >= 6) return 'strong_evidence';
  if (score >= 3) return 'partial_evidence';
  if (score >= 1) return 'weak_evidence';
  return 'no_claim';
}

async function queryWarehouse(token: string, host: string, sql: string): Promise<Record<string, unknown>[]> {
  const resp = await fetch(`${host}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ statement: sql, warehouse_id: WAREHOUSE_ID, wait_timeout: '30s' }),
  });
  const data = await resp.json() as {
    status?: { state?: string; error?: { message?: string } };
    result?: { data_array?: string[][]; schema?: { columns?: Array<{ name: string }> } };
  };
  if (!resp.ok || data.status?.state !== 'SUCCEEDED') {
    throw new Error(data.status?.error?.message ?? 'Query failed');
  }
  const cols = data.result?.schema?.columns?.map((c) => c.name) ?? [];
  return (data.result?.data_array ?? []).map((row) => {
    const obj: Record<string, unknown> = {};
    cols.forEach((c, i) => { obj[c] = row[i] ?? null; });
    return obj;
  });
}

function esc(s: string) { return s.replace(/'/g, "''"); }

export async function setupFacilityRoutes(appkit: AppKitFacility) {
  const q = (sql: string, params?: unknown[]) => appkit.lakebase.query(sql, params);

  try {
    await q(`CREATE SCHEMA IF NOT EXISTS referral`);
    await q(`
      CREATE TABLE IF NOT EXISTS referral.shortlist (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        facility_id TEXT NOT NULL,
        facility_name TEXT,
        city TEXT,
        state TEXT,
        capability_match TEXT,
        trust_signal TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await q(`
      CREATE TABLE IF NOT EXISTS referral.search_log (
        id SERIAL PRIMARY KEY,
        query_text TEXT,
        location TEXT,
        care_need TEXT,
        result_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('[referral] Lakebase schema ready');
  } catch (err) {
    console.warn('[referral] Setup warning:', (err as Error).message);
  }

  appkit.server.extend((app) => {

    // Facility search — queries the real Unity Catalog dataset
    app.get('/api/facilities/search', async (req: Request, res: Response) => {
      try {
        const token = process.env.DATABRICKS_TOKEN;
        const host = process.env.DATABRICKS_HOST;
        if (!token || !host) { res.status(503).json({ error: 'Databricks credentials unavailable' }); return; }

        const { capability, location, limit = '20' } = req.query as Record<string, string>;
        const clauses: string[] = [`address_country = 'India'`];

        if (location) {
          const loc = esc(location.toLowerCase());
          clauses.push(`(LOWER(address_city) LIKE '%${loc}%' OR LOWER(address_stateOrRegion) LIKE '%${loc}%' OR LOWER(address_zipOrPostcode) LIKE '%${loc}%')`);
        }
        if (capability) {
          const cap = esc(capability.toLowerCase());
          clauses.push(`(LOWER(capability) LIKE '%${cap}%' OR LOWER(specialties) LIKE '%${cap}%' OR LOWER(description) LIKE '%${cap}%')`);
        }

        const where = clauses.join(' AND ');
        const sql = `
          SELECT unique_id, name, organization_type,
                 address_city, address_stateOrRegion, address_zipOrPostcode,
                 latitude, longitude, capability, specialties, procedure, equipment,
                 description, source_urls, numberDoctors, capacity, yearEstablished,
                 distinct_social_media_presence_count, number_of_facts_about_the_organization,
                 recency_of_page_update, affiliated_staff_presence, custom_logo_presence
          FROM ${REAL_CAT}.facilities
          WHERE ${where}
          ORDER BY CAST(COALESCE(distinct_social_media_presence_count,'0') AS INT) DESC,
                   CAST(COALESCE(number_of_facts_about_the_organization,'0') AS INT) DESC
          LIMIT ${Math.min(Number(limit), 50)}`;

        const rows = await queryWarehouse(token, host, sql);
        const enriched = rows.map((r) => ({
          ...r,
          trust_signal: trustSignal(r as Record<string, string | null>),
        }));

        try {
          await q(`INSERT INTO referral.search_log (query_text, location, care_need, result_count) VALUES ($1,$2,$3,$4)`,
            [`${capability ?? 'any'} in ${location ?? 'India'}`, location ?? null, capability ?? null, enriched.length]);
        } catch { /* non-critical */ }

        res.json({ facilities: enriched, total: enriched.length, query: { capability, location } });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    // Dataset stats
    app.get('/api/facilities/stats', async (_req: Request, res: Response) => {
      try {
        const token = process.env.DATABRICKS_TOKEN;
        const host = process.env.DATABRICKS_HOST;
        if (!token || !host) { res.status(503).json({ error: 'No credentials' }); return; }

        const rows = await queryWarehouse(token, host, `
          SELECT
            COUNT(*) AS total_facilities,
            COUNT(DISTINCT address_stateOrRegion) AS states_covered,
            COUNT(DISTINCT address_city) AS cities_covered,
            SUM(CASE WHEN CAST(COALESCE(distinct_social_media_presence_count,'0') AS INT) >= 4 THEN 1 ELSE 0 END) AS high_trust,
            SUM(CASE WHEN CAST(COALESCE(distinct_social_media_presence_count,'0') AS INT) BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS medium_trust,
            SUM(CASE WHEN CAST(COALESCE(distinct_social_media_presence_count,'0') AS INT) < 2 THEN 1 ELSE 0 END) AS low_trust,
            SUM(CASE WHEN numberDoctors IS NOT NULL AND numberDoctors != '' THEN 1 ELSE 0 END) AS has_doctor_count,
            SUM(CASE WHEN capacity IS NOT NULL AND capacity != '' THEN 1 ELSE 0 END) AS has_capacity
          FROM ${REAL_CAT}.facilities WHERE address_country = 'India'`);
        res.json(rows[0] ?? {});
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    // Facilities by state
    app.get('/api/facilities/by-state', async (_req: Request, res: Response) => {
      try {
        const token = process.env.DATABRICKS_TOKEN;
        const host = process.env.DATABRICKS_HOST;
        if (!token || !host) { res.status(503).json({ error: 'No credentials' }); return; }

        const rows = await queryWarehouse(token, host, `
          SELECT address_stateOrRegion AS state,
            COUNT(*) AS facility_count,
            SUM(CASE WHEN CAST(COALESCE(distinct_social_media_presence_count,'0') AS INT) >= 4 THEN 1 ELSE 0 END) AS high_trust_count
          FROM ${REAL_CAT}.facilities
          WHERE address_country = 'India' AND address_stateOrRegion IS NOT NULL
          GROUP BY 1 ORDER BY facility_count DESC LIMIT 20`);
        res.json({ states: rows });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    // Single facility detail
    app.get('/api/facilities/:id', async (req: Request, res: Response) => {
      try {
        const token = process.env.DATABRICKS_TOKEN;
        const host = process.env.DATABRICKS_HOST;
        if (!token || !host) { res.status(503).json({ error: 'No credentials' }); return; }

        const facilityId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const rows = await queryWarehouse(token, host, `
          SELECT * FROM ${REAL_CAT}.facilities WHERE unique_id = '${esc(facilityId)}' LIMIT 1`);
        if (!rows.length) { res.status(404).json({ error: 'Not found' }); return; }
        res.json({ ...rows[0], trust_signal: trustSignal(rows[0] as Record<string, string | null>) });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    });

    // Shortlist endpoints (persisted in Lakebase)
    app.get('/api/shortlist/:sessionId', async (req: Request, res: Response) => {
      try {
        const { rows } = await q(`SELECT * FROM referral.shortlist WHERE session_id=$1 ORDER BY created_at DESC`, [req.params.sessionId]);
        res.json({ items: rows });
      } catch (err) { res.status(500).json({ error: (err as Error).message }); }
    });

    app.post('/api/shortlist', async (req: Request, res: Response) => {
      try {
        const { session_id, facility_id, facility_name, city, state, capability_match, trust_signal: ts, note } = req.body as Record<string, string>;
        await q(`INSERT INTO referral.shortlist (session_id, facility_id, facility_name, city, state, capability_match, trust_signal, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [session_id, facility_id, facility_name, city, state, capability_match ?? null, ts ?? null, note ?? null]);
        res.json({ success: true });
      } catch (err) { res.status(500).json({ error: (err as Error).message }); }
    });

    app.delete('/api/shortlist/:id', async (req: Request, res: Response) => {
      try {
        await q(`DELETE FROM referral.shortlist WHERE id=$1`, [req.params.id]);
        res.json({ success: true });
      } catch (err) { res.status(500).json({ error: (err as Error).message }); }
    });
  });
}
