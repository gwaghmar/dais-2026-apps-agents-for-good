# Submission Checklist — DAIS 2026 Apps & Agents for Good

Track every deliverable here. Judging rewards **shipped over feature-complete**, real social
impact, idiomatic Databricks stack use, and clear docs.

## Deliverables (required)

- [x] **Working app / agent prototype** — deployed at `esg-reporter` on Databricks Apps
- [x] **Public source repository** — https://github.com/gwaghmar/dais-2026-apps-agents-for-good (public, MIT)
- [x] **Project documentation** — README.md (all 5 sections), docs/ARCHITECTURE.md
- [ ] **Demo video or live demo** — record 2-min Loom before judging at 6pm
- [ ] **Presentation materials** — slides for judging session

## Required write-up sections (in README)

- [x] Problem statement & solution approach
- [x] Technical implementation details
- [x] How the app/agent benefits users
- [x] Accessibility & ethical considerations
- [x] Deployment / sustainability plan

## Required stack (must use)

- [x] **Lakebase** — `projects/community-resource-nav` · branch `production` · esg schema
- [x] **Agent Bricks** — `supervisor-agents/8058ac40-5f4a-42f6-ad34-c3c14eb04b1a` · endpoint `mas-8058ac40-endpoint`
- [x] **Databricks Apps** — `esg-reporter` (AppKit TypeScript/React)

## Judging criteria (optimize for these)

- [x] Innovation — enterprise ESG automation on a unified Databricks platform
- [x] Technical execution — TypeScript/React + Lakebase OLTP + Agent Bricks + AppKit, 12 emission categories
- [x] Real-world impact — removes 6–9 month barrier to corporate GHG measurement
- [x] Presentation clarity — 4-tab app: Dashboard → Ingest → AI Assistant → CSR Report
- [x] Scalability — Lakebase autoscales 0.5–32 CU, Databricks Apps serverless

## Logistics

- Teams of **2–4**, all registered for DAIS 2026, **in-person**.
- Hack: **Mon Jun 15, 8am–4pm**. Judging: **Tue Jun 16, 6–9pm**. Showcase: **Wed Jun 17**.
- All submissions in **English**.

## Build status

- [x] Databricks CLI installed + authenticated (profile `hackathon`)
- [x] `databricks aitools` skills installed (11 skills)
- [x] GitHub repo created + public
- [x] Concept locked: **ESG Carbon Reporter** (corporate Scope 1/2/3 accounting + CSR report)
- [x] Lakebase project created + `esg.activity_data` + `esg.companies` tables with seed data
- [x] **Unity Catalog Delta tables** — `workspace.esg.activity_data` (48 rows, 12 categories × 4 quarters), `workspace.esg.companies`, `workspace.esg.emission_factors` — CDF enabled
- [x] **UC SQL functions** — `workspace.esg.get_emissions_summary()`, `workspace.esg.get_quarterly_trend()` — attached to Agent Bricks Supervisor Agent
- [x] AppKit app scaffolded (`--features lakebase,serving`)
- [x] Agent Bricks Supervisor Agent created + ESG instructions
- [x] All 4 pages built: Dashboard, Ingestion, AI Assistant, CSR Report
- [x] Bundle deployed (`databricks bundle deploy`)
- [x] App running + smoke tested — https://esg-reporter-7474648426999655.aws.databricksapps.com
- [ ] Demo video recorded
- [ ] Slides prepared
- [ ] Final commit + push to GitHub
