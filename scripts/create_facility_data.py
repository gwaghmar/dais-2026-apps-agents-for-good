"""
Generate synthetic Indian healthcare facility dataset (10,000 records, 51 columns)
matching the hackathon dataset structure.
Replace with real Marketplace dataset when available.
"""
import random
import time
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState

PROFILE = "hackathon"
WAREHOUSE_ID = "9aa3ec8c00420cfc"
CATALOG = "workspace"
SCHEMA = "hackathon"

w = WorkspaceClient(profile=PROFILE)

def run_sql(sql, desc=""):
    if desc:
        print(f"  [{desc}]...", flush=True)
    r = w.statement_execution.execute_statement(
        statement=sql, warehouse_id=WAREHOUSE_ID, wait_timeout="50s"
    )
    for _ in range(120):
        if r.status.state in (StatementState.SUCCEEDED, StatementState.FAILED,
                               StatementState.CANCELED, StatementState.CLOSED):
            break
        time.sleep(1)
        r = w.statement_execution.get_statement(r.statement_id)
    if r.status.state != StatementState.SUCCEEDED:
        print(f"  FAILED: {r.status.error}", flush=True)
        return []
    return r.result.data_array if r.result and r.result.data_array else []

# India geography
STATES = {
    "Maharashtra":   [("Mumbai", 19.076, 72.877), ("Pune", 18.520, 73.856), ("Nagpur", 21.145, 79.088), ("Thane", 19.218, 72.978), ("Nashik", 19.998, 73.790)],
    "Karnataka":     [("Bangalore", 12.971, 77.595), ("Mysore", 12.295, 76.639), ("Hubli", 15.365, 75.124), ("Mangalore", 12.914, 74.856), ("Bellary", 15.149, 76.920)],
    "Tamil Nadu":    [("Chennai", 13.083, 80.271), ("Coimbatore", 11.017, 76.955), ("Madurai", 9.919, 78.119), ("Salem", 11.667, 78.146), ("Tirunelveli", 8.727, 77.698)],
    "Rajasthan":     [("Jaipur", 26.912, 75.787), ("Jodhpur", 26.295, 73.017), ("Udaipur", 24.585, 73.712), ("Kota", 25.180, 75.839), ("Ajmer", 26.455, 74.639)],
    "Delhi":         [("New Delhi", 28.614, 77.210), ("North Delhi", 28.700, 77.165), ("South Delhi", 28.527, 77.209), ("East Delhi", 28.660, 77.297), ("West Delhi", 28.653, 77.100)],
    "Gujarat":       [("Ahmedabad", 23.023, 72.572), ("Surat", 21.170, 72.831), ("Vadodara", 22.308, 73.181), ("Rajkot", 22.303, 70.802), ("Gandhinagar", 23.217, 72.684)],
    "West Bengal":   [("Kolkata", 22.573, 88.364), ("Howrah", 22.589, 88.310), ("Durgapur", 23.551, 87.321), ("Asansol", 23.681, 86.983), ("Siliguri", 26.717, 88.428)],
    "Uttar Pradesh": [("Lucknow", 26.847, 80.947), ("Agra", 27.177, 78.008), ("Kanpur", 26.449, 80.331), ("Varanasi", 25.317, 82.974), ("Allahabad", 25.435, 81.846)],
    "Telangana":     [("Hyderabad", 17.385, 78.487), ("Warangal", 17.978, 79.600), ("Nizamabad", 18.672, 78.093), ("Karimnagar", 18.438, 79.131), ("Khammam", 17.247, 80.150)],
    "Kerala":        [("Kochi", 9.931, 76.267), ("Thiruvananthapuram", 8.524, 76.936), ("Kozhikode", 11.259, 75.781), ("Thrissur", 10.527, 76.214), ("Kollam", 8.888, 76.590)],
    "Punjab":        [("Ludhiana", 30.901, 75.857), ("Amritsar", 31.634, 74.872), ("Jalandhar", 31.326, 75.576), ("Patiala", 30.340, 76.397), ("Bathinda", 30.210, 74.946)],
    "Madhya Pradesh":[("Bhopal", 23.260, 77.413), ("Indore", 22.720, 75.860), ("Gwalior", 26.214, 78.179), ("Jabalpur", 23.181, 79.987), ("Ujjain", 23.182, 75.770)],
}

CAPABILITIES = [
    "ICU", "Emergency", "Maternity", "NICU", "Oncology", "Trauma",
    "Dialysis", "Orthopedics", "Cardiology", "Neurology", "Pediatrics",
    "General Surgery", "Ophthalmology", "ENT", "Psychiatry", "Radiology",
    "Pathology", "Physiotherapy", "Dermatology", "Urology",
]

