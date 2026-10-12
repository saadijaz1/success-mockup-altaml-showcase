import { Link } from 'react-router-dom';
import { users } from '../../data/mock';
import {
  STAGES, addDays, daysBetween, fmt, goesLiveSoon, needsAttention, progress, qaAttention, today,
  type Onboarding,
} from './data';
import { Card, Progress, QAChip, Tabs, healthDot, useTab } from './ui';
import ConfigTasks from './ConfigTasks';
import { useOnboardings } from './store';

const TABS: [string, string][] = [['board', 'Board'], ['gantt', 'Timeline'], ['config', 'Configuration tasks'], ['qa', 'QA']];
const initials = (id: string) => users.find((u) => u.id === id)?.initials ?? '?';

export default function OnboardingPage() {
  const [tab, setTab] = useTab(TABS.map(([k]) => k));
  const { onboardings } = useOnboardings();
  const current = onboardings;
  const tiles: [string, number, string][] = [
    ['Current onboardings', current.length, ''],
    ['Need attention', current.filter(needsAttention).length, 'text-amber-600'],
    ['QA needs attention', current.filter(qaAttention).length, 'text-red-600'],
    ['Goes live (next 30 days)', current.filter(goesLiveSoon).length, 'text-brand-600'],
    ['On hold', current.filter((o) => o.status === 'on_hold').length, 'text-slate-500'],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Onboarding</h1>
        <p className="text-sm text-slate-500">Every customer onboarding in flight, from kickoff to go-live.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map(([label, n, c]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium text-slate-500">{label}</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${c}`}>{n}</div>
          </div>
        ))}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'board' && <Board />}
      {tab === 'gantt' && <Gantt />}
      {tab === 'config' && <Config />}
      {tab === 'qa' && <QA />}
    </div>
  );
}

function Board() {
  const { onboardings } = useOnboardings();
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGES.map((s) => {
        const items = onboardings.filter((o) => o.stage === s);
        return (
          <div key={s} className="w-64 shrink-0 rounded-lg bg-slate-100 p-2">
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s} <span className="rounded-full bg-white px-1.5 py-0.5 text-slate-600">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((o) => <BoardCard key={o.id} o={o} />)}
              {items.length === 0 && <div className="py-4 text-center text-xs text-slate-400">None</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BoardCard({ o }: { o: Onboarding }) {
  const days = daysBetween(today, o.goLive);
  return (
    <Link to={`/onboarding/${o.id}`} className="block rounded-md border border-slate-200 bg-white p-3 shadow-sm hover:border-brand-500">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium">{o.customer}</span>
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${healthDot(o.health)}`} title={o.health} />
      </div>
      <div className="mt-1 text-xs text-slate-500">
        Go-live {fmt(o.goLive)} · {days >= 0 ? `${days}d` : `${-days}d late`}
      </div>
      <div className="mt-2"><Progress pct={progress(o)} /></div>
      <div className="mt-2 flex items-center justify-between">
        {o.status === 'on_hold' ? <span className="text-xs font-medium text-slate-500">On hold</span> : <QAChip q={o.qa} />}
        <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold">{initials(o.ownerId)}</span>
      </div>
    </Link>
  );
}

function Gantt() {
  const { onboardings } = useOnboardings();
  const min = addDays(onboardings.map((o) => o.start).sort()[0], -7);
  const max = addDays(onboardings.map((o) => o.goLive).sort().at(-1)!, 7);
  const total = daysBetween(min, max);
  const pos = (d: string) => (daysBetween(min, d) / total) * 100;
  const months: { label: string; left: number }[] = [];
  for (let i = 0; i <= total; i += 1) {
    const d = addDays(min, i);
    if (d.endsWith('-01') || i === 0) months.push({ label: new Date(d + 'T00:00').toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }), left: (i / total) * 100 });
  }
  const bar: Record<string, string> = { on_track: 'bg-emerald-500', at_risk: 'bg-amber-500', off_track: 'bg-red-500' };

  return (
    <Card className="overflow-x-auto">
      <div className="min-w-[44rem]">
        <div className="relative ml-44 h-6 border-b border-slate-200 text-xs text-slate-500">
          {months.map((m) => <span key={m.label} className="absolute" style={{ left: `${m.left}%` }}>{m.label}</span>)}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-44 right-0">
            <div className="absolute inset-y-0 w-px bg-brand-500" style={{ left: `${pos(today)}%` }} title="Today" />
          </div>
          {onboardings.map((o) => (
            <div key={o.id} className="flex h-10 items-center border-b border-slate-50">
              <Link to={`/onboarding/${o.id}`} className="w-44 shrink-0 truncate pr-3 text-sm hover:text-brand-600">{o.customer}</Link>
              <div className="relative h-5 flex-1">
                <div
                  className={`absolute h-5 rounded bg-slate-200 ${o.status === 'on_hold' ? 'opacity-50' : ''}`}
                  style={{ left: `${pos(o.start)}%`, width: `${pos(o.goLive) - pos(o.start)}%` }}
                  title={`${fmt(o.start)} → ${fmt(o.goLive)}${o.status === 'on_hold' ? ' (on hold)' : ''}`}
                >
                  <div className={`h-full rounded ${bar[o.health]}`} style={{ width: `${progress(o)}%` }} />
                </div>
                <span className="absolute top-0.5 text-[10px] text-slate-500" style={{ left: `calc(${pos(o.goLive)}% + 4px)` }}>{fmt(o.goLive)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Config() {
  const { onboardings } = useOnboardings();
  return (
    <div className="space-y-4">
      {onboardings.map((o) => (
        <Card key={o.id}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <Link to={`/onboarding/${o.id}?tab=setup`} className="font-medium hover:text-brand-600">{o.customer}</Link>
            <div className="w-40"><Progress pct={progress(o)} /></div>
          </div>
          <ConfigTasks o={o} />
        </Card>
      ))}
    </div>
  );
}

function QA() {
  const { onboardings } = useOnboardings();
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="pb-2">Customer</th><th>QA status</th><th>Checks passed</th><th>Go-live</th><th>Open issue</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {onboardings.map((o) => {
            const passed = o.qaChecks.filter((c) => c.status === 'done').length;
            const failed = o.qaChecks.find((c) => c.status === 'failed');
            return (
              <tr key={o.id}>
                <td className="py-2.5"><Link to={`/onboarding/${o.id}?tab=setup`} className="font-medium hover:text-brand-600">{o.customer}</Link></td>
                <td><QAChip q={o.qa} /></td>
                <td className="tabular-nums">{passed} / {o.qaChecks.length}</td>
                <td>{fmt(o.goLive)}</td>
                <td className="text-slate-500">{failed ? failed.title : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
