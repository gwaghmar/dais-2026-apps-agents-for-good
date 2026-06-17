import { useState, useEffect } from 'react';
import { Building2, MapPin, ShieldCheck, TrendingUp, Database, Loader2 } from 'lucide-react';

interface Stats {
  total_facilities: string;
  states_covered: string;
  cities_covered: string;
  high_trust: string;
  medium_trust: string;
  low_trust: string;
}

interface StateRow {
  state: string;
  facility_count: string;
  high_trust_count: string;
}

export function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [states, setStates] = useState<StateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/facilities/stats').then((r) => r.json() as Promise<Stats>),
      fetch('/api/facilities/by-state').then((r) => r.json() as Promise<{ states: StateRow[] }>),
    ]).then(([s, byState]) => {
      setStats(s);
      setStates(byState.states ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading dataset summary from Unity Catalog…
      </div>
    );
  }

  const total = Number(stats?.total_facilities ?? 0);
  const highTrust = Number(stats?.high_trust ?? 0);
  const pctHigh = total ? Math.round((highTrust / total) * 100) : 0;

  const kpis = [
    { label: 'Total Facilities', value: total.toLocaleString(), icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'States Covered', value: stats?.states_covered ?? '—', icon: MapPin, color: 'text-purple-600 bg-purple-50' },
    { label: 'Verified (High Trust)', value: `${highTrust.toLocaleString()} (${pctHigh}%)`, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Cities Covered', value: stats?.cities_covered ?? '—', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ];

  const maxCount = Math.max(...states.map((s) => Number(s.facility_count)));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dataset Overview</h1>
        <p className="text-gray-500 mt-1 text-sm flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          databricks_virtue_foundation_dataset_dais_2026.virtue_foundation_dataset.facilities
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Trust distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Trust Signal Distribution</h2>
        <div className="space-y-3">
          {[
            { label: 'High Trust (≥4 web sources)', count: Number(stats?.high_trust ?? 0), cls: 'bg-emerald-500' },
            { label: 'Medium Trust (2–3 sources)', count: Number(stats?.medium_trust ?? 0), cls: 'bg-amber-400' },
            { label: 'Low Trust (<2 sources)', count: Number(stats?.low_trust ?? 0), cls: 'bg-gray-300' },
          ].map(({ label, count, cls }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-medium text-gray-900">{count.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cls} transition-all`}
                  style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Trust derived from: distinct_social_media_presence_count, number_of_facts_about_the_organization,
          affiliated_staff_presence, custom_logo_presence
        </p>
      </div>

      {/* State coverage table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">Coverage by State (Top 20)</h2>
        <div className="space-y-2">
          {states.map((row) => {
            const count = Number(row.facility_count);
            const pct = maxCount ? (count / maxCount) * 100 : 0;
            const highCount = Number(row.high_trust_count);
            return (
              <div key={row.state}>
                <div className="flex items-center justify-between text-sm mb-0.5">
                  <span className="text-gray-700 font-medium w-40 truncate">{row.state}</span>
                  <div className="flex-1 mx-3">
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-gray-900 font-medium w-12 text-right">{count.toLocaleString()}</span>
                  <span className="text-emerald-600 text-xs w-20 text-right">
                    {highCount > 0 ? `${highCount} verified` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
