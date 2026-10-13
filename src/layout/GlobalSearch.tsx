// Header search across onboardings, configuration tasks, prospects and customer accounts.
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useOnboardings } from '../modules/onboarding/store';
import { prospects } from '../modules/sales/data';
import { accounts } from '../modules/orbit/score';

interface Hit { group: string; label: string; sub: string; to: string }
const PER_GROUP = 4;

export default function GlobalSearch() {
  const { onboardings } = useOnboardings();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...xs: string[]) => xs.some((x) => x.toLowerCase().includes(term));
    const take = (xs: Hit[]) => xs.slice(0, PER_GROUP);
    return [
      ...take(onboardings.filter((o) => has(o.customer)).map((o) => ({ group: 'Onboarding', label: o.customer, sub: o.stage, to: `/onboarding/${o.id}` }))),
      ...take(onboardings.flatMap((o) => o.configTasks.filter((t) => t.title && has(t.title, t.key))
        .map((t) => ({ group: 'Tasks', label: `${t.key} ${t.title}`, sub: o.customer, to: `/onboarding/${o.id}/tasks/${t.id}` })))),
      ...take(prospects.filter((p) => has(p.name)).map((p) => ({ group: 'Sales', label: p.name, sub: p.lost ? 'Lost' : p.phase, to: `/sales/${p.id}` }))),
      ...take(accounts.filter((a) => has(a.name)).map((a) => ({ group: 'Accounts', label: a.name, sub: a.kind === 'CHURNED' ? 'Churned' : a.industry, to: `/orbit/${a.id}` }))),
    ];
  }, [q, onboardings]);

  const go = (h: Hit) => { nav(h.to); setQ(''); setOpen(false); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && hits[active]) go(hits[active]);
    else if (e.key === 'Escape') { setQ(''); setOpen(false); }
  };

  return (
    <div className="relative w-full max-w-80">
      <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
      <input
        value={q} placeholder="Search customers, tasks…" aria-label="Search customers and tasks"
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKey}
        className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white"
      />
      {open && q.trim().length >= 2 && (
        <ul role="listbox" className="absolute z-40 mt-1 max-h-96 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg sm:w-96">
          {hits.length === 0 && <li className="px-3 py-2 text-slate-500">No matches.</li>}
          {hits.map((h, i) => (
            <li key={h.to} role="option" aria-selected={i === active}>
              {(i === 0 || hits[i - 1].group !== h.group) && <div className="px-3 pb-0.5 pt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">{h.group}</div>}
              {/* onMouseDown so the click lands before the input's blur closes the list */}
              <button
                onMouseDown={(e) => { e.preventDefault(); go(h); }} onMouseEnter={() => setActive(i)}
                className={`flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left ${i === active ? 'bg-brand-50' : ''}`}
              >
                <span className="truncate">{h.label}</span><span className="shrink-0 text-xs text-slate-400">{h.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
