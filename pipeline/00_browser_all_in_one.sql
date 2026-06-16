-- ============================================================================
-- 00 · BROWSER ALL-IN-ONE — paste into the Databricks SQL Editor and Run
-- ============================================================================
-- No laptop / no CLI / no file upload needed. Sample ERP data is inlined as
-- VALUES, so this single script builds the whole medallion: bronze -> silver
-- -> gold, plus the aggregates the App + Agent read.
--
-- If you lack create-catalog rights, find/replace  carbon  ->  workspace.
-- ============================================================================

CREATE CATALOG IF NOT EXISTS carbon;
CREATE SCHEMA  IF NOT EXISTS carbon.csr;

-- ---------------------------------------------------------------------------
-- BRONZE (data inlined; in production these land via Lakeflow Connect/Auto Loader)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TABLE carbon.csr.bronze_fuel_fleet
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT * FROM VALUES
 ('FF-3001', DATE'2026-01-15', 'Logistics',     'Truck-Fleet',      'diesel',      8200, 'gallon', 32800.00, 'SAP'),
 ('FF-3002', DATE'2026-02-15', 'Logistics',     'Truck-Fleet',      'diesel',      7950, 'gallon', 31800.00, 'SAP'),
 ('FF-3003', DATE'2026-03-15', 'Logistics',     'Truck-Fleet',      'diesel',      8600, 'gallon', 34400.00, 'SAP'),
 ('FF-3004', DATE'2026-01-20', 'Manufacturing', 'Backup-Generator', 'natural_gas', 4200, 'therm',   3360.00, 'SAP'),
 ('FF-3005', DATE'2026-02-20', 'Manufacturing', 'Backup-Generator', 'natural_gas', 3900, 'therm',   3120.00, 'SAP'),
 ('FF-3006', DATE'2026-03-20', 'Manufacturing', 'Forklift-Fleet',   'propane',     1850, 'gallon',  5550.00, 'SAP')
AS t(record_id, posting_date, business_unit, asset, fuel_type, quantity, unit, amount_usd, source_system);

CREATE OR REPLACE TABLE carbon.csr.bronze_utility_bills
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT * FROM VALUES
 ('UB-2001', DATE'2026-01-01', DATE'2026-01-31', 'Plant-A', 'Manufacturing', 'CAMX', 'electricity', 412000, 61800.00, 'Workday'),
 ('UB-2002', DATE'2026-02-01', DATE'2026-02-28', 'Plant-A', 'Manufacturing', 'CAMX', 'electricity', 398500, 59775.00, 'Workday'),
 ('UB-2003', DATE'2026-03-01', DATE'2026-03-31', 'Plant-A', 'Manufacturing', 'CAMX', 'electricity', 421300, 63195.00, 'Workday'),
 ('UB-2004', DATE'2026-01-01', DATE'2026-01-31', 'DC-East', 'Logistics',     'RFCE', 'electricity', 156000, 21840.00, 'Workday'),
 ('UB-2005', DATE'2026-02-01', DATE'2026-02-28', 'DC-East', 'Logistics',     'RFCE', 'electricity', 149200, 20888.00, 'Workday'),
 ('UB-2006', DATE'2026-03-01', DATE'2026-03-31', 'DC-East', 'Logistics',     'RFCE', 'electricity', 161400, 22596.00, 'Workday'),
 ('UB-2007', DATE'2026-01-01', DATE'2026-03-31', 'HQ',      'Corporate',     'CAMX', 'electricity',  88000, 13200.00, 'Workday')
AS t(bill_id, period_start, period_end, facility, business_unit, grid_region, energy_type, kwh, amount_usd, source_system);

