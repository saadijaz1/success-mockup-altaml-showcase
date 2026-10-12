import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { users } from '../../data/mock';
import { useTime } from '../time/context';
import { formatHours } from '../time/duration';
import { STAGES, addDays, daysBetween, fmt, progress, today, type Onboarding } from './data';
import ConfigTasks from './ConfigTasks';
import { useOnboardings } from './store';
import { Card, HealthChip, Progress, QAChip, StepChip, Tabs, useTab } from './ui';

const TABS: [string, string][] = [
  ['overview', 'Overview'], ['plan', 'Plan'], ['setup', 'Setup'], ['work', 'Work'],
  ['documents', 'Documents'], ['comms', 'Comms'], ['admin', 'Admin'],
];
const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

export default function ProjectPage() {
  const { id } = useParams();
  const o = useOnboardings().onboardings.find((x) => x.id === id);
  const [tab, setTab] = useTab(TABS.map(([k]) => k));
  if (!o) return <p className="text-sm text-slate-500">Onboarding not found. <Link to="/onboarding" className="text-brand-600">Back</Link></p>;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <Link to="/onboarding" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Onboarding</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{o.customer}</h1>
          <HealthChip h={o.health} />
          {o.status === 'on_hold' && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">On hold</span>}
        </div>
        <p className="text-sm text-slate-500">{o.stage} · Go-live {fmt(o.goLive, true)}</p>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'overview' && <Overview o={o} />}
      {tab === 'plan' && <Plan o={o} />}
      {tab === 'setup' && <Setup o={o} />}
      {tab === 'work' && <Work o={o} />}
      {tab === 'documents' && <Documents o={o} />}
      {tab === 'comms' && <Comms o={o} />}
      {tab === 'admin' && <Admin o={o} />}
    </div>
  );
}

const KV = ({ rows }: { rows: [string, ReactNode][] }) => (
  <dl className="space-y-2 text-sm">
    {rows.map(([k, v]) => (
      <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
    ))}
  </dl>
);

