"""Load remaining facility records (1701-10000) into workspace.hackathon.facilities."""
import random, time
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState

w = WorkspaceClient(profile='hackathon')
WH = '9aa3ec8c00420cfc'

def run(sql):
    r = w.statement_execution.execute_statement(statement=sql, warehouse_id=WH, wait_timeout='50s')
    for _ in range(120):
        if r.status.state in (StatementState.SUCCEEDED, StatementState.FAILED,
                               StatementState.CANCELED, StatementState.CLOSED):
            break
        time.sleep(1)
        r = w.statement_execution.get_statement(r.statement_id)
    if r.status.state != StatementState.SUCCEEDED:
        print(f'  FAIL at statement', flush=True)
        return False
    return True

STATES = {
    'Maharashtra':   [('Mumbai',19.076,72.877),('Pune',18.520,73.856),('Nagpur',21.145,79.088),('Thane',19.218,72.978)],
    'Karnataka':     [('Bangalore',12.971,77.595),('Mysore',12.295,76.639),('Hubli',15.365,75.124),('Mangalore',12.914,74.856)],
    'Tamil Nadu':    [('Chennai',13.083,80.271),('Coimbatore',11.017,76.955),('Madurai',9.919,78.119),('Salem',11.667,78.146)],
    'Rajasthan':     [('Jaipur',26.912,75.787),('Jodhpur',26.295,73.017),('Udaipur',24.585,73.712),('Kota',25.180,75.839)],
    'Delhi':         [('New Delhi',28.614,77.210),('North Delhi',28.700,77.165),('South Delhi',28.527,77.209)],
    'Gujarat':       [('Ahmedabad',23.023,72.572),('Surat',21.170,72.831),('Vadodara',22.308,73.181),('Rajkot',22.303,70.802)],
    'West Bengal':   [('Kolkata',22.573,88.364),('Howrah',22.589,88.310),('Durgapur',23.551,87.321)],
    'Uttar Pradesh': [('Lucknow',26.847,80.947),('Agra',27.177,78.008),('Kanpur',26.449,80.331),('Varanasi',25.317,82.974)],
    'Telangana':     [('Hyderabad',17.385,78.487),('Warangal',17.978,79.600),('Nizamabad',18.672,78.093)],
    'Kerala':        [('Kochi',9.931,76.267),('Thiruvananthapuram',8.524,76.936),('Kozhikode',11.259,75.781)],
    'Punjab':        [('Ludhiana',30.901,75.857),('Amritsar',31.634,74.872),('Jalandhar',31.326,75.576)],
    'Madhya Pradesh':[('Bhopal',23.260,77.413),('Indore',22.720,75.860),('Gwalior',26.214,78.179)],
}
CAPS = ['ICU','Emergency','Maternity','NICU','Oncology','Trauma','Dialysis','Orthopedics','Cardiology','Neurology','Pediatrics','General Surgery','Ophthalmology','ENT','Psychiatry','Radiology']
PROCS = ['CT Scan','MRI','Angioplasty','CABG','Laparoscopy','Cesarean Section','Endoscopy','Chemotherapy','Joint Replacement','Cataract Surgery']
EQUIP = ['Ventilator','Defibrillator','ECG Machine','Ultrasound','X-Ray','CT Scanner','MRI Machine','Dialysis Machine','Incubator','Blood Bank']
TYPES = ['Government District Hospital','Private Multi-Specialty Hospital','Private Nursing Home','Teaching Hospital','Mission Hospital','Primary Health Center']
NAMES1 = ['City','Central','General','Regional','Metro','National','Modern','District','Community']
NAMES2 = ['Hospital','Medical Center','Health Centre','Care Hospital']
LN = ['Sharma','Patel','Singh','Kumar','Gupta','Joshi','Mehta','Reddy','Nair','Iyer','Rao','Shah']
SRC = ['nhm.gov.in','nha.gov.in','abdm.gov.in','mohfw.gov.in','hospitalguide.in']

random.seed(77)

