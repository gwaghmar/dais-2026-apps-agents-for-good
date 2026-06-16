# Architecture — CarbonLedger

## Data flow

```
┌──────────────────────────────────────────────┐
│ ERP / operational source systems             │  SAP · NetSuite · Workday · Concur
│ exports: GL spend, utility kWh, fuel, travel │
└───────────────┬──────────────────────────────┘
                │  Lakeflow Connect / Auto Loader / COPY INTO
                ▼
┌──────────────────────────────────────────────┐
│ Unity Catalog · carbon.csr  (Delta + CDF)    │
│  bronze_*  raw, source-faithful              │
│  silver_activity  normalized activity model  │
│  gold_emissions / _summary  Scope 1/2/3 tCO2e│
└───────────────┬──────────────────────────────┘
                │  continuous synced table (CDF-backed)
                ▼
┌──────────────────────────────────────────────┐        ┌─────────────────────────────┐
│ Lakebase (Postgres)                          │        │ Vector Search index         │
│  public.emissions_summary  (sub-10ms reads)  │        │  GHG Protocol + factor docs │
└───────────────┬──────────────────────────────┘        └──────────────┬──────────────┘
                │                                                       │
                ▼                                                       ▼
┌──────────────────────────────────────────────┐        ┌─────────────────────────────┐
│ Databricks App (AppKit / React + Express)    │◄──────►│ Agent Bricks "CSR Analyst"  │
│  dashboard · agent chat · CSR report export  │        │  Model Serving + tools      │
└───────────────┬──────────────────────────────┘        └─────────────────────────────┘
                ▼
        Sustainability / finance team
```

## Medallion layers

| Layer | Table(s) | Purpose |
|---|---|---|
| Bronze | `bronze_general_ledger`, `bronze_utility_bills`, `bronze_fuel_fleet`, `bronze_business_travel`, `emission_factors` | Raw, 1:1 with ERP exports; source fidelity + CDF |
| Silver | `silver_activity` | One normalized activity model across all sources (`scope`, `factor_key`, `activity_amount`, `activity_unit`) |
| Gold | `gold_emissions`, `gold_emissions_summary`, `v_emission_hotspots` | Scope 1/2/3 tCO₂e fact + aggregates the app/agent read |

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Ingestion | Land ERP exports to UC Volume → COPY INTO (Lakeflow in prod) | Mirrors real ERP extract feeds; governed in Unity Catalog |
| Modeling | Medallion (bronze→silver→gold) | Auditability: report figure traces back to a single ERP row |
| Scope 3 | Spend-based EEIO (Cat 1/4) + distance-based (Cat 6) | Standard early-stage Scope 3 approach; honest about estimation |
| Operational store | **Lakebase synced table** | Sub-10ms dashboard + agent tool reads, not warehouse latency |
| Agent | **Agent Bricks** + Vector Search grounding | Required; cites methodology instead of guessing |
| Sync mode | Continuous (CDF) | New ERP data updates the footprint automatically |
| App framework | AppKit (TypeScript/React) | First-class Lakebase + serving plugins; idiomatic Databricks Apps |

## MVP scope vs. stretch (it's a one-night build)

**MVP (demoable tonight):** the medallion pipeline + Scope 1/2/3 gold table, Lakebase
sync of the summary, Agent Bricks Q&A grounded on it, a Databricks App with a dashboard +
chat + a "draft CSR section" button.

**Stretch:** market-based Scope 2, more Scope 3 categories, supplier-specific factors,
Lakeflow Connect live ERP connectors, full multi-page CSRD report export, Agent Evaluation
dashboard, target-setting / scenario modeling.

## Open items
- Final UC catalog name if `carbon` create-catalog rights are unavailable (fallback: `workspace`).
- Agent Bricks tool wiring (Lakebase query functions) — see `agent/csr_agent.md`.
- Swap illustrative emission factors for EPA/eGRID/USEEIO production values.
