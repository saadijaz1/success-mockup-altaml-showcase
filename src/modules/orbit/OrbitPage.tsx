import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { CURRENT_USER_ID, users } from '../../data/mock';
import { Card } from '../onboarding/ui';
import { BAND_META, MODEL, accounts, featureLabels, money, type Scored } from './score';

const inp = 'rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500';
const isRisk = (a: Scored) => a.band === 'at_risk' || a.band === 'critical'; // 'no_data' is never a risk flag
const shown = accounts.filter((a) => a.kind !== 'CHURNED');
const churned = accounts.filter((a) => a.kind === 'CHURNED');
const sum = (xs: Scored[]) => xs.reduce((s, a) => s + (a.arr ?? 0), 0);
const ownerName = (id: string | null) => users.find((u) => u.id === id)?.name ?? 'Unassigned';

const VIEWS: Record<string, [string, (a: Scored) => boolean]> = {
  attention: ['Needs attention', (a) => isRisk(a) || a.flags.some((f) => f === 'HIGH' || f === 'CRITICAL') || a.overdueDays > 30],
  renewing: ['Renewing 90 d', (a) => a.renewalIn !== null && a.renewalIn <= 90],
  silent: ['Silent 60 d+', (a) => a.lastTouchDays > 60],
  movers: ['Movers ↓', (a) => a.usageYoY !== null && a.usageYoY < -0.3],
  outstanding: ['Outstanding', (a) => a.owing > 0],
  mine: ['Mine', (a) => a.ownerId === CURRENT_USER_ID],
  churned: ['Churned', () => true],
};
const SORTS: Record<string, [string, (a: Scored, b: Scored) => number]> = {
  risk: ['Highest risk', (a, b) => b.p - a.p], name: ['Name', (a, b) => a.name.localeCompare(b.name)],
  arr: ['ARR', (a, b) => (b.arr ?? 0) - (a.arr ?? 0)], renewal: ['Renewal date', (a, b) => (a.renewalIn ?? 9999) - (b.renewalIn ?? 9999)],
};

