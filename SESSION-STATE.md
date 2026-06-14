# Session State — Continue Here

> **Purpose:** full handoff so a new session resumes instantly. Last updated: **2026-06-14**.
> **Project folder:** `C:\Users\govin\databricks-hackathon`

---

## TL;DR — where we are

Environment is **100% set up**. GitHub repo is **live with submission scaffold**. The *only* thing
left before building is **choosing the social-impact concept**. Nothing else blocks us.

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

## ⏳ OPEN DECISION — pick the concept (only blocker)

All four use Lakebase synced tables + Agent Bricks + Databricks Apps:
1. **Community Resource Navigator** (recommended) — conversational agent finds local services
   (food/shelter/health/aid) with eligibility-aware guidance. Matches official "Community Wellness
   & Support Navigator" example. Lakebase = instant typeahead over a services directory.
2. **Accessible City & Travel Agent** — navigate a city with accessibility needs (transit/geo; nyctaxi).
3. **Climate Resilience Helper** — extreme-weather prep, cooling centers, alerts (samples.accuweather).
4. **Health Access Navigator** — find affordable/nearby care (samples.healthverity; sensitive framing).
5. **Govind's / team's own idea** — shape onto the same architecture.

> README is currently written around concept #1 as a *working draft* — easy to swap.

## NEXT STEPS (once concept locked)

1. Choose/load source dataset into Unity Catalog (seed a Delta table or use a `samples.*` table).
2. **Lakebase:** `databricks postgres create-project <id> --json '{"spec":{"display_name":"..."}}' -p hackathon`
   → get branch + database names.
3. **Synced table:** `databricks postgres create-synced-table ...` (continuous; source needs CDF enabled).
4. **Scaffold app:** `databricks apps init --name <name> --features lakebase --set lakebase.postgres.branch=<B> --set lakebase.postgres.database=<D> --run none -p hackathon`
5. Build React UI (use `databricks-app-design` skill) + Express routes querying Lakebase.
6. **Agent Bricks:** use `databricks-agent-bricks` skill to add the agent.
7. Deploy (`databricks apps deploy`), test, fill README sections, record demo + slides.

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