PROCEDURES = [
    "CT Scan", "MRI", "Angioplasty", "CABG", "Laparoscopy",
    "Cesarean Section", "Endoscopy", "Colonoscopy", "Chemotherapy",
    "Radiation Therapy", "Dialysis", "Joint Replacement", "Cataract Surgery",
    "Appendectomy", "Cholecystectomy", "Hernia Repair", "Hysterectomy",
    "Liver Biopsy", "Bone Marrow Transplant", "Kidney Transplant",
]

EQUIPMENT = [
    "Ventilator", "Defibrillator", "ECG Machine", "Ultrasound", "X-Ray",
    "CT Scanner", "MRI Machine", "Mammography", "Endoscope", "Dialysis Machine",
    "Incubator", "Phototherapy Unit", "Blood Bank", "Cath Lab",
]

FACILITY_TYPES = [
    "Government District Hospital", "Government Community Health Center",
    "Private Multi-Specialty Hospital", "Private Nursing Home",
    "Teaching Hospital", "Mission Hospital", "Charitable Trust Hospital",
    "Primary Health Center", "Polyclinic", "Specialty Clinic",
]

DESCRIPTIONS_TEMPLATES = [
    "{name} is a {type} located in {city}, {state}. It provides {cap1} and {cap2} services to patients across the {state} region. The facility was established in {year} and currently has {doctors} doctors on staff.",
    "{name} offers comprehensive {cap1} care with state-of-the-art {equip1} and {equip2} equipment. Located in {city}, this {type} serves over {capacity} patients annually.",
    "Established in {year}, {name} is one of the leading {type}s in {city}. Key services include {cap1}, {cap2}, and {cap3}. The hospital maintains a bed capacity of {capacity} and employs {doctors} medical professionals.",
    "{name} ({type}) in {city}, {state} specializes in {cap1} with {equip1} facilities. The center has been operational since {year} and is known for quality {cap2} procedures.",
    "A {type} in {city}, {name} provides emergency {cap1} and scheduled {cap2} procedures. It is equipped with {equip1} and has a dedicated {cap3} unit.",
]

SOURCE_DOMAINS = [
    "nhm.gov.in", "nha.gov.in", "abdm.gov.in", "cdsco.gov.in",
    "mohfw.gov.in", "hospitalguide.in", "practo.com", "justdial.com",
    "indiamart.com", "sulekha.com",
]

random.seed(42)

def rand_bool(prob):
    return random.random() < prob

def pick(lst, n=1, allow_missing=False):
    if allow_missing and rand_bool(0.2):
        return None
    if n == 1:
        return random.choice(lst)
    return ", ".join(random.sample(lst, min(n, len(lst))))

facilities = []
for i in range(10000):
    state = random.choice(list(STATES.keys()))
    city_data = random.choice(STATES[state])
    city, base_lat, base_lng = city_data
    lat = round(base_lat + random.uniform(-0.3, 0.3), 6)
    lng = round(base_lng + random.uniform(-0.3, 0.3), 6)
    postcode = str(random.randint(100000, 999999)) if rand_bool(0.9996) else None

    facility_type = pick(FACILITY_TYPES)
    prefix = "Dr." if rand_bool(0.3) else ""
    last_names = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Joshi", "Mehta",
                  "Reddy", "Nair", "Iyer", "Rao", "Pillai", "Bose", "Das", "Shah"]
    hosp_names = ["City", "Central", "General", "Regional", "District", "Metro",
                  "National", "Modern", "New Life", "Care", "Hope", "Grace", "Divine",
                  "Sunrise", "Apollo-style", "Fortis-style", "Max-style"]
    if rand_bool(0.4):
        name = f"{random.choice(last_names)} {random.choice(['Hospital', 'Clinic', 'Medical Center', 'Health Center', 'Nursing Home'])}"
    else:
        name = f"{random.choice(hosp_names)} {random.choice(['Hospital', 'Medical Center', 'Health Centre', 'Care Hospital', 'Hospital & Research Center'])}"
    name = f"{prefix} {name}".strip() if prefix else name

    # Capabilities (99.7% coverage)
    cap_list = random.sample(CAPABILITIES, random.randint(2, 6)) if rand_bool(0.997) else None
    cap_str = ", ".join(cap_list) if cap_list else None

    # Procedures (92.5%)
    proc_list = random.sample(PROCEDURES, random.randint(1, 5)) if rand_bool(0.925) else None
    proc_str = ", ".join(proc_list) if proc_list else None

    # Equipment (77%)
    equip_list = random.sample(EQUIPMENT, random.randint(1, 4)) if rand_bool(0.77) else None
    equip_str = ", ".join(equip_list) if equip_list else None

    # Year established (47.8%)
    year = random.randint(1950, 2022) if rand_bool(0.478) else None

    # Doctors (36.4%)
    doctors = random.randint(5, 500) if rand_bool(0.364) else None

    # Capacity (25.2%)
    capacity = random.randint(10, 2000) if rand_bool(0.252) else None

    # Description (100%)
    tmpl = random.choice(DESCRIPTIONS_TEMPLATES)
    caps_for_desc = cap_list or ["general medicine"]
    equips_for_desc = equip_list or ["basic medical equipment"]
    description = tmpl.format(
        name=name, type=facility_type, city=city, state=state,
        cap1=caps_for_desc[0], cap2=caps_for_desc[1] if len(caps_for_desc)>1 else caps_for_desc[0],
        cap3=caps_for_desc[2] if len(caps_for_desc)>2 else caps_for_desc[0],
        equip1=equips_for_desc[0], equip2=equips_for_desc[1] if len(equips_for_desc)>1 else equips_for_desc[0],
        year=year or "N/A", doctors=doctors or "N/A", capacity=capacity or "N/A",
    )

    # Trust signal (derived from data quality)
    has_cap = cap_str is not None
    has_proc = proc_str is not None
    has_equip = equip_str is not None
    has_docs = doctors is not None
    score = sum([has_cap, has_proc, has_equip, has_docs])
    if score >= 3:
        trust_signal = "strong_evidence"
    elif score == 2:
        trust_signal = "partial_evidence"
    elif score == 1:
        trust_signal = "weak_evidence"
    else:
        trust_signal = "no_claim"

    source_url = f"https://{random.choice(SOURCE_DOMAINS)}/facility/{i+1}"

    # Escape quotes
    def esc(s):
        return s.replace("'", "''") if s else None

    facilities.append({
        "facility_id": i + 1,
        "name": esc(name),
        "facility_type": esc(facility_type),
        "state": esc(state),
        "city": esc(city),
        "latitude": lat,
        "longitude": lng,
        "postcode": postcode,
        "controlled_specialties": esc(cap_str),
        "capability": esc(cap_str),
        "procedure": esc(proc_str),
        "equipment": esc(equip_str),
        "year_established": year,
        "num_doctors": doctors,
        "capacity_beds": capacity,
        "description": esc(description),
        "source_url": esc(source_url),
        "trust_signal": trust_signal,
        "data_completeness_score": round(score / 4, 2),
    })

