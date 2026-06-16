-- ============================================================================
-- 01 · BRONZE — raw ingestion of ERP / source-system exports into Unity Catalog
-- ============================================================================
-- Demonstrates the "take data from popular ERP systems" requirement.
-- In production these land via Lakeflow Connect / Auto Loader from SAP, NetSuite,
-- Workday, Concur, etc. For the hackathon we COPY INTO from a UC Volume that holds
-- the sample exports in /data.
--
-- Run on a Databricks SQL warehouse or serverless notebook with the `hackathon` profile.
-- Replace <CATALOG> if you don't have create-catalog rights (e.g. use `workspace`).

CREATE CATALOG IF NOT EXISTS carbon;
CREATE SCHEMA  IF NOT EXISTS carbon.csr;
CREATE VOLUME  IF NOT EXISTS carbon.csr.landing;

-- >>> Upload the /data/*.csv files to: /Volumes/carbon/csr/landing/  <<<
--   databricks fs cp data/ dbfs:/Volumes/carbon/csr/landing/ --recursive -p hackathon

-- Bronze tables keep source fidelity (1:1 with the exports). CDF on so downstream
-- silver/gold can incrementally rebuild and Lakebase can sync continuously.
CREATE TABLE IF NOT EXISTS carbon.csr.bronze_general_ledger
  TBLPROPERTIES (delta.enableChangeDataFeed = true);
COPY INTO carbon.csr.bronze_general_ledger
  FROM '/Volumes/carbon/csr/landing/erp_general_ledger.csv'
  FILEFORMAT = CSV FORMAT_OPTIONS ('header'='true','inferSchema'='true')
  COPY_OPTIONS ('mergeSchema'='true');

CREATE TABLE IF NOT EXISTS carbon.csr.bronze_utility_bills
  TBLPROPERTIES (delta.enableChangeDataFeed = true);
COPY INTO carbon.csr.bronze_utility_bills
  FROM '/Volumes/carbon/csr/landing/utility_bills.csv'
  FILEFORMAT = CSV FORMAT_OPTIONS ('header'='true','inferSchema'='true')
  COPY_OPTIONS ('mergeSchema'='true');

CREATE TABLE IF NOT EXISTS carbon.csr.bronze_fuel_fleet
  TBLPROPERTIES (delta.enableChangeDataFeed = true);
COPY INTO carbon.csr.bronze_fuel_fleet
  FROM '/Volumes/carbon/csr/landing/fuel_fleet.csv'
  FILEFORMAT = CSV FORMAT_OPTIONS ('header'='true','inferSchema'='true')
  COPY_OPTIONS ('mergeSchema'='true');

CREATE TABLE IF NOT EXISTS carbon.csr.bronze_business_travel
  TBLPROPERTIES (delta.enableChangeDataFeed = true);
COPY INTO carbon.csr.bronze_business_travel
  FROM '/Volumes/carbon/csr/landing/business_travel.csv'
  FILEFORMAT = CSV FORMAT_OPTIONS ('header'='true','inferSchema'='true')
  COPY_OPTIONS ('mergeSchema'='true');

CREATE TABLE IF NOT EXISTS carbon.csr.emission_factors
  TBLPROPERTIES (delta.enableChangeDataFeed = true);
COPY INTO carbon.csr.emission_factors
  FROM '/Volumes/carbon/csr/landing/emission_factors.csv'
  FILEFORMAT = CSV FORMAT_OPTIONS ('header'='true','inferSchema'='true')
  COPY_OPTIONS ('mergeSchema'='true');
