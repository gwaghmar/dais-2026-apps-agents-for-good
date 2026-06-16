# Session State — Continue Here

> **Purpose:** full handoff so a new session resumes instantly. Last updated: **2026-06-16**.
> **Project folder:** `C:\Users\govin\databricks-hackathon`

---

## TL;DR — where we are

**Concept LOCKED: CarbonLedger** — a Watershed-style ERP→CSR carbon-accounting platform
(ingest ERP data → clean → compute Scope 1/2/3 → AI CSR reporting), full Databricks stack.
Repo is rewritten around it: README (5 sections), architecture, methodology, build runbook,
sample ERP data, medallion pipeline SQL, Agent Bricks spec — all pushed & public.

⏰ **Submission is TONIGHT (Tue June 16, judging 6–9pm).** Remaining work = the actual
Databricks deploy, which needs the authenticated `hackathon` CLI on Govind's machine
(the planning/CI container has no Databricks CLI). **Follow `docs/BUILD-RUNBOOK.md`.**

---

## The hackathon (researched & confirmed)

- **Event:** DAIS 2026 — **Apps & Agents for Good** Hackathon (Data + AI Summit, partnered with OpenAI)
- **When:** **June 15–16, 2026**, San Francisco, **in-person**, teams of **2–4** (all must be registered for DAIS)
  - Mon Jun 15: 8am–4pm hacking · Tue Jun 16: 6–9pm judging · Wed Jun 17: showcase
- **Theme:** agentic data apps for **social impact**
- **Required stack:** **Lakebase + Agent Bricks + Databricks Apps**
- **Deliverables:** working app · **public** repo · docs (setup+usage) · demo video/live demo · slides
- **Judging:** innovation · technical execution & code quality · **real-world social impact** ·
  presentation/docs clarity · feasibility/scalability. Bias: "shipped over feature-complete,"
  idiomatic stack use, measurable outcomes.
- Submission guide (Govind's Drive): file id `1uIbL6HGSpBy3bLGSWbMDfjWnhyH8yT9G`

## Environment (all verified working)

| Thing | Value |
|---|---|
| Databricks CLI | **v1.3.0** (winget). Wrapper at `C:\Users\govin\bin\databricks` so it's on Bash PATH |
| CLI binary | `C:\Users\govin\AppData\Local\Microsoft\WinGet\Packages\Databricks.DatabricksCLI_Microsoft.Winget.Source_8wekyb3d8bbwe\databricks.exe` |
| Profile | **`hackathon`** — Valid: YES, **admin** |
| Workspace | `https://dbc-bc846031-87ff.cloud.databricks.com` (AWS) |
| Identity | govindwaghmare2025@gmail.com |
| Node / npm / git / gh | v24 / 11 / 2.54 / authed as **gwaghmar** |

### Skills installed (`databricks aitools`, v0.2.3 — 11 total)
- Bundle (CLI): apps, core, dabs, jobs, lakebase, model-serving, pipelines, serverless-migration, vector-search
- **agent-bricks** (experimental, via CLI) — required for the agent
- **app-design** (manual copy from GitHub HEAD into `~/.claude/skills/databricks-app-design`)
  - ⚠️ manually managed — `databricks aitools update` does NOT track it; delete folder to remove

## GitHub repo

- **URL:** https://github.com/gwaghmar/dais-2026-apps-agents-for-good (public, MIT)
- Local ↔ remote in sync. Contents: `README.md` (5 required sections), `SUBMISSION.md` (checklist),
  `docs/ARCHITECTURE.md`, `LICENSE`, `.gitignore`, this `SESSION-STATE.md`.

## Decisions made

- **Data access pattern:** Lakebase **synced tables** (sub-10ms reads) — locked by recipe.
- **Dropped** the bakehouse demo (didn't fit social-impact theme).
- **App framework:** AppKit (TypeScript/React).
- Hackathon Marketplace dataset NOT installed in workspace (not blocking; we'll seed or pick a dataset).
- Workspace catalogs available: `workspace` (empty), `samples` (accuweather, bakehouse, healthverity,
  nyctaxi, sec, tpch), `system`.

## ✅ CONCEPT LOCKED — CarbonLedger (ERP→CSR carbon accounting)

Watershed-style: ingest ERP/ops exports (SAP/NetSuite/Workday/Concur) → medallion clean →
Scope 1/2/3 tCO₂e (GHG Protocol) → Lakebase synced reads → Agent Bricks "CSR Analyst" →
Databricks App dashboard + chat + CSR report draft. Uses the full stack (UC, Delta+CDF,
Lakeflow, Lakebase, Vector Search, Model Serving, Agent Bricks, Apps).

What's in the repo now: `data/` (sample ERP exports + emission factors), `pipeline/`
(bronze→silver→gold SQL), `agent/csr_agent.md`, `docs/` (architecture, methodology, runbook).

## NEXT STEPS — run on Govind's machine (authenticated CLI). See docs/BUILD-RUNBOOK.md

1. `databricks fs cp data/ dbfs:/Volumes/carbon/csr/landing/ --recursive -p hackathon`
2. Run `pipeline/01_bronze_ingest.sql` → `02_silver_normalize.sql` → `03_gold_emissions.sql`.
   Verify 3 scopes in `carbon.csr.gold_emissions`.
3. **Lakebase:** create project, then continuous synced table from `gold_emissions_summary`.
4. **App:** `databricks apps init --name carbonledger --features lakebase ...` then build UI.
5. **Agent Bricks:** wire Lakebase tools + Vector Search per `agent/csr_agent.md`.
6. `databricks apps deploy carbonledger -p hackathon`; test the 3 demo questions.
7. Record demo + slides. **Confirm submission portal + exact cutoff (MLH / Drive guide).**

## Resume commands (sanity check on a new session)
```bash
databricks --version
databricks auth profiles                 # hackathon → Valid: YES
databricks current-user me -p hackathon
databricks aitools version               # 11 skills
cd /c/Users/govin/databricks-hackathon && git -C . status -s
```

## Gotchas to remember
- Deploy the app **before** running locally (Lakebase schema ownership — see `databricks-lakebase` skill).
- Synced source table needs `delta.enableChangeDataFeed = true` for continuous/triggered sync.
- For Autoscaling Lakebase use the `databricks postgres ...` CLI (NOT `databricks database ...` / DABs `synced_database_tables`).
- App name: ≤26 chars, lowercase + hyphens only.
