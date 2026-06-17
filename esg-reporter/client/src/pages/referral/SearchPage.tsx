import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Search, MapPin, Shield, ShieldCheck, ShieldAlert, ShieldOff,
  Bookmark, BookmarkCheck, Globe, ChevronDown, ChevronUp,
  Loader2, Users, Bed, Calendar, Sparkles, CheckCircle2, ArrowRight,
} from 'lucide-react';

interface Facility {
  unique_id: string;
  name: string;
  organization_type: string;
  address_city: string;
  address_stateOrRegion: string;
  address_zipOrPostcode: string;
  capability: string;
  specialties: string;
  description: string;
  source_urls: string;
  numberDoctors: string;
  capacity: string;
  yearEstablished: string;
  distinct_social_media_presence_count: string;
  number_of_facts_about_the_organization: string;
  affiliated_staff_presence: string;
  custom_logo_presence: string;
  trust_signal: string;
}

const SESSION_ID = (() => {
  if (typeof window === 'undefined') return 'default';
  let s = sessionStorage.getItem('rc-session');
  if (!s) { s = String(Date.now()); sessionStorage.setItem('rc-session', s); }
  return s;
})();

const CARE_OPTS = [
  'Dialysis', 'Oncology', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Maternity', 'Eye care', 'Psychiatry', 'ICU',
  'Trauma', 'Radiology', 'Physiotherapy', 'Dermatology', 'ENT',
];

const LOCATION_OPTS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Jaipur', 'Ahmedabad', 'Lucknow',
  'Surat', 'Kochi', 'Bhopal', 'Nagpur', 'Indore',
];

const FACILITY_TYPE_Q = {
  question: 'What type of facility?',
  options: [
    { label: 'Any', value: '' },
    { label: 'Government', value: 'government' },
    { label: 'Private', value: 'private' },
    { label: 'Teaching Hospital', value: 'teaching' },
  ],
};

const TRUST_Q = {
  question: 'Data quality preference?',
  options: [
    { label: 'Any facility', value: 'any' },
    { label: 'Verified only', value: 'verified' },
    { label: 'High + Partial', value: 'partial' },
  ],
};

const STEPS = [
  { n: 1, label: 'What care do you need?' },
  { n: 2, label: 'Where in India?' },
  { n: 3, label: 'Your preferences' },
];

function parseCaps(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.slice(0, 4).map(String);
  } catch { /* */ }
  return raw.split(',').slice(0, 4).map((s) => s.trim()).filter(Boolean);
}

