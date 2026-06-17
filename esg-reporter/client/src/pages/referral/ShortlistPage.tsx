import { useState, useEffect } from 'react';
import { Bookmark, Trash2, ShieldCheck, Shield, ShieldAlert, ShieldOff, MapPin, Loader2 } from 'lucide-react';

interface ShortlistItem {
  id: number;
  session_id: string;
  facility_id: string;
  facility_name: string;
  city: string;
  state: string;
  capability_match: string;
  trust_signal: string;
  note: string;
  created_at: string;
}

const SESSION_ID = `session-${
  typeof window !== 'undefined'
    ? (() => {
        let s = sessionStorage.getItem('rc-session');
        if (!s) { s = String(Date.now()); sessionStorage.setItem('rc-session', s); }
        return s;
      })()
    : Date.now()
}`;

function TrustIcon({ signal }: { signal: string }) {
  const map: Record<string, { Icon: typeof ShieldCheck; cls: string }> = {
    strong_evidence: { Icon: ShieldCheck, cls: 'text-emerald-600' },
    partial_evidence: { Icon: Shield, cls: 'text-amber-600' },
    weak_evidence: { Icon: ShieldAlert, cls: 'text-orange-500' },
    no_claim: { Icon: ShieldOff, cls: 'text-gray-400' },
  };
  const { Icon, cls } = map[signal] ?? map.no_claim;
  return <Icon className={`w-4 h-4 ${cls}`} />;
}

export function ShortlistPage() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`/api/shortlist/${SESSION_ID}`);
      const data = await resp.json() as { items?: ShortlistItem[]; error?: string };
      if (data.error) { setError(data.error); return; }
      setItems(data.items ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/shortlist/${id}`, { method: 'DELETE' });
    } catch { /* revert */ await load(); }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-blue-600" />
          Shortlist
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Facilities saved this session — persisted in Lakebase PostgreSQL
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-4 border border-red-200">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <Bookmark className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-gray-400">No facilities shortlisted yet.</p>
          <p className="text-sm mt-1 text-gray-400">Use the search page to find and bookmark facilities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3 min-w-0">
                <TrustIcon signal={item.trust_signal} />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.facility_name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {[item.city, item.state].filter(Boolean).join(', ')}
                  </p>
                  {item.capability_match && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">
                      {item.capability_match}
                    </span>
                  )}
                  {item.note && <p className="text-xs text-gray-400 mt-1 italic">{item.note}</p>}
                </div>
              </div>
              <button
                onClick={() => void remove(item.id)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-4 text-center">
            {items.length} facility{items.length !== 1 ? 'ies' : 'y'} saved · stored in Lakebase referral.shortlist
          </p>
        </div>
      )}
    </div>
  );
}
