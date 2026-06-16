"""Create ESG Delta tables in Unity Catalog with real demo data."""
import time
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState

PROFILE = "hackathon"
WAREHOUSE_ID = "9aa3ec8c00420cfc"
CATALOG = "workspace"
SCHEMA = "esg"

w = WorkspaceClient(profile=PROFILE)

def run_sql(statement: str, description: str = "") -> list:
    if description:
        print(f"  [{description}]...", flush=True)
    resp = w.statement_execution.execute_statement(
        statement=statement,
        warehouse_id=WAREHOUSE_ID,
        wait_timeout="50s",
    )
    for _ in range(120):
        state = resp.status.state
        if state in (StatementState.SUCCEEDED, StatementState.FAILED, StatementState.CANCELED, StatementState.CLOSED):
            break
        time.sleep(1)
        resp = w.statement_execution.get_statement(resp.statement_id)
    if resp.status.state != StatementState.SUCCEEDED:
        print(f"    FAILED: {resp.status.error}", flush=True)
        return []
    if resp.result and resp.result.data_array:
        return resp.result.data_array
    return []

print("Creating ESG schema and tables in Unity Catalog (workspace.esg)...")

run_sql(f"CREATE SCHEMA IF NOT EXISTS {CATALOG}.{SCHEMA}", "create schema")

run_sql(f"""
CREATE TABLE IF NOT EXISTS {CATALOG}.{SCHEMA}.companies (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  name STRING NOT NULL,
  industry STRING,
  reporting_year INT,
  country STRING,
  employee_count INT,
  hq_city STRING,
  revenue_usd_m DOUBLE
) TBLPROPERTIES (delta.enableChangeDataFeed = true)
""", "create companies table")

run_sql(f"""
CREATE TABLE IF NOT EXISTS {CATALOG}.{SCHEMA}.activity_data (
  id BIGINT GENERATED ALWAYS AS IDENTITY,
  fiscal_year INT NOT NULL,
  quarter STRING,
  scope INT NOT NULL,
  category STRING NOT NULL,
  category_label STRING NOT NULL,
  activity_value DOUBLE NOT NULL,
  activity_unit STRING NOT NULL,
  emission_factor DOUBLE NOT NULL,
  co2e_tonnes DOUBLE NOT NULL,
  source_system STRING,
  data_quality STRING,
  created_at TIMESTAMP
) TBLPROPERTIES (delta.enableChangeDataFeed = true)
""", "create activity_data table")

run_sql(f"""
CREATE TABLE IF NOT EXISTS {CATALOG}.{SCHEMA}.emission_factors (
  category STRING NOT NULL,
  scope INT NOT NULL,
  factor DOUBLE NOT NULL,
  unit STRING NOT NULL,
  label STRING NOT NULL,
  standard STRING,
  ref_year INT
) TBLPROPERTIES (delta.enableChangeDataFeed = true)
""", "create emission_factors table")

# Company seed
run_sql(f"""
INSERT INTO {CATALOG}.{SCHEMA}.companies (name, industry, reporting_year, country, employee_count, hq_city, revenue_usd_m)
SELECT 'Acme Corporation', 'Technology', 2025, 'US', 2500, 'San Francisco', 890.0
WHERE NOT EXISTS (SELECT 1 FROM {CATALOG}.{SCHEMA}.companies WHERE name = 'Acme Corporation')
""", "seed company")

# Emission factors seed
run_sql(f"""
INSERT INTO {CATALOG}.{SCHEMA}.emission_factors (category, scope, factor, unit, label, standard, ref_year)
SELECT cat, sc, fac, un, lbl, std, 2024 FROM VALUES
  ('natural_gas',        1, 53.06,   'MMBtu',    'Natural Gas Combustion',         'EPA GHG Protocol'),
  ('diesel',             1, 10.21,   'gallon',   'Diesel Combustion',              'EPA GHG Protocol'),
  ('gasoline',           1, 8.78,    'gallon',   'Gasoline Combustion',            'EPA GHG Protocol'),
  ('refrigerants',       1, 1430.0,  'kg',       'HFC Refrigerants (R-410A)',      'IPCC AR5'),
  ('electricity',        2, 0.386,   'kWh',      'Grid Electricity (US avg)',      'EPA eGRID 2024'),
  ('steam',              2, 0.273,   'kWh',      'District Steam/Heat',            'EPA GHG Protocol'),
  ('air_travel',         3, 0.255,   'km',       'Business Air Travel',            'DEFRA 2024'),
  ('employee_commute',   3, 0.171,   'km',       'Employee Commuting',             'GHG Protocol Scope3'),
  ('hotel_stays',        3, 31.2,    'night',    'Hotel Stays',                    'DEFRA 2024'),
  ('purchased_goods',    3, 0.42,    'USD_1k',   'Purchased Goods & Services',     'GHG Protocol Scope3'),
  ('waste',              3, 573.0,   'tonne',    'Waste to Landfill',              'EPA WARM v15'),
  ('upstream_logistics', 3, 0.0312,  'tonne_km', 'Upstream Freight Transport',     'GLEC Framework')
  AS v(cat, sc, fac, un, lbl, std)
WHERE NOT EXISTS (SELECT 1 FROM {CATALOG}.{SCHEMA}.emission_factors LIMIT 1)
""", "seed emission factors")

