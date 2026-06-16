# Submission Checklist — DAIS 2026 Apps & Agents for Good

**Project:** CarbonLedger — ERP-to-CSR emissions platform (Scope 1/2/3 + AI CSR reporting).
Judging rewards **shipped over feature-complete**, real social impact, idiomatic Databricks
stack use, and clear docs.

> ⏰ **Submission is TONIGHT, Tue June 16, 2026 (judging 6–9pm per researched notes).**
> Confirm the exact cutoff + submission portal in the MLH event page / Drive submission guide.

## Deliverables (required)

- [ ] **Working app / agent prototype** — deployed Databricks App + Agent Bricks agent
- [x] **Public source repository** — this repo, public, MIT licensed
- [x] **Project documentation** — README (5 sections) + `docs/` (architecture, methodology, runbook)
- [ ] **Demo video or live demo** — concise, shows ERP→footprint→agent→CSR report (English)
- [ ] **Presentation materials** — slides for judging

## Required write-up sections (in README) — ✅ all present

- [x] Problem statement & solution approach
- [x] Technical implementation details
- [x] How the app/agent benefits users
- [x] Accessibility & ethical considerations
- [x] Deployment / sustainability plan

## Required stack (must use)

- [ ] **Lakebase** — continuous synced table of `gold_emissions_summary`, sub-10ms reads
- [ ] **Agent Bricks** — the "CSR Analyst" agent (`agent/csr_agent.md`)
- [ ] **Databricks Apps** — the dashboard + chat UI
- Bonus stack used: Unity Catalog, Delta+CDF, Lakeflow/medallion, Vector Search, Model Serving, Agent Eval

## Judging criteria (optimize for these)

- [ ] Innovation & creativity — ERP→CSR carbon accounting, full-stack on Databricks
- [ ] Technical execution & code quality — medallion pipeline + grounded agent + eval
- [ ] Real-world impact & social good — measurable corporate decarbonization  ← **theme**
- [ ] Presentation & documentation clarity
- [ ] Feasibility & scalability — serverless, scales-to-zero, continuous sync

## Build status

- [x] Concept locked: **CarbonLedger** (Watershed-style CSR carbon accounting)
- [x] Repo scaffold rewritten around concept (README, architecture, methodology, runbook)
- [x] Sample ERP exports + emission factors (`data/`)
- [x] Medallion pipeline SQL (`pipeline/` bronze→silver→gold)
- [x] Agent Bricks spec (`agent/csr_agent.md`)
- [ ] Pipeline run in workspace (bronze→gold) — **needs your authenticated CLI**
- [ ] Lakebase project + continuous synced table
- [ ] App scaffolded (`--features lakebase`) + UI built
- [ ] Agent Bricks agent deployed + Vector Search grounding
- [ ] App deployed + tested
- [ ] Demo video + slides
```
NOTE: deploy steps require the authenticated `hackathon` profile on your machine —
this repo/CI environment has no Databricks CLI. Follow docs/BUILD-RUNBOOK.md.
```
