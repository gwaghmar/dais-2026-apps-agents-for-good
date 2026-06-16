# ESG Carbon Reporter

> **DAIS 2026 — Apps & Agents for Good Hackathon** · Built on Databricks **Lakebase + Agent Bricks + Databricks Apps**

An end-to-end corporate sustainability platform that automates GHG emissions accounting (Scope 1, 2, 3) across all enterprise data sources and generates CSRD/CDP/GRI-ready CSR reports — powered entirely by the Databricks data intelligence platform.

---

## 1. Problem statement & solution approach

**Problem.** Large organizations struggle to measure their carbon footprint accurately. Emissions data lives in dozens of disconnected systems — ERP, utility providers, travel management, HR, supply chain. Calculating Scope 1/2/3 requires applying hundreds of emission factors, mapping incompatible column schemas, and navigating complex reporting frameworks (GHG Protocol, CSRD, CDP). Most companies spend 6–9 months on a single CSR report.

**Solution.** ESG Carbon Reporter ingests activity data from any ERP or enterprise system via Databricks, calculates Scope 1, 2, and 3 emissions automatically using GHG Protocol methodologies, and generates audit-ready CSR reports in minutes. An Agent Bricks AI assistant helps sustainability teams interpret results, identify reduction opportunities, and navigate reporting frameworks.

## 2. Technical implementation

```
ERP / Utilities / Travel / HR Systems
        │  CSV upload / API connectors
        ▼
Unity Catalog Delta Table (raw activity data)
        │  continuous sync (CDF → Lakebase)
        ▼
   Lakebase Postgres  ────sub-10ms OLTP reads────┐
   (esg.activity_data                             │
    esg.companies)                                │
        ▲                                         │
   Agent Bricks (Supervisor Agent)  ◄─── NL queries
   "ESG & Carbon Reporter"                        │
   endpoint: mas-8058ac40-endpoint                │
        │                                         ▼
        └─────────── Databricks App (AppKit/React) ── user
                     esg-reporter
```

### Stack
| Component | Databricks Product | Role |
|-----------|-------------------|------|
| Data store | **Lakebase Postgres** | Operational OLTP storage for activity data, company info, report metadata |
| AI agent | **Agent Bricks (Supervisor Agent)** | ESG Q&A, framework guidance, reduction recommendations |
| App platform | **Databricks Apps (AppKit)** | TypeScript/React UI, Express API routes |
| Data catalog | **Unity Catalog** | Source truth for raw activity tables; CDF for sync |

### Key Features
- **Data Ingestion**: CSV upload with column mapping UI; maps non-standard ERP column names to GHG Protocol categories
- **Scope 1/2/3 Calculator**: 12 emission categories, standard GHG Protocol emission factors (EPA eGRID 2024, Scope 3 Technical Guidance)
- **Emissions Dashboard**: Real-time scope breakdown, category heatmap, intensity metrics — all from Lakebase sub-10ms queries
- **ESG AI Assistant**: Agent Bricks supervisor agent answers questions about frameworks (CSRD, CDP, TCFD, GRI, SBTi), interprets emissions data, and suggests reduction opportunities
- **CSR Report Generator**: One-click report covering GHG inventory, reduction targets, and framework alignment — printable to PDF

> See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for full data flow and decisions.

## 3. Social impact

This tool directly addresses a major barrier to corporate climate action: **measurement complexity**. When organizations can't measure their emissions quickly and accurately, they can't reduce them effectively. ESG Carbon Reporter lowers the cost of emissions measurement from months to minutes, enabling:

- **Smaller companies** to participate in scope 3 supplier engagement programs (previously only feasible for enterprises with dedicated ESG teams)
- **Faster disclosure** to investors, regulators (CSRD), and customers who demand transparency
- **Better reduction targeting** — knowing which Scope 3 category is largest helps prioritize interventions

## 4. Ethical considerations

- Emission factors are sourced from authoritative public databases (EPA, GHG Protocol) and clearly cited
- No personal data stored — all activity data is at company/organizational level
- Results are a calculation, not a regulatory determination — users are directed to official frameworks for compliance
- Open source emission factor library (CEDA-compatible) for full auditability

## 5. Deployment & sustainability plan

- Databricks Apps scales to zero when idle (serverless)
- Lakebase Postgres handles concurrent multi-org access with autoscaling (0.5–32 CU)
- Delta CDF enables real-time sync from any ERP as data changes
- Multi-tenant architecture: additional companies can be onboarded by adding rows to `esg.companies`

---

## Setup & usage

```bash
# Prerequisites: Databricks CLI 1.3+, Node 18+, authenticated workspace profile

# 1. Clone
git clone https://github.com/gwaghmar/dais-2026-apps-agents-for-good.git
cd dais-2026-apps-agents-for-good/esg-reporter

# 2. Install dependencies
npm install

# 3. Set up Lakebase (already provisioned in hackathon workspace)
databricks postgres list-projects --profile hackathon
# → projects/community-resource-nav (production branch, primary endpoint)

# 4. Deploy
databricks bundle deploy --profile hackathon

# 5. Start the app
databricks bundle run --profile hackathon

# 6. Open the app URL from workspace UI → Apps → esg-reporter
```

### Local development (after first deploy)
```bash
cd esg-reporter
npm run dev
# Connects to deployed Lakebase and Agent Bricks endpoint
```

## Infrastructure (already deployed)

| Resource | ID / Name |
|----------|-----------|
| Lakebase Project | `projects/community-resource-nav` |
| Lakebase Branch | `projects/community-resource-nav/branches/production` |
| Lakebase Host | `ep-lingering-cloud-d8osdgro.database.us-east-2.cloud.databricks.com` |
| Agent Bricks Supervisor | `supervisor-agents/8058ac40-5f4a-42f6-ad34-c3c14eb04b1a` |
| Serving Endpoint | `mas-8058ac40-endpoint` |

## Team

- Govind Waghmare _(add remaining team members — 2–4 required, all registered for DAIS 2026)_

## License

MIT — see [`LICENSE`](LICENSE).
