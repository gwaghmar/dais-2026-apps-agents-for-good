# Demo Script — ESG Carbon Reporter (2 min)

## Setup (before demo)
- App open at: https://esg-reporter-7474648426999655.aws.databricksapps.com
- Land on Dashboard tab

---

## Intro (15s)
> "Watershed — the leading ESG platform — charges $100k+/year and takes 6–9 months per CSR report.
> We built the equivalent in one day on Databricks, using Lakebase, Agent Bricks, and Databricks Apps."

---

## Screen 1: Dashboard (30s)

Point to the 4 KPI cards:
> "Our demo company, Demo Corporation, emits ~29,000 tCO₂e total.
> Scope 1 direct emissions, Scope 2 energy purchases, Scope 3 value chain.
> All live from Lakebase Postgres — sub-10ms reads, no separate database."

Point to the category table:
> "Purchased goods and employee commuting dominate Scope 3 — typical for a tech company.
> Every row comes from a different enterprise system."

---

## Screen 2: Data Ingestion (30s)

Click "Data Ingestion" tab.

> "Organizations use dozens of different ERP systems with incompatible column names.
> Our ingestion layer standardizes them."

Click "Load example data" — CSV appears in text box, rows appear in the mapper.

> "The CSV could come from SAP, Oracle, Workday, Concur — any source.
> We map non-standard column names to GHG Protocol categories using our emission factor library.
> Scope and factor applied automatically."

Click "Ingest 4 rows" button.

> "Rows immediately land in Lakebase — go back to Dashboard and it updates in real-time."

---

## Screen 3: ESG AI Assistant (25s)

Click "ESG Assistant" tab.

Click the suggestion chip: **"What are my largest sources of Scope 3 emissions?"**

Wait for Agent Bricks response.

> "This is our Databricks Agent Bricks Supervisor Agent — trained on GHG Protocol, CSRD, CDP, SBTi.
> Not a generic LLM. An expert assistant that knows your data and the reporting frameworks."

---

## Screen 4: CSR Report (20s)

Click "CSR Report" tab.

> "One click — a full CSR report. GHG inventory table, scope breakdown, reduction targets aligned
> with SBTi, framework alignment checklist. Print to PDF for board or regulator submission."

Point to the targets section:
> "50% Scope 1+2 reduction by 2030. RE100 renewable commitment. Net-zero by 2040.
> All tracked here against real data."

---

## Closing (0s — judges cut you off)
> "All Databricks — Lakebase for OLTP, Agent Bricks for AI, Databricks Apps for the UI.
> Complete ESG reporting platform. Deployed in a day."

---

## Key numbers to know
- Total emissions: ~29,000 tCO₂e
- Scope 1: ~5,400 tCO₂e (natural gas + diesel)
- Scope 2: ~3,100 tCO₂e (electricity)
- Scope 3: ~20,400 tCO₂e (purchased goods dominate)
- Lakebase host: ep-lingering-cloud-d8osdgro.database.us-east-2.cloud.databricks.com
- Agent: supervisor-agents/8058ac40-5f4a-42f6-ad34-c3c14eb04b1a

## If AI assistant is slow/down
> "The Agent Bricks endpoint is warming up — it's answering thousands of ESG queries across the workspace.
> Here's what it looks like when working..." (show a screenshot or pre-recorded response)