export default function OrbitPage() {
  const [view, setView] = useState('');
  const [mode, setMode] = useState<'feed' | 'table'>('feed');
  const [q, setQ] = useState('');
  const [owner, setOwner] = useState('');
  const [sort, setSort] = useState('risk');
  const [more, setMore] = useState(false);
  const [how, setHow] = useState(false);

  const risk = shown.filter(isRisk);
  const renewing = shown.filter(VIEWS.renewing[1]);
  const total = sum(shown);
  const rows = useMemo(() => {
    const pool = view === 'churned' ? churned : shown.filter(view ? VIEWS[view][1] : () => true);
    return pool
      .filter((a) => (!q || a.name.toLowerCase().includes(q.toLowerCase())) && (!owner || (owner === 'none' ? !a.ownerId : a.ownerId === owner)))
      .sort(SORTS[sort][1]);
  }, [view, q, owner, sort]);
  const count = (k: string) => (k === 'churned' ? churned.length : shown.filter(VIEWS[k][1]).length);
  const dist = (['healthy', 'watch', 'at_risk', 'critical', 'no_data'] as const).map((b) => [b, shown.filter((a) => a.band === b).length] as const);
  const live = shown.filter((a) => a.kind === 'LIVE').length;
  const owing = shown.filter((a) => a.owing > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Orbit</h1>
          <p className="text-sm text-slate-500">Every customer account, scored for churn risk.</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><RefreshCw size={12} /> Synced from HubSpot (simulated) · today 06:00</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Accounts" value={String(shown.length)} sub={`${live} live · ${shown.length - live} onboarding · ${churned.length} churned, not shown`} onClick={() => setView('')} />
        <Tile label="At risk" value={String(risk.length)} sub={`${risk.filter((a) => !a.ownerId).length} of them unassigned`} onClick={() => { setView(''); setSort('risk'); setOwner(''); }} tone="text-orange-700" />
        <Tile label="Renewing in 90 days" value={String(renewing.length)} sub={`${renewing.filter((a) => a.lastTouchDays > 60).length} not spoken to in 60 d`} onClick={() => setView('renewing')} />
        <Tile label="ARR at risk" value={money(sum(risk))} sub={`of ${money(total)} CAD · ${risk.length} at-risk accounts · ${risk.filter((a) => a.arr === null).length} not valued`} onClick={() => { setView(''); setSort('arr'); }} tone="text-red-700" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => setView('')} className={chip(view === '')}>All <b>{shown.length}</b></button>
        {Object.entries(VIEWS).map(([k, [label]]) => (
          <button key={k} onClick={() => setView(view === k ? '' : k)} className={chip(view === k)}>{label} <b>{count(k)}</b></button>
        ))}
      </div>

      <div>
        <button onClick={() => setMore(!more)} className="flex items-center gap-1 text-sm font-medium text-slate-600">{more ? <ChevronDown size={14} /> : <ChevronRight size={14} />} More numbers</button>
        {more && (
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Mini label="Live customers" value={String(live)} />
            <Mini label="In onboarding" value={String(shown.length - live)} />
            <Mini label="Open risk flags" value={String(shown.reduce((s, a) => s + a.flags.length, 0))} sub={`${shown.filter((a) => a.flags.length).length} accounts flagged`} />
            <Mini label="Silent > 60 d" value={String(count('silent'))} sub="no contact we can see" />
            <Mini label="Open work items" value={String(shown.reduce((s, a) => s + a.workItems, 0))} />
            <Mini label="Unlinked" value={String(shown.filter((a) => !a.hubspotId || !a.chargebeeId).length)} sub="no HubSpot or billing id" />
            <Mini label="ARR" value={money(total)} sub={`CAD · ${shown.filter((a) => a.arr === null).length} not valued`} />
            <Mini label="Outstanding" value={money(owing.reduce((s, a) => s + a.owing, 0))} sub={`${owing.length} accounts owing · ${owing.filter((a) => a.overdueDays > 30).length} overdue > 30 d`} />
            <Mini label="Renewals · 90 d" value={money(sum(renewing))} sub={`${renewing.length} accounts`} />
            <Mini label="Usage dropped" value={String(count('movers'))} sub=">30% fewer sign-ins" />
            <Mini label="Logos at risk" value={`${Math.round((risk.length / shown.length) * 100)}%`} sub={`${risk.length} of ${shown.length} scored`} />
            <Mini label="Not enough data" value={String(shown.filter((a) => a.thin).length)} sub="held mid-scale, not flagged" />
          </div>
        )}
      </div>

      <Card title={`Health distribution · ${shown.length} scored`}>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
          {dist.map(([b, n]) => <div key={b} style={{ width: `${(n / shown.length) * 100}%` }} className={BAR[b]} title={`${BAND_META[b][0]} ${n}`} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {dist.map(([b, n]) => <span key={b} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${BAR[b]}`} />{BAND_META[b][0]} <b>{n}</b></span>)}
        </div>
        <button onClick={() => setHow(!how)} className="mt-3 flex items-center gap-1 text-sm font-medium text-brand-600">{how ? <ChevronDown size={14} /> : <ChevronRight size={14} />} How risk is scored</button>
        {how && <ModelInfo />}
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts…" aria-label="Search accounts" className={`${inp} w-52`} />
        <select value={owner} onChange={(e) => setOwner(e.target.value)} aria-label="Owner" className={inp}>
          <option value="">All owners</option><option value="none">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" className={inp}>
          {Object.entries(SORTS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <span className="ml-auto text-sm text-slate-500">{rows.length} of {accounts.length} accounts</span>
        <div className="flex overflow-hidden rounded-md border border-slate-300 text-sm">
          {(['feed', 'table'] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 capitalize ${mode === m ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-50'}`}>{m}</button>)}
        </div>
      </div>

      {mode === 'feed' ? <Feed rows={rows} /> : <Table rows={rows} />}
    </div>
  );
}

const BAR = { healthy: 'bg-emerald-500', watch: 'bg-amber-400', at_risk: 'bg-orange-500', critical: 'bg-red-600', no_data: 'bg-slate-300' };
const chip = (on: boolean) => `rounded-full border px-3 py-1 text-sm ${on ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`;

