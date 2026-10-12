import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, LayoutGrid, MessageSquare, Search, Table2 } from 'lucide-react';
import { ME, OWNERS, PHASES, QUOTE_STAGES, TIERS, prospects, type Prospect } from './data';

const sel = 'rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500';
const QUOTE_STYLE: Record<string, string> = {
  'Not started': 'bg-slate-100 text-slate-600', Draft: 'bg-blue-50 text-blue-700',
  Published: 'bg-violet-50 text-violet-700', Accepted: 'bg-emerald-50 text-emerald-700',
};
export const QuoteChip = ({ q }: { q: string }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${QUOTE_STYLE[q]}`}>{q === 'Not started' ? 'No quote' : `Quote: ${q}`}</span>
);

export default function SalesPage() {
  const [q, setQ] = useState('');
  const [owner, setOwner] = useState('');
  const [tier, setTier] = useState('');
  const [phase, setPhase] = useState('');
  const [quote, setQuote] = useState('');
  const [sort, setSort] = useState('new');
  const [scope, setScope] = useState<'all' | 'mine' | 'lost'>('all');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const lostCount = prospects.filter((p) => p.lost).length;
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = prospects.filter((p) =>
      (scope === 'lost' ? p.lost : !p.lost) && (scope !== 'mine' || p.owner === ME) &&
      (!term || p.name.toLowerCase().includes(term) || p.owner.toLowerCase().includes(term)) &&
      (!owner || p.owner === owner) && (!tier || p.tier === tier) && (!phase || p.phase === phase) && (!quote || p.quote === quote));
    return out.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'old' ? b.days - a.days : a.days - b.days));
  }, [q, owner, tier, phase, quote, sort, scope]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sales</h1>
        <p className="text-sm text-slate-500">Prospects from first call to handoff.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search prospects by name or owner…" className={`${sel} w-full pl-8`} />
        </div>
        <select aria-label="Owner" className={sel} value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">All owners</option>{OWNERS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Tier" className={sel} value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">All tiers</option>{TIERS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Stage" className={sel} value={phase} onChange={(e) => setPhase(e.target.value)}>
          <option value="">All stages</option>{PHASES.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Quote" className={sel} value={quote} onChange={(e) => setQuote(e.target.value)}>
          <option value="">Any quote</option>{QUOTE_STAGES.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Sort" className={sel} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Newest first</option><option value="old">Oldest first</option><option value="name">Name A–Z</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-slate-200/70 p-0.5 text-sm font-medium">
            {([['all', 'All'], ['mine', 'Owned by me'], ['lost', `Lost (${lostCount})`]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setScope(k)} className={`rounded-md px-3 py-1.5 ${scope === k ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{label}</button>
            ))}
          </div>
          <span className="text-sm text-slate-500">{rows.length} {scope === 'lost' ? 'lost' : 'active'} prospects</span>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-white">
          {([['cards', LayoutGrid], ['table', Table2]] as const).map(([k, Icon]) => (
            <button key={k} onClick={() => setView(k)} aria-label={`${k} view`} className={`p-2 ${view === k ? 'bg-brand-50 text-brand-700' : 'text-slate-500'}`}><Icon size={16} /></button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500">No prospects match these filters.</div>
      ) : view === 'cards' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((p) => <ProspectCard key={p.id} p={p} />)}</div>
      ) : (
        <ProspectTable rows={rows} />
      )}
    </div>
  );
}

function ProspectCard({ p }: { p: Prospect }) {
  return (
    <Link to={`/sales/${p.id}`} className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-500">
      <div className="font-medium">{p.name}</div>
      <div className="mt-1 flex gap-1.5 text-xs">
        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">{p.tier}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{p.phase}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">Owner: {p.owner} · {p.days}d in pipeline</div>
      <div className="mt-3 flex items-center justify-between">
        <QuoteChip q={p.quote} />
        <span className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><FileText size={13} />{p.docs}</span>
          <span className="flex items-center gap-1"><MessageSquare size={13} />{p.notes}</span>
        </span>
      </div>
    </Link>
  );
}

function ProspectTable({ rows }: { rows: Prospect[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[44rem] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-2">Prospect</th><th>Tier</th><th>Stage</th><th>Quote</th><th>Docs</th><th>Notes</th><th>Days</th><th>Owner</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5"><Link to={`/sales/${p.id}`} className="font-medium hover:text-brand-600">{p.name}</Link></td>
              <td>{p.tier}</td><td>{p.phase}</td><td><QuoteChip q={p.quote} /></td>
              <td className="tabular-nums">{p.docs}</td><td className="tabular-nums">{p.notes}</td><td className="tabular-nums">{p.days}d</td><td>{p.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
