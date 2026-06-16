-- ============================================================================
-- 03 · GOLD — apply emission factors → Scope 1/2/3 CO2e (GHG Protocol)
-- ============================================================================
-- kgCO2e = activity_amount * factor.kgco2e_per_unit, joined on factor_key.
-- A row-level fact table plus the aggregates the App + Agent read from Lakebase.

CREATE OR REPLACE TABLE carbon.csr.gold_emissions
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT
  a.activity_id,
  a.period_month,
  a.business_unit,
  a.scope,
  a.factor_key,
  a.activity_amount,
  a.activity_unit,
  f.method,
  f.kgco2e_per_unit,
  ROUND(a.activity_amount * f.kgco2e_per_unit / 1000.0, 4) AS tco2e,  -- metric tons CO2e
  a.source_system
FROM carbon.csr.silver_activity a
JOIN carbon.csr.emission_factors f
  ON a.factor_key = f.factor_key
 AND a.scope      = f.scope;

-- Aggregate served to the dashboard / agent (this is what we sync to Lakebase).
CREATE OR REPLACE TABLE carbon.csr.gold_emissions_summary
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT
  period_month,
  business_unit,
  scope,
  ROUND(SUM(tco2e), 4)            AS tco2e,
  COUNT(*)                        AS activity_count
FROM carbon.csr.gold_emissions
GROUP BY period_month, business_unit, scope;

-- Hotspots: top emission sources for the agent's reduction recommendations.
CREATE OR REPLACE VIEW carbon.csr.v_emission_hotspots AS
SELECT scope, factor_key,
       ROUND(SUM(tco2e), 4) AS tco2e,
       ROUND(100 * SUM(tco2e) / SUM(SUM(tco2e)) OVER (), 1) AS pct_of_total
FROM carbon.csr.gold_emissions
GROUP BY scope, factor_key
ORDER BY tco2e DESC;

-- Sanity check: total footprint by scope
-- SELECT scope, ROUND(SUM(tco2e),2) tco2e FROM carbon.csr.gold_emissions GROUP BY scope ORDER BY scope;
