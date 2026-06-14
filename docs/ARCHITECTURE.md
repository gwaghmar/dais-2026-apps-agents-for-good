# Architecture

## Data flow

```
┌─────────────────────────┐
│ Unity Catalog (Delta)   │   Source of truth: service directory table
│  services_directory     │   (name, category, city, eligibility, contact, geo)
└───────────┬─────────────┘
            │  Lakebase synced table (continuous, CDF-backed)
            ▼
┌─────────────────────────┐
│ Lakebase (Postgres)     │   Sub-10ms reads: typeahead, geo/eligibility lookups
│  public.services        │
└───────────┬─────────────┘
            │  appkit.lakebase.query()  (Express routes)
            ▼
┌─────────────────────────┐        ┌──────────────────────┐
│ Databricks App (AppKit) │◄──────►│ Agent Bricks agent   │
│  React UI + server      │        │  NL → structured plan │
└───────────┬─────────────┘        └──────────────────────┘
            │
            ▼
          User
```

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Data access pattern | **Lakebase synced tables** (not analytics warehouse) | Sub-10ms typeahead / lookups for an operational, conversational app |
| App framework | **AppKit** (TypeScript/React) | Type-safe, first-class Lakebase + serving plugins, idiomatic Databricks Apps |
| Agent | **Agent Bricks** | Required by theme; turns free-text need into structured queries + guidance |
| Sync mode | **Continuous** (Change Data Feed) | Directory stays current automatically from the source of truth |

## Why Lakebase synced tables (not analytics)

The app is conversational and operational: a user types a need, the agent must look up matching
services and return them instantly. That's typeahead + point lookups → **Lakebase synced tables**
(sub-second), not warehouse queries (multi-second). See the `databricks-apps` skill Data Access
Decision Gate.

## Open items

- Final source dataset for the service directory (Marketplace social dataset vs. seeded sample).
- Agent Bricks agent definition (tools, system prompt, grounding tables).
- Eligibility model: rules-based vs. agent-reasoned.
