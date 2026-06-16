-- ============================================================================
-- 02 · SILVER — normalize heterogeneous ERP exports into one activity model
-- ============================================================================
-- Every source becomes a row in a common shape so the gold layer can apply
-- emission factors uniformly. This is the "clean the data" step.
--
--   activity_id | period_month | business_unit | scope | factor_key
--               | activity_amount | activity_unit | source_system
--
-- factor_key joins to carbon.csr.emission_factors.

CREATE OR REPLACE TABLE carbon.csr.silver_activity
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS

-- Scope 1: direct fuel combustion (fleet, generators, forklifts)
SELECT
  record_id                                   AS activity_id,
  date_trunc('MONTH', posting_date)           AS period_month,
  business_unit,
  1                                           AS scope,
  fuel_type                                   AS factor_key,
  CAST(quantity AS DOUBLE)                    AS activity_amount,
  unit                                        AS activity_unit,
  source_system
FROM carbon.csr.bronze_fuel_fleet

UNION ALL
-- Scope 2: purchased electricity, location-based by grid region
SELECT
  bill_id,
  date_trunc('MONTH', period_start),
  business_unit,
  2,
  grid_region,
  CAST(kwh AS DOUBLE),
  'kwh',
  source_system
FROM carbon.csr.bronze_utility_bills

UNION ALL
-- Scope 3 Cat 1 & 4: spend-based from the general ledger
SELECT
  txn_id,
  date_trunc('MONTH', posting_date),
  business_unit,
  3,
  spend_category,
  CAST(amount_usd AS DOUBLE),
  'usd',
  source_system
FROM carbon.csr.bronze_general_ledger

UNION ALL
-- Scope 3 Cat 6: business travel, distance-based by mode/haul
SELECT
  trip_id,
  date_trunc('MONTH', travel_date),
  business_unit,
  3,
  CASE WHEN mode = 'air' THEN concat('air_', haul) ELSE mode END,
  CAST(distance_km AS DOUBLE),   -- 1 passenger => passenger_km == distance_km
  'passenger_km',
  source_system
FROM carbon.csr.bronze_business_travel;