# Activity data - quarterly breakdown (FY2025)
SEED = [
    ('natural_gas',        'Natural Gas Combustion',       100_000.0,    1, 53.06,   'MMBtu',    'Utility Provider (PG&E)',    'HIGH'),
    ('diesel',             'Diesel Combustion',             10_000.0,    1, 10.21,   'gallon',   'Fleet Management System',    'HIGH'),
    ('gasoline',           'Gasoline Combustion',            5_000.0,    1,  8.78,   'gallon',   'Fleet Management System',    'HIGH'),
    ('refrigerants',       'HFC Refrigerants',                 150.0,    1, 1430.0,  'kg',       'Facilities HVAC Records',    'MEDIUM'),
    ('electricity',        'Grid Electricity',           8_000_000.0,    2,  0.386,  'kWh',      'Utility Provider (PG&E)',    'HIGH'),
    ('steam',              'District Steam/Heat',           200_000.0,   2,  0.273,  'kWh',      'District Energy Provider',   'HIGH'),
    ('air_travel',         'Business Air Travel',         5_000_000.0,   3,  0.255,  'km',       'Concur Travel Management',   'HIGH'),
    ('employee_commute',   'Employee Commuting',         50_000_000.0,   3,  0.171,  'km',       'HR System (Workday)',         'MEDIUM'),
    ('hotel_stays',        'Hotel Stays',                    12_000.0,   3, 31.2,    'night',    'Concur Travel Management',   'HIGH'),
    ('purchased_goods',    'Purchased Goods & Services',     25_000.0,   3,  0.42,   'USD_1k',   'SAP S/4HANA ERP',            'MEDIUM'),
    ('waste',              'Waste to Landfill',                 200.0,   3, 573.0,   'tonne',    'Facilities Management',      'HIGH'),
    ('upstream_logistics', 'Upstream Freight',            5_000_000.0,   3,  0.0312, 'tonne_km', 'Supply Chain (Oracle SCM)',   'MEDIUM'),
]

QUARTERS = [('Q1', 0.23), ('Q2', 0.25), ('Q3', 0.27), ('Q4', 0.25)]

vals_rows = []
for cat, label, annual_val, scope, factor, unit, source, quality in SEED:
    for q_name, q_frac in QUARTERS:
        val = annual_val * q_frac
        co2e = (val * factor) / 1000
        vals_rows.append(
            f"(2025, '{q_name}', {scope}, '{cat}', '{label}', "
            f"{val:.2f}, '{unit}', {factor}, {co2e:.4f}, '{source}', '{quality}')"
        )

CHUNK = 12
for i in range(0, len(vals_rows), CHUNK):
    chunk = vals_rows[i:i+CHUNK]
    run_sql(f"""
INSERT INTO {CATALOG}.{SCHEMA}.activity_data
  (fiscal_year, quarter, scope, category, category_label, activity_value, activity_unit,
   emission_factor, co2e_tonnes, source_system, data_quality, created_at)
SELECT fy, q, sc, cat, lbl, val, un, ef, co2e, src, qual, current_timestamp() FROM VALUES
  {', '.join(chunk)}
  AS v(fy, q, sc, cat, lbl, val, un, ef, co2e, src, qual)
WHERE NOT EXISTS (SELECT 1 FROM {CATALOG}.{SCHEMA}.activity_data WHERE fiscal_year = 2025 LIMIT 1)
""", f"insert activity rows {i+1}-{min(i+CHUNK, len(vals_rows))}")

print("\nVerifying row counts...")
for tbl in ['companies', 'activity_data', 'emission_factors']:
    result = run_sql(f"SELECT COUNT(*) AS cnt FROM {CATALOG}.{SCHEMA}.{tbl}", f"count {tbl}")
    count = result[0][0] if result else "?"
    print(f"  workspace.esg.{tbl}: {count} rows")

print(f"\nDone! Delta tables with CDF created in {CATALOG}.{SCHEMA}")
