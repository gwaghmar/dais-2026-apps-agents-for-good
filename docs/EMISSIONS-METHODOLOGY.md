# Emissions methodology (GHG Protocol)

How raw ERP activity becomes Scope 1 / 2 / 3 CO₂e. Aligned to the **GHG Protocol
Corporate Standard**. All emission factors in this prototype are **illustrative** —
see the "Production factors" note.

## Scopes covered

| Scope | Definition | Source export | Method | factor basis |
|---|---|---|---|---|
| **Scope 1** | Direct combustion the company owns/controls | `fuel_fleet.csv` (diesel, natural gas, propane) | Fuel combustion | per gallon / therm |
| **Scope 2** | Purchased electricity (location-based) | `utility_bills.csv` (kWh by grid region) | Grid emission factor (eGRID subregion) | per kWh |
| **Scope 3 · Cat 1 & 4** | Purchased goods/services + upstream transport | `erp_general_ledger.csv` (spend) | **Spend-based** EEIO | per USD |
| **Scope 3 · Cat 6** | Business travel | `business_travel.csv` (distance) | Distance-based | per passenger-km |

## Calculation

```
tCO2e = (activity_amount × kgCO2e_per_unit) / 1000
```

- **Scope 1:** quantity (gallons/therms) × fuel factor.
- **Scope 2:** kWh × grid-region factor (location-based). Market-based is a stretch item.
- **Scope 3 spend-based:** USD spend × EEIO factor (kgCO₂e/$). Coarse but standard for
  early-stage Scope 3 — explicitly labeled an **estimate**, not a measurement.
- **Scope 3 travel:** distance × mode/haul factor.

The join key is `factor_key` (+ `scope`) between `silver_activity` and `emission_factors`.

## Production factors (replace the illustrative seed)
- **Scope 1:** [EPA GHG Emission Factors Hub](https://www.epa.gov/climateleadership/ghg-emission-factors-hub)
- **Scope 2:** [EPA eGRID](https://www.epa.gov/egrid) subregion output emission rates
- **Scope 3 spend-based:** EPA **USEEIO** / **EXIOBASE** supply-chain factors
- **Scope 3 travel:** UK **DEFRA** / GHG Protocol transport factors

## Honesty / ethics
The agent and report always state that prototype factors are illustrative and that
spend-based Scope 3 is an estimate. No greenwashing: numbers are traceable from the
report → gold table → silver activity → bronze ERP row.
