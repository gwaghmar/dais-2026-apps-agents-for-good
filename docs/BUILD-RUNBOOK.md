# Build runbook — run on YOUR machine (authenticated Databricks CLI)

> This repo is the public submission + all the SQL/specs. The actual deploy must run
> where your `hackathon` profile is authenticated (your Windows box), **not** in CI/cloud.
> Order matters. `<profile>` = `hackathon`.

## 0 · Sanity check
```bash
databricks --version                 # 1.0+
databricks auth profiles             # hackathon -> Valid: YES
databricks current-user me -p hackathon
databricks aitools version           # agent-bricks + lakebase + apps skills present
```

## 1 · Land sample ERP exports + build the medallion
```bash
# create the volume first (pipeline/01 also does CREATE VOLUME)
databricks fs mkdir dbfs:/Volumes/carbon/csr/landing -p hackathon   # after catalog/schema exist
databricks fs cp data/ dbfs:/Volumes/carbon/csr/landing/ --recursive -p hackathon
```
Run, in order, on a SQL warehouse or serverless notebook:
1. `pipeline/01_bronze_ingest.sql`
2. `pipeline/02_silver_normalize.sql`
3. `pipeline/03_gold_emissions.sql`

Verify: `SELECT scope, ROUND(SUM(tco2e),2) FROM carbon.csr.gold_emissions GROUP BY scope;`
(expect 3 rows — Scope 1, 2, 3).

## 2 · Lakebase project + continuous synced table
```bash
databricks postgres create-project <id> --json '{"spec":{"display_name":"carbonledger"}}' -p hackathon
# note the branch + database names it returns, then:
databricks postgres create-synced-table \
  --source carbon.csr.gold_emissions_summary \
  --target public.emissions_summary \
  --mode continuous -p hackathon
```
(`gold_emissions_summary` already has `enableChangeDataFeed=true`, required for continuous sync.)

## 3 · Scaffold the Databricks App
```bash
databricks apps init --name carbonledger --features lakebase \
  --set lakebase.postgres.branch=<B> --set lakebase.postgres.database=<D> \
  --run none -p hackathon
```
Build the UI with the `databricks-app-design` skill: dashboard (Scope 1/2/3 + hotspots from
`public.emissions_summary`), agent chat panel, "Generate CSR section" button. Express routes
query Lakebase via `appkit.lakebase.query()`.

## 4 · Agent Bricks "CSR Analyst"
Use the `databricks-agent-bricks` skill + `agent/csr_agent.md`. Wire the Lakebase query tools,
build the Vector Search index over GHG Protocol + `emission_factors`, attach a Model Serving
endpoint.

## 5 · Deploy + test
```bash
databricks apps deploy carbonledger -p hackathon   # deploy BEFORE running locally (Lakebase schema ownership)
```
Ask the agent: *"Total Scope 2 for Q1?"*, *"Biggest Scope 3 source and how to cut it?"*,
*"Draft a CSR paragraph for Q1."*  Capture for the demo video.

## 6 · Submission deliverables
- [x] Public repo (this) · [ ] deployed app · [ ] demo video · [ ] slides · README sections ✅
- Confirm exact submission portal + cutoff in the MLH event page / your Drive submission guide.

## Gotchas
- Deploy the app **before** running locally (Lakebase schema ownership).
- App name ≤26 chars, lowercase + hyphens.
- If you lack create-catalog rights, replace `carbon` with `workspace` everywhere.
- Use `databricks postgres ...` for Lakebase (not `databricks database ...`).