function Tile({ label, value, sub, onClick, tone = '' }: { label: string; value: string; sub: string; onClick: () => void; tone?: string }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-400">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </button>
  );
}
const Mini = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className="text-xl font-semibold">{value}</div>{sub && <div className="text-xs text-slate-400">{sub}</div>}</div>
);
export const BandChip = ({ a }: { a: Scored }) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BAND_META[a.band][1]}`}>{BAND_META[a.band][0]}</span>;

function Feed({ rows }: { rows: Scored[] }) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-slate-500">No accounts match.</p>;
  return (
    <ul className="space-y-2">
      {rows.slice(0, 40).map((a) => (
        <li key={a.id}>
          <Link to={`/orbit/${a.id}`} className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{a.name}</span>
              {a.kind !== 'CHURNED' && <BandChip a={a} />}
              {a.kind === 'ONBOARDING' && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Onboarding</span>}
              {a.kind === 'CHURNED' && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Churned</span>}
                            <span className="ml-auto text-sm text-slate-500">{a.arr ? `${money(a.arr)} ARR` : 'Not valued'} · {ownerName(a.ownerId)}</span>
            </div>
            {a.kind !== 'CHURNED' && <p className="mt-1 text-sm text-slate-600">{a.thin ? `Not scored: ${a.gaps.join(' · ').toLowerCase()}` : a.drivers.length ? a.drivers.slice(0, 3).map((d) => d.label).join(' · ') : 'No risk signals'}</p>}
          </Link>
        </li>
      ))}
      {rows.length > 40 && <li className="text-center text-sm text-slate-500">Showing 40 of {rows.length}. Use search or the table view to see more.</li>}
    </ul>
  );
}

function Table({ rows }: { rows: Scored[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[48rem] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="p-2.5">Account</th><th>Status</th><th>Health</th><th>Churn risk</th><th>ARR</th><th>Renews</th><th>Last contact</th><th>Owner</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((a) => (
            <tr key={a.id}>
              <td className="p-2.5"><Link to={`/orbit/${a.id}`} className="font-medium hover:text-brand-600">{a.name}</Link></td>
              <td>{a.kind === 'CHURNED' ? 'Churned' : <BandChip a={a} />}</td>
              <td>{a.kind === 'CHURNED' ? '–' : a.health}</td>
              <td>{a.kind === 'CHURNED' || a.thin ? '–' : `${Math.round(a.p * 100)}%`}</td>
              <td>{a.arr ? money(a.arr) : '–'}</td>
              <td>{a.renewalIn === null ? '–' : `${a.renewalIn} d`}</td>
              <td className={a.lastTouchDays > 60 ? 'text-red-600' : ''}>{a.lastTouchDays} d ago</td>
              <td>{ownerName(a.ownerId)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ModelInfo() {
  const m = MODEL.metrics;
  const max = Math.max(...MODEL.coef.map(Math.abs));
  return (
    <div className="mt-3 space-y-3 text-sm text-slate-600">
      <p>
        Each account gets a 12-month churn probability from a logistic-regression model on ten signals from HubSpot and billing.
        Health = 100 × (1 − probability). Accounts without enough HubSpot data (not linked, no usage history, or under 3 months old) are not scored: they sit at health 50 as \u201cNot enough data\u201d and are never flagged as at risk. Bands: Watch ≥ {MODEL.bands.watch * 100}%, At risk ≥ {MODEL.bands.atRisk * 100}%, Critical ≥ {MODEL.bands.critical * 100}%.
      </p>
      <div className="space-y-1">
        {MODEL.coef.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-48 shrink-0 text-xs">{featureLabels[i]}</span>
            <div className="flex h-2 flex-1 items-center">
              <div className="flex h-full w-1/2 justify-end"><div className="h-full rounded-l bg-emerald-500" style={{ width: `${c < 0 ? (-c / max) * 100 : 0}%` }} /></div>
              <div className="h-full w-1/2"><div className="h-full rounded-r bg-red-500" style={{ width: `${c > 0 ? (c / max) * 100 : 0}%` }} /></div>
            </div>
          </div>
        ))}
        <div className="text-xs text-slate-400">Left (green) lowers risk, right (red) raises it.</div>
      </div>
      <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
        Demo model: trained on {m.trainRows.toLocaleString()} synthetic accounts, tested on {m.testRows.toLocaleString()} (AUC {m.aucLogistic}; gradient boosting scored {m.aucGradientBoosting}, so the simpler, explainable model was kept).
        Labels are simulated, so these figures show the pipeline works, not real-world accuracy. Code: <code>ml/train_churn_model.py</code>.
      </p>
    </div>
  );
}