CREATE OR REPLACE TABLE carbon.csr.bronze_general_ledger
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT * FROM VALUES
 ('GL-1001', DATE'2026-01-12', 'Manufacturing', '500100', 'Purchased Goods - Steel',    'AcmeSteel Co', 'purchased_goods_metals',   128400.00, 'USD', 'SAP'),
 ('GL-1002', DATE'2026-01-18', 'Manufacturing', '500110', 'Purchased Goods - Plastics', 'PolyForm Inc', 'purchased_goods_plastics',  42150.00, 'USD', 'SAP'),
 ('GL-1003', DATE'2026-01-22', 'Logistics',     '520300', 'Freight - Road',             'HaulRight LLC','freight_road',              18900.00, 'USD', 'SAP'),
 ('GL-1004', DATE'2026-02-03', 'Corporate',     '610200', 'Professional Services',      'Deloitte',     'professional_services',     75000.00, 'USD', 'NetSuite'),
 ('GL-1005', DATE'2026-02-09', 'Manufacturing', '500100', 'Purchased Goods - Steel',    'AcmeSteel Co', 'purchased_goods_metals',    98750.00, 'USD', 'SAP'),
 ('GL-1006', DATE'2026-02-15', 'Retail',        '530400', 'Packaging Materials',        'BoxWorks',     'purchased_goods_paper',     22300.00, 'USD', 'NetSuite'),
 ('GL-1007', DATE'2026-02-27', 'Logistics',     '520320', 'Freight - Air',              'SkyCargo',     'freight_air',               31200.00, 'USD', 'SAP'),
 ('GL-1008', DATE'2026-03-05', 'Corporate',     '640100', 'Cloud Computing',            'Databricks',   'it_services',               46000.00, 'USD', 'NetSuite'),
 ('GL-1009', DATE'2026-03-14', 'Manufacturing', '500110', 'Purchased Goods - Plastics', 'PolyForm Inc', 'purchased_goods_plastics',  37800.00, 'USD', 'SAP'),
 ('GL-1010', DATE'2026-03-21', 'Retail',        '530400', 'Packaging Materials',        'BoxWorks',     'purchased_goods_paper',     19850.00, 'USD', 'NetSuite'),
 ('GL-1011', DATE'2026-03-28', 'Logistics',     '520300', 'Freight - Road',             'HaulRight LLC','freight_road',              24100.00, 'USD', 'SAP'),
 ('GL-1012', DATE'2026-03-30', 'Corporate',     '610200', 'Professional Services',      'KPMG',         'professional_services',     52000.00, 'USD', 'NetSuite')
AS t(txn_id, posting_date, business_unit, gl_account, gl_account_name, vendor, spend_category, amount_usd, currency, source_system);

CREATE OR REPLACE TABLE carbon.csr.bronze_business_travel
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT * FROM VALUES
 ('BT-4001', DATE'2026-01-10', 'Corporate',     'Sales',       'air',  3900, 'long_haul',   640.00, 'Concur'),
 ('BT-4002', DATE'2026-01-25', 'Corporate',     'Sales',       'air',  1100, 'short_haul',  280.00, 'Concur'),
 ('BT-4003', DATE'2026-02-08', 'Manufacturing', 'Engineering', 'air',  5200, 'long_haul',   820.00, 'Concur'),
 ('BT-4004', DATE'2026-02-19', 'Corporate',     'Exec',        'air',  8800, 'long_haul',  2100.00, 'Concur'),
 ('BT-4005', DATE'2026-03-04', 'Logistics',     'Ops',         'rail',  650, 'na',           90.00, 'Concur'),
 ('BT-4006', DATE'2026-03-17', 'Corporate',     'Sales',       'air',  1450, 'short_haul',  310.00, 'Concur'),
 ('BT-4007', DATE'2026-03-29', 'Manufacturing', 'Engineering', 'car',   420, 'na',          180.00, 'Concur')
AS t(trip_id, travel_date, business_unit, employee_dept, mode, distance_km, haul, amount_usd, source_system);

CREATE OR REPLACE TABLE carbon.csr.emission_factors
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT * FROM VALUES
 ('diesel',                    1, 'fuel_combustion',     'gallon',       10.21,  'EPA GHG Emission Factors Hub', 'ILLUSTRATIVE - replace with current EPA factor'),
 ('natural_gas',               1, 'fuel_combustion',     'therm',         5.31,  'EPA GHG Emission Factors Hub', 'ILLUSTRATIVE'),
 ('propane',                   1, 'fuel_combustion',     'gallon',        5.74,  'EPA GHG Emission Factors Hub', 'ILLUSTRATIVE'),
 ('CAMX',                      2, 'grid_location_based', 'kwh',           0.228, 'EPA eGRID',                    'CA WECC CAMX grid avg - ILLUSTRATIVE'),
 ('RFCE',                      2, 'grid_location_based', 'kwh',           0.331, 'EPA eGRID',                    'RFC East grid avg - ILLUSTRATIVE'),
 ('purchased_goods_metals',    3, 'spend_based',         'usd',           0.95,  'USEEIO/EXIOBASE',              'Scope 3 Cat 1 - ILLUSTRATIVE kgCO2e/USD'),
 ('purchased_goods_plastics',  3, 'spend_based',         'usd',           0.62,  'USEEIO/EXIOBASE',              'Scope 3 Cat 1 - ILLUSTRATIVE'),
 ('purchased_goods_paper',     3, 'spend_based',         'usd',           0.55,  'USEEIO/EXIOBASE',              'Scope 3 Cat 1 - ILLUSTRATIVE'),
 ('freight_road',              3, 'spend_based',         'usd',           0.41,  'USEEIO/EXIOBASE',              'Scope 3 Cat 4 - ILLUSTRATIVE'),
 ('freight_air',               3, 'spend_based',         'usd',           1.05,  'USEEIO/EXIOBASE',              'Scope 3 Cat 4 - ILLUSTRATIVE'),
 ('professional_services',     3, 'spend_based',         'usd',           0.12,  'USEEIO/EXIOBASE',              'Scope 3 Cat 1 services - ILLUSTRATIVE'),
 ('it_services',               3, 'spend_based',         'usd',           0.18,  'USEEIO/EXIOBASE',              'Scope 3 Cat 1 cloud/IT - ILLUSTRATIVE'),
 ('air_long_haul',             3, 'distance_based',      'passenger_km',  0.150, 'DEFRA/GHG Protocol',           'Scope 3 Cat 6 - ILLUSTRATIVE'),
 ('air_short_haul',            3, 'distance_based',      'passenger_km',  0.246, 'DEFRA/GHG Protocol',           'Scope 3 Cat 6 - ILLUSTRATIVE'),
 ('rail',                      3, 'distance_based',      'passenger_km',  0.035, 'DEFRA/GHG Protocol',           'Scope 3 Cat 6 - ILLUSTRATIVE'),
 ('car',                       3, 'distance_based',      'passenger_km',  0.170, 'DEFRA/GHG Protocol',           'Scope 3 Cat 6 - ILLUSTRATIVE')