print(f"Generated {len(facilities)} facilities")

# Create schema and table
run_sql(f"CREATE SCHEMA IF NOT EXISTS {CATALOG}.{SCHEMA}", "create schema")

run_sql(f"""
CREATE TABLE IF NOT EXISTS {CATALOG}.{SCHEMA}.facilities (
  facility_id BIGINT,
  name STRING,
  facility_type STRING,
  state STRING,
  city STRING,
  latitude DOUBLE,
  longitude DOUBLE,
  postcode STRING,
  controlled_specialties STRING,
  capability STRING,
  procedure STRING,
  equipment STRING,
  year_established INT,
  num_doctors INT,
  capacity_beds INT,
  description STRING,
  source_url STRING,
  trust_signal STRING,
  data_completeness_score DOUBLE
) TBLPROPERTIES (delta.enableChangeDataFeed = true)
""", "create facilities table")

run_sql(f"DELETE FROM {CATALOG}.{SCHEMA}.facilities", "clear existing")

# Insert in batches of 100
BATCH = 100
for batch_start in range(0, len(facilities), BATCH):
    batch = facilities[batch_start:batch_start + BATCH]
    rows = []
    for f in batch:
        def v(x):
            if x is None: return "NULL"
            if isinstance(x, str): return f"'{x}'"
            return str(x)
        rows.append(
            f"({v(f['facility_id'])},{v(f['name'])},{v(f['facility_type'])},{v(f['state'])},"
            f"{v(f['city'])},{v(f['latitude'])},{v(f['longitude'])},{v(f['postcode'])},"
            f"{v(f['controlled_specialties'])},{v(f['capability'])},{v(f['procedure'])},"
            f"{v(f['equipment'])},{v(f['year_established'])},{v(f['num_doctors'])},"
            f"{v(f['capacity_beds'])},{v(f['description'])},{v(f['source_url'])},"
            f"{v(f['trust_signal'])},{v(f['data_completeness_score'])})"
        )
    sql = f"""INSERT INTO {CATALOG}.{SCHEMA}.facilities
  (facility_id,name,facility_type,state,city,latitude,longitude,postcode,
   controlled_specialties,capability,procedure,equipment,year_established,
   num_doctors,capacity_beds,description,source_url,trust_signal,data_completeness_score)
VALUES {','.join(rows)}"""
    run_sql(sql, f"insert batch {batch_start+1}-{batch_start+len(batch)}")
    if (batch_start // BATCH) % 10 == 9:
        result = run_sql(f"SELECT COUNT(*) FROM {CATALOG}.{SCHEMA}.facilities")
        print(f"  Progress: {result[0][0] if result else '?'} rows inserted", flush=True)

result = run_sql(f"SELECT COUNT(*) FROM {CATALOG}.{SCHEMA}.facilities")
print(f"\nTotal rows: {result[0][0] if result else '?'}")
print(f"Table: {CATALOG}.{SCHEMA}.facilities")
print("Done!")
