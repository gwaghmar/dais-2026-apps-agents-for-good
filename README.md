# Community Resource Navigator

> **DAIS 2026 — Apps & Agents for Good Hackathon** · Built on Databricks **Lakebase + Agent Bricks + Databricks Apps**

An agentic data app that helps people in crisis find and navigate local social services —
food assistance, shelter, health clinics, financial aid — by describing their situation in
plain language and getting back relevant, eligibility-aware next steps in milliseconds.

> ⚠️ **Working concept — not yet locked.** This README is the submission scaffold. The social-impact
> idea below is a strong default for the theme; swap freely. The architecture (Lakebase synced
> tables + an Agent Bricks agent + a Databricks App) stays the same regardless of the idea.

---

## 1. Problem statement & solution approach

**Problem.** When someone hits a crisis — job loss, eviction risk, food insecurity — the help
they need usually exists, but it's scattered across hundreds of agencies with confusing
eligibility rules. People give up before they find it.

**Solution.** A single conversational front door. The user describes their situation
("I lost my job in Oakland and need food and help with rent"). An **Agent Bricks** agent
interprets the need, queries a continuously-synced directory of services in **Lakebase**
(sub-10ms lookups), and returns a ranked, eligibility-aware action plan — all in a
**Databricks App**.

## 2. Technical implementation

```
Unity Catalog (Delta: services directory)
        │  continuous sync (CDF)
        ▼
   Lakebase (Postgres)  ──sub-10ms reads──┐
        ▲                                 │
   Agent Bricks agent ◄── natural language │
        │                                 ▼
        └────────────  Databricks App (AppKit / React) ── user
```

- **Lakebase synced tables** — the service directory is synced from a UC Delta table into
  Lakebase Postgres for sub-10ms typeahead and geo/eligibility lookups.
- **Agent Bricks** — an agent that turns free-text need into structured queries + a guided plan.
- **Databricks Apps (AppKit)** — TypeScript/React UI, deployed serverless on Databricks.

> See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the detailed data flow and decisions.

## 3. How it benefits users

People in need get from "I'm in trouble" to "here are 3 places that can help you today, and
you qualify" in one conversation — no agency-hopping, no eligibility guesswork.

## 4. Accessibility & ethical considerations

- Plain-language input/output; no jargon; designed for low digital literacy.
- No collection of PII beyond what's needed; no storage of sensitive personal situations.
- Eligibility guidance is informational, not a determination — always links to the official source.
- _(To expand as we build.)_

## 5. Deployment & sustainability plan

- Runs serverless on Databricks Apps; Lakebase scales to zero when idle (low cost).
- Service directory refreshes automatically via continuous sync from the source of truth.
- _(To expand as we build.)_

---

## Setup & usage

> Filled in as the app is built. High level:

```bash
# Prereqs: Databricks CLI 1.0+, authenticated profile, Node 18+
databricks aitools version          # skills installed
# scaffold, sync, run — see docs/ as steps are completed
```

## Team

- _add team members (2–4 required, all registered for DAIS 2026)_

## License

MIT — see [`LICENSE`](LICENSE).