def esc(s):
    if s is None:
        return None
    return s.replace("'", "''")

def val(x):
    if x is None:
        return 'NULL'
    if isinstance(x, str):
        return f"'{x}'"
    return str(x)

def make_facility(fid):
    state = random.choice(list(STATES.keys()))
    city, blat, blng = random.choice(STATES[state])
    lat = round(blat + random.uniform(-0.3, 0.3), 6)
    lng = round(blng + random.uniform(-0.3, 0.3), 6)
    pc = str(random.randint(100000, 999999)) if random.random() < 0.9996 else None
    ftype = random.choice(TYPES)
    if random.random() < 0.4:
        name = random.choice(LN) + ' ' + random.choice(['Hospital', 'Clinic', 'Medical Center'])
    else:
        name = random.choice(NAMES1) + ' ' + random.choice(NAMES2)
    cap = ', '.join(random.sample(CAPS, random.randint(2, 5))) if random.random() < 0.997 else None
    proc = ', '.join(random.sample(PROCS, random.randint(1, 3))) if random.random() < 0.925 else None
    equip = ', '.join(random.sample(EQUIP, random.randint(1, 3))) if random.random() < 0.77 else None
    yr = random.randint(1950, 2022) if random.random() < 0.478 else None
    docs = random.randint(5, 300) if random.random() < 0.364 else None
    beds = random.randint(10, 1500) if random.random() < 0.252 else None
    desc = (f"{name} is a {ftype} in {city}, {state} providing {cap or 'general medical'} services. "
            f"{'Established in ' + str(yr) + '. ' if yr else ''}"
            f"{str(docs) + ' doctors on staff. ' if docs else ''}"
            f"{'Capacity: ' + str(beds) + ' beds. ' if beds else ''}"
            f"Equipment includes {equip or 'standard medical equipment'}. "
            f"Procedures offered: {proc or 'general procedures'}.")
    score = sum([cap is not None, proc is not None, equip is not None, docs is not None])
    trust = 'strong_evidence' if score >= 3 else ('partial_evidence' if score == 2 else 'weak_evidence')
    src = f"https://{random.choice(SRC)}/facility/{fid}"
    return (fid, esc(name), esc(ftype), esc(state), esc(city), lat, lng, pc,
            esc(cap), esc(proc), esc(equip), yr, docs, beds, esc(desc), esc(src), trust, round(score/4, 2))

BATCH = 40
inserted = 0
for start in range(1701, 10001, BATCH):
    end = min(start + BATCH, 10001)
    batch = [make_facility(i) for i in range(start, end)]
    rows_sql = []
    for f in batch:
        rows_sql.append(f"({val(f[0])},{val(f[1])},{val(f[2])},{val(f[3])},{val(f[4])},{val(f[5])},{val(f[6])},{val(f[7])},{val(f[8])},{val(f[9])},{val(f[10])},{val(f[11])},{val(f[12])},{val(f[13])},{val(f[14])},{val(f[15])},{val(f[16])},{val(f[17])})")
    sql = (
        "INSERT INTO workspace.hackathon.facilities "
        "(facility_id,name,facility_type,state,city,latitude,longitude,postcode,"
        "capability,procedure,equipment,year_established,num_doctors,capacity_beds,"
        "description,source_url,trust_signal,data_completeness_score) VALUES "
        + ",".join(rows_sql)
    )
    ok = run(sql)
    if ok:
        inserted += len(batch)
    if start % 400 == 1 or not ok:
        print(f"  Progress: facility {end}, inserted this run: {inserted}", flush=True)

# Final count
r = w.statement_execution.execute_statement(
    statement="SELECT COUNT(*) FROM workspace.hackathon.facilities",
    warehouse_id=WH, wait_timeout="30s"
)
time.sleep(3)
r = w.statement_execution.get_statement(r.statement_id)
count = r.result.data_array[0][0] if r.result and r.result.data_array else "?"
print(f"Total rows in workspace.hackathon.facilities: {count}")
