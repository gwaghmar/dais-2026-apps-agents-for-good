# CarbonLedger — ERP-to-CSR emissions platform

> **DAIS 2026 — Apps & Agents for Good Hackathon** · Built on Databricks **Lakebase + Agent Bricks + Databricks Apps** (+ Unity Catalog, Lakeflow, Vector Search, Model Serving)

An agentic data app that turns the messy financial + operational data already sitting
in a company's **ERP systems** (SAP, NetSuite, Workday, Concur) into a governed
**Scope 1 / 2 / 3 carbon footprint** and an AI-drafted **CSR / sustainability report** —
a Watershed-style workflow built end-to-end on Databricks.

---

## 1. Problem statement & solution approach

**Problem.** Corporate climate disclosure (CSRD, SEC climate rule, CDP) is now mandatory
for thousands of companies, but the data needed to compute emissions is scattered across
ERP, utility, fleet, and travel systems in incompatible formats. Most teams stitch it
together in spreadsheets — slow, error-prone, unauditable, and impossible to keep current.

**Solution.** CarbonLedger ingests ERP/operational exports into Unity Catalog, normalizes
them through a medallion pipeline, applies GHG-Protocol emission factors to compute
**Scope 1/2/3 in metric tons CO₂e**, serves the results from **Lakebase** for instant reads,
and puts an **Agent Bricks** "CSR Analyst" in front of it all inside a **Databricks App** —
so a sustainability lead can ask *"what's our biggest Scope 3 source this quarter and how do
we cut it?"* and get a grounded, citable answer plus a report-ready paragraph.

## 2. Technical implementation

```
ERP / ops exports (SAP, NetSuite, Workday, Concur)
        │  Lakeflow / Auto Loader / COPY INTO
        ▼
Unity Catalog — medallion (Delta + CDF)
  bronze (raw) → silver (normalized activity) → gold (Scope 1/2/3 tCO2e)
        │  continuous synced table
        ▼
   Lakebase (Postgres)  ──sub-10ms reads──┐
        ▲                                 │
  Agent Bricks "CSR Analyst" ◄── NL ──────┤  (grounded by Vector Search over
   (Model Serving + tools)                │   GHG Protocol + factor metadata)
        │                                 ▼
        └──────────  Databricks App (AppKit / React) ── sustainability team
```

Databricks surface area used: **Unity Catalog** (governance/lineage), **Delta + Change
Data Feed**, **Lakeflow/medallion pipeline**, **Lakebase synced table** (operational reads),
**Mosaic AI Vector Search** (methodology grounding), **Agent Bricks** (the agent),
**Model Serving / Foundation Model APIs** (reasoning + report drafting), **Mosaic AI Agent
Evaluation** (quality), **Databricks Apps** (UI). See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
and [`docs/EMISSIONS-METHODOLOGY.md`](docs/EMISSIONS-METHODOLOGY.md).

## 3. How it benefits users

- **Sustainability / finance teams** get an auditable footprint in minutes instead of weeks —
  every number traces report → gold → silver → the original ERP row.
- **Leadership** gets hotspots and reduction levers, not just a total.
- **Society** benefits when accurate, low-friction carbon accounting makes corporate
  decarbonization measurable and therefore actionable — the "for good" of the theme.

## 4. Accessibility & ethical considerations

- **No greenwashing:** the agent always states scope/category, labels spend-based Scope 3 as
  an *estimate*, and flags missing data instead of silently filling gaps.
- **Traceability:** every figure is drillable back to source rows (anti-fraud, audit-ready).
- **Plain language** agent output; dashboard usable without carbon-accounting expertise.
- Emission factors in this prototype are **illustrative**; production sources documented.

## 5. Deployment & sustainability plan

- Serverless on **Databricks Apps**; **Lakebase** scales to zero when idle (low running cost).
- New ERP exports flow through **continuous sync** — the footprint stays current automatically.
- Factor tables are versioned in Unity Catalog (swap illustrative → EPA/eGRID/USEEIO without
  touching pipeline logic).
- Extensible to new Scope 3 categories by adding rows to `silver_activity` + `emission_factors`.

---

## Setup & usage

> ⚠️ Requires a Databricks workspace with an authenticated CLI profile, Lakebase + Apps enabled,
> and the `databricks aitools` skills. Full step-by-step in [`docs/BUILD-RUNBOOK.md`](docs/BUILD-RUNBOOK.md).

```bash
# 0. Prereqs
databricks --version            # 1.0+
databricks auth profiles        # your authenticated profile
databricks aitools version

# 1. Land sample ERP exports + build the pipeline (bronze → silver → gold)
databricks fs cp data/ dbfs:/Volumes/carbon/csr/landing/ --recursive -p <profile>
#   then run pipeline/01_bronze_ingest.sql, 02_silver_normalize.sql, 03_gold_emissions.sql

# 2. Lakebase project + continuous synced table from gold_emissions_summary
# 3. Scaffold the Databricks App (--features lakebase) and add the Agent Bricks agent
# 4. databricks apps deploy
```

Repo layout: [`data/`](data) sample ERP exports + factors · [`pipeline/`](pipeline) medallion SQL ·
[`agent/`](agent) Agent Bricks spec · [`docs/`](docs) architecture, methodology, runbook.

## Team

- _add team members (2–4 required, all registered for DAIS 2026)_

## License

MIT — see [`LICENSE`](LICENSE).