function TrustBadge({ signal }: { signal: string }) {
  const map: Record<string, { icon: typeof ShieldCheck; label: string; cls: string }> = {
    strong_evidence: { icon: ShieldCheck, label: 'Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partial_evidence: { icon: Shield, label: 'Partial Info', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    weak_evidence: { icon: ShieldAlert, label: 'Limited', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    no_claim: { icon: ShieldOff, label: 'Unverified', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  };
  const { icon: Icon, label, cls } = map[signal] ?? map.no_claim;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      <Icon className="w-3 h-3" />{label}
    </span>
  );
}

function AutoSuggest({
  value, onChange, suggestions, placeholder, icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder: string;
  icon: typeof Search;
}) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 text-sm focus:outline-none bg-white transition-colors"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.slice(0, 8).map((s) => (
            <button
              key={s}
              className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onMouseDown={() => { onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChoiceQuestion({
  question, options, value, onChange,
}: {
  question: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              value === o.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {value === o.value && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AITriagePanel({ facilities, careNeed, location }: { facilities: Facility[]; careNeed: string; location: string }) {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const runTriage = async () => {
    setLoading(true);
    setResult('');
    const top = facilities.slice(0, 5).map((f, i) =>
      `${i + 1}. ${f.name} (${[f.address_city, f.address_stateOrRegion].filter(Boolean).join(', ')}) — trust: ${f.trust_signal}, doctors: ${f.numberDoctors || 'unknown'}, beds: ${f.capacity || 'unknown'}, established: ${f.yearEstablished || 'unknown'}`
    ).join('\n');

    const prompt = `You are a healthcare referral expert. A patient needs "${careNeed || 'general care'}" in "${location || 'India'}".
Here are the top ${Math.min(5, facilities.length)} matching facilities from the Virtue Foundation dataset:

${top}

Give a concise 3-4 sentence recommendation: which facility to refer first and why, any caveats about data quality, and what to verify before making the referral. Be specific and practical.`;

    try {
      const resp = await fetch('/api/serving/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!resp.ok) {
        const err = await resp.json() as { error?: string };
        setResult(`Could not generate recommendation: ${err.error ?? resp.statusText}`);
        return;
      }
      const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
      setResult(data.choices?.[0]?.message?.content ?? 'No response from AI.');
      setDone(true);
    } catch (err) {
      setResult(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Triage Recommendation
          </h3>
          <p className="text-xs text-blue-700 mt-0.5">
            Let AI analyze these {facilities.length} results and recommend the best referral
          </p>
        </div>
        {!done && (
          <button
            onClick={() => void runTriage()}
            disabled={loading}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Analysing…' : 'Get Recommendation'}
          </button>
        )}
      </div>
      {result && (
        <div className="mt-4 bg-white rounded-xl p-4 border border-blue-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}

function FacilityCard({ f, onShortlist, shortlisted }: { f: Facility; onShortlist: (f: Facility) => void; shortlisted: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const caps = parseCaps(f.capability);
  const social = Number(f.distinct_social_media_presence_count ?? 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base">{f.name}</h3>
            <TrustBadge signal={f.trust_signal} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {f.organization_type && <span className="mr-1">{f.organization_type} ·</span>}
            <MapPin className="inline w-3 h-3 mr-0.5" />
            {[f.address_city, f.address_stateOrRegion].filter(Boolean).join(', ')}
          </p>
        </div>
        <button
          onClick={() => onShortlist(f)}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            shortlisted ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          {shortlisted ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      {caps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {caps.map((c) => (
            <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">{c}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        {f.numberDoctors && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{f.numberDoctors} doctors</span>}
        {f.capacity && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{f.capacity} beds</span>}
        {f.yearEstablished && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Est. {f.yearEstablished}</span>}
        {social > 0 && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{social} sources</span>}
      </div>

      {expanded && f.description && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
          {f.source_urls && (
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
              <Globe className="w-3 h-3" />
              <span className="truncate">{f.source_urls.split(',')[0]}</span>
            </div>
          )}
        </div>
      )}

      {(f.description || f.source_urls) && (
        <button onClick={() => setExpanded((e) => !e)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />Evidence & details</>}
        </button>
      )}
    </div>
  );
}

export function SearchPage() {
  const [capability, setCapability] = useState('');
  const [location, setLocation] = useState('');
  const [facilityType, setFacilityType] = useState('');
  const [trustPref, setTrustPref] = useState('any');
  const [results, setResults] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (cap?: string, loc?: string) => {
    const c = cap ?? capability;
    const l = loc ?? location;
    if (!c && !l) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(''); setSearched(true);

    try {
      const params = new URLSearchParams();
      if (c) params.set('capability', c);
      if (l) params.set('location', l);
      if (facilityType) params.set('facility_type', facilityType);
      params.set('limit', '24');

      const resp = await fetch(`/api/facilities/search?${params}`, { signal: abortRef.current.signal });
      const data = await resp.json() as { facilities?: Facility[]; error?: string };
      if (data.error) { setError(data.error); return; }

      let facs = data.facilities ?? [];
      if (trustPref === 'verified') facs = facs.filter((f) => f.trust_signal === 'strong_evidence');
      if (trustPref === 'partial') facs = facs.filter((f) => ['strong_evidence', 'partial_evidence'].includes(f.trust_signal));
      setResults(facs);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [capability, location, facilityType, trustPref]);

  const handleShortlist = useCallback(async (f: Facility) => {
    const isIn = shortlisted.has(f.unique_id);
    if (isIn) { setShortlisted((prev) => { const s = new Set(prev); s.delete(f.unique_id); return s; }); return; }
    setShortlisted((prev) => new Set(prev).add(f.unique_id));
    try {
      await fetch('/api/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: SESSION_ID, facility_id: f.unique_id, facility_name: f.name, city: f.address_city, state: f.address_stateOrRegion, capability_match: capability, trust_signal: f.trust_signal }),
      });
    } catch { /* non-critical */ }
  }, [shortlisted, capability]);

  const activeStep = !capability && !location ? 1 : !location && capability ? 2 : 3;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Find the Right Facility</h1>
        <p className="text-gray-500 mt-2 text-sm">10,088 verified Indian healthcare facilities · Trust-ranked · Backed by Virtue Foundation data</p>
      </div>

      {/* Step tracker */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((step, i) => (
          <div key={step.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
              activeStep === step.n
                ? 'bg-blue-600 text-white shadow-sm'
                : activeStep > step.n
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {activeStep > step.n
                ? <CheckCircle2 className="w-3 h-3" />
                : <span className="w-3 h-3 rounded-full border-2 flex-shrink-0 inline-block border-current" />
              }
              {step.label}
            </div>
            {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Search card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 mb-6">

        {/* Step 1 & 2: Prompt inputs */}
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Step 1 — Care need
            </label>
            <AutoSuggest
              value={capability}
              onChange={setCapability}
              suggestions={CARE_OPTS}
              placeholder="e.g. Dialysis, Oncology, Maternity, ICU…"
              icon={Search}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {CARE_OPTS.slice(0, 7).map((s) => (
                <button key={s} onClick={() => setCapability(s)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${capability === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Step 2 — Location
            </label>
            <AutoSuggest
              value={location}
              onChange={setLocation}
              suggestions={LOCATION_OPTS}
              placeholder="City or state (e.g. Jaipur, Maharashtra)"
              icon={MapPin}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {LOCATION_OPTS.slice(0, 7).map((s) => (
                <button key={s} onClick={() => setLocation(s)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${location === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: 2 choice questions */}
        <div className="border-t border-gray-100 pt-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Step 3 — Preferences</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChoiceQuestion
              question={FACILITY_TYPE_Q.question}
              options={FACILITY_TYPE_Q.options}
              value={facilityType}
              onChange={setFacilityType}
            />
            <ChoiceQuestion
              question={TRUST_Q.question}
              options={TRUST_Q.options}
              value={trustPref}
              onChange={setTrustPref}
            />
          </div>
        </div>

        <button
          onClick={() => void search()}
          disabled={loading || (!capability && !location)}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Searching Unity Catalog…' : 'Find Facilities'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm mb-4 border border-red-200">{error}</div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>No facilities matched. Try broader terms or remove the trust filter.</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{results.length} facilities found · sorted by trust</p>
          </div>

          {/* AI Triage */}
          <AITriagePanel facilities={results} careNeed={capability} location={location} />

          {/* Cards */}
          <div className="grid gap-4">
            {results.map((f) => (
              <FacilityCard key={f.unique_id} f={f} onShortlist={handleShortlist} shortlisted={shortlisted.has(f.unique_id)} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center">
            Source: databricks_virtue_foundation_dataset_dais_2026.virtue_foundation_dataset.facilities
          </p>
        </>
      )}
    </div>
  );
}