function Overview({ o }: { o: Onboarding }) {
  const cur = STAGES.indexOf(o.stage);
  const span = daysBetween(o.start, o.goLive);
  const dates: [string, string][] = [
    ['Kickoff', o.start], ['Configuration complete', addDays(o.start, Math.round(span * 0.55))],
    ['UAT start', addDays(o.goLive, -14)], ['Go-live', o.goLive], ['Hypercare ends', addDays(o.goLive, 30)],
  ];
  return (
    <div className="space-y-4">
      <Card title="Onboarding journey">
        <ol className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {STAGES.map((s, i) => (
            <li key={s} className="text-center">
              <div className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                i < cur ? 'bg-emerald-500 text-white' : i === cur ? 'bg-brand-500 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-500'}`}>
                {i < cur ? <Check size={14} /> : i + 1}
              </div>
              <div className={`mt-1.5 text-xs ${i === cur ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{s}</div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Scope & product">
          <KV rows={[['Product', o.product]]} />
          <div className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">In scope</div>
          <div className="mt-1 flex flex-wrap gap-1.5">{o.scope.map((s) => <span key={s} className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{s}</span>)}</div>
          <div className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Out of scope</div>
          <ul className="mt-1 list-disc pl-4 text-sm text-slate-600">{o.outOfScope.map((s) => <li key={s}>{s}</li>)}</ul>
        </Card>

        <Card title="Key dates">
          <ul className="space-y-2 text-sm">
            {dates.map(([label, d]) => (
              <li key={label} className="flex justify-between"><span className="text-slate-500">{label}</span>
                <span className={`font-medium ${d < today ? 'text-slate-400' : ''}`}>{fmt(d, true)}</span></li>
            ))}
          </ul>
        </Card>

        <Card title="Health & key facts">
          <div className="mb-3 flex items-center gap-2"><HealthChip h={o.health} /><span className="text-sm text-slate-600">{o.healthNote}</span></div>
          <KV rows={[...o.facts.map((f): [string, ReactNode] => [f.label, f.value]), ['QA', <QAChip key="qa" q={o.qa} />]]} />
          <div className="mt-3"><Progress pct={progress(o)} /></div>
        </Card>

        <Card title="Team">
          <ul className="space-y-2 text-sm">
            {o.team.map((t) => (
              <li key={t.userId} className="flex justify-between"><span className="font-medium">{userName(t.userId)}</span><span className="text-slate-500">{t.role}</span></li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Authorized contacts">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-2">Name</th><th>Title</th><th>Email</th><th>Can approve</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {o.contacts.map((c) => (
              <tr key={c.email}><td className="py-2 font-medium">{c.name}</td><td>{c.title}</td><td className="text-slate-500">{c.email}</td><td>{c.canApprove ? 'Yes' : 'No'}</td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Plan({ o }: { o: Onboarding }) {
  const span = daysBetween(o.start, o.goLive);
  const cur = STAGES.indexOf(o.stage);
  return (
    <Card title="Stage plan">
      <ul className="divide-y divide-slate-100 text-sm">
        {STAGES.slice(0, 5).map((s, i) => (
          <li key={s} className="flex items-center justify-between py-2.5">
            <span className="font-medium">{s}</span>
            <span className="text-slate-500">{fmt(addDays(o.start, Math.round((span * i) / 5)))} → {fmt(addDays(o.start, Math.round((span * (i + 1)) / 5)))}</span>
            <span className="w-24 text-right text-xs">{i < cur ? 'Done' : i === cur ? 'Current' : 'Upcoming'}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Steps({ title, steps }: { title: string; steps: Onboarding['qaChecks'] }) {
  return (
    <Card title={title}>
      <ul className="divide-y divide-slate-100 text-sm">
        {steps.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2">
            <span className="flex-1">{t.title}</span>
            <span className="hidden text-slate-500 sm:block">{userName(t.assigneeId)}</span>
            <span className="w-14 text-right text-slate-500">{fmt(t.due)}</span>
            <StepChip s={t.status} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

const Setup = ({ o }: { o: Onboarding }) => (
  <div className="space-y-4"><Card title="Configuration tasks"><ConfigTasks o={o} /></Card><Steps title="QA checks" steps={o.qaChecks} /></div>
);

function Work({ o }: { o: Onboarding }) {
  const { entries } = useTime();
  const mine = entries.filter((e) => o.projectId && e.projectId === o.projectId);
  const total = mine.reduce((s, e) => s + e.minutes, 0);
  if (!o.projectId) return <Card title="Time logged"><p className="text-sm text-slate-500">No time project linked to this onboarding.</p></Card>;
  return (
    <Card title={`Time logged — ${formatHours(total)} h`}>
      <ul className="divide-y divide-slate-100 text-sm">
        {[...mine].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((e) => (
          <li key={e.id} className="flex justify-between py-2"><span>{fmt(e.date)} · {e.activity ?? 'No activity'}</span><span className="tabular-nums text-slate-500">{formatHours(e.minutes)} h</span></li>
        ))}
      </ul>
      <Link to="/time" className="mt-3 inline-block text-sm text-brand-600">Open Time →</Link>
    </Card>
  );
}

const Documents = ({ o }: { o: Onboarding }) => (
  <Card title="Documents">
    <ul className="divide-y divide-slate-100 text-sm">
      {[['Statement of work', 'Signed'], ['Requirements workbook', progress(o) > 0 ? 'Approved' : 'Draft'], ['Pay rules specification', progress(o) > 40 ? 'Approved' : 'In review'], ['UAT sign-off', o.qa === 'passed' ? 'Signed' : 'Pending']].map(([n, s]) => (
        <li key={n} className="flex justify-between py-2.5"><span>{n}</span><span className="text-slate-500">{s}</span></li>
      ))}
    </ul>
  </Card>
);

const Comms = ({ o }: { o: Onboarding }) => (
  <Card title="Communication log">
    <ul className="space-y-3 text-sm">
      {[[-2, 'Status call', 'Reviewed config progress and open questions.'], [-9, 'Email', 'Sent updated timeline to authorized contacts.'], [-16, 'Workshop', 'Pay rules walkthrough with payroll team.']].map(([d, t, n]) => (
        <li key={String(d)}><div className="flex justify-between"><span className="font-medium">{t as string}</span><span className="text-slate-500">{fmt(addDays(today, d as number))}</span></div><p className="text-slate-600">{n as string} ({o.customer})</p></li>
      ))}
    </ul>
  </Card>
);

const Admin = ({ o }: { o: Onboarding }) => (
  <Card title="Admin">
    <KV rows={[['Onboarding owner', userName(o.ownerId)], ['Package', 'Standard onboarding'], ['Billing status', o.stage === 'Kickoff' ? 'Deposit invoiced' : 'Milestone billing'], ['Status', o.status === 'on_hold' ? 'On hold' : 'Active']]} />
  </Card>
);
