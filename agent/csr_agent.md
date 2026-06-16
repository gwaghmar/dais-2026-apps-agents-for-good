# CSR Analyst — Agent Bricks specification

The conversational core of the app. Built with **Agent Bricks** (required stack).
It answers natural-language questions over the computed emissions, explains hotspots,
recommends reductions, and drafts CSR / sustainability-report narrative.

## Agent type
Agent Bricks **Knowledge Assistant + Tool-calling agent** (multi-tool). Use the
`databricks-agent-bricks` skill to scaffold and deploy.

## Grounding
- **Lakebase (Postgres) `public.emissions_summary`** — the synced gold aggregates
  (sub-10ms reads) the agent queries for live numbers.
- **Mosaic AI Vector Search index** over GHG Protocol guidance + `emission_factors`
  metadata — so the agent cites methodology, not guesses.

## Tools (functions the agent can call)
| Tool | Backing | Returns |
|---|---|---|
| `get_footprint(period, business_unit?, scope?)` | Lakebase query | tCO2e totals |
| `get_hotspots(top_n)` | `v_emission_hotspots` | ranked emission sources + % of total |
| `compare_periods(p1, p2)` | Lakebase | delta + % change |
| `methodology_lookup(factor_key)` | Vector Search | factor source + GHG scope/category |
| `draft_csr_section(period)` | LLM + the above | report-ready narrative paragraph |

## Model
Foundation Model API (Claude on Databricks Model Serving) for reasoning + drafting.

## System prompt (starting point)
> You are a CSR/ESG analyst for a company reporting under the GHG Protocol.
> Always ground figures in the emissions tools — never invent numbers. State the
> scope (1/2/3) and category for every figure. Emission factors are illustrative
> in this prototype; when asked about precision, say production factors come from
> EPA GHG Emission Factors Hub, EPA eGRID, and USEEIO/EXIOBASE/DEFRA, and that
> spend-based Scope 3 is an estimate, not a measurement. Be concise and decision-useful.

## Guardrails
- Refuse to fabricate factors or fill data gaps silently — flag missing activity data.
- Label spend-based Scope 3 as estimated.
- Keep recommendations actionable and tied to the actual hotspots.

## Evaluation (shows "technical execution" to judges)
Run **Mosaic AI Agent Evaluation** on a small golden set (e.g. "What is total Scope 2
for Q1?", "Which category is our biggest Scope 3 source?") and capture the scores in
the demo / slides.