AS t(factor_key, scope, method, basis_unit, kgco2e_per_unit, source, notes);

-- ---------------------------------------------------------------------------
-- SILVER — normalize every ERP export into one activity model
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TABLE carbon.csr.silver_activity
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT record_id AS activity_id, date_trunc('MONTH', posting_date) AS period_month,
       business_unit, 1 AS scope, fuel_type AS factor_key,
       CAST(quantity AS DOUBLE) AS activity_amount, unit AS activity_unit, source_system
FROM carbon.csr.bronze_fuel_fleet
UNION ALL
SELECT bill_id, date_trunc('MONTH', period_start), business_unit, 2, grid_region,
       CAST(kwh AS DOUBLE), 'kwh', source_system
FROM carbon.csr.bronze_utility_bills
UNION ALL
SELECT txn_id, date_trunc('MONTH', posting_date), business_unit, 3, spend_category,
       CAST(amount_usd AS DOUBLE), 'usd', source_system
FROM carbon.csr.bronze_general_ledger
UNION ALL
SELECT trip_id, date_trunc('MONTH', travel_date), business_unit, 3,
       CASE WHEN mode = 'air' THEN concat('air_', haul) ELSE mode END,
       CAST(distance_km AS DOUBLE), 'passenger_km', source_system
FROM carbon.csr.bronze_business_travel;

-- ---------------------------------------------------------------------------
-- GOLD — apply emission factors -> Scope 1/2/3 tCO2e
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TABLE carbon.csr.gold_emissions
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT a.activity_id, a.period_month, a.business_unit, a.scope, a.factor_key,
       a.activity_amount, a.activity_unit, f.method, f.kgco2e_per_unit,
       ROUND(a.activity_amount * f.kgco2e_per_unit / 1000.0, 4) AS tco2e,
       a.source_system
FROM carbon.csr.silver_activity a
JOIN carbon.csr.emission_factors f
  ON a.factor_key = f.factor_key AND a.scope = f.scope;

CREATE OR REPLACE TABLE carbon.csr.gold_emissions_summary
  TBLPROPERTIES (delta.enableChangeDataFeed = true) AS
SELECT period_month, business_unit, scope,
       ROUND(SUM(tco2e), 4) AS tco2e, COUNT(*) AS activity_count
FROM carbon.csr.gold_emissions
GROUP BY period_month, business_unit, scope;

CREATE OR REPLACE VIEW carbon.csr.v_emission_hotspots AS
SELECT scope, factor_key, ROUND(SUM(tco2e), 4) AS tco2e,
       ROUND(100 * SUM(tco2e) / SUM(SUM(tco2e)) OVER (), 1) AS pct_of_total
FROM carbon.csr.gold_emissions
GROUP BY scope, factor_key
ORDER BY tco2e DESC;

-- ---------------------------------------------------------------------------
-- VERIFY — expect 3 rows (Scope 1, 2, 3)
-- ---------------------------------------------------------------------------
SELECT scope, ROUND(SUM(tco2e), 2) AS tco2e
FROM carbon.csr.gold_emissions
GROUP BY scope ORDER BY scope;
