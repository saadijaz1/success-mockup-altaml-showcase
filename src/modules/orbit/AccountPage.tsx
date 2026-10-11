import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { users } from '../../data/mock';
import { Card } from '../onboarding/ui';
import { BandChip } from './OrbitPage';
import { accounts, money } from './score';

export default function AccountPage() {
  const { id } = useParams();
  const a = accounts.find((x) => x.id === id);
  if (!a) return <p className="text-sm text-slate-500">Account not found. <Link to="/orbit" className="text-brand-600">Back</Link></p>;
  const churned = a.kind === 'CHURNED';
  const facts: [string, string][] = [
    ['Industry', a.industry], ['Plan tier', a.tier], ['Employees', String(a.employees)], ['Customer for', `${a.tenureMonths} months`],
    ['ARR', a.arr ? `${money(a.arr)} CAD` : 'Not valued'], ['Renews in', a.renewalIn === null ? '–' : `${a.renewalIn} days`],
    ['Last contact', `${a.lastTouchDays} days ago`], ['Owner', users.find((u) => u.id === a.ownerId)?.name ?? 'Unassigned'],
    ['Outstanding', a.owing ? `${money(a.owing)} (${a.overdueDays} d overdue)` : 'None'], ['Open work items', String(a.workItems)],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Link to="/orbit" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Orbit</Link>
        <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{a.name}</h1>{!churned && <BandChip a={a} />}{churned && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">Churned</span>}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {!churned && (
          <Card title="Churn risk">
            <div className="text-4xl font-semibold">{Math.round(a.p * 100)}%</div>
            <div className="text-sm text-slate-500">12-month churn probability · health score {a.health}</div>
            <h3 className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">What's driving it</h3>
            {a.drivers.length ? (
              <ul className="space-y-1.5 text-sm">
                {a.drivers.slice(0, 5).map((d) => (
                  <li key={d.label} className="flex items-center gap-2"><span className="h-2 rounded bg-red-500" style={{ width: `${Math.min(d.effect * 60, 100)}px` }} />{d.label}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No signals raising risk.</p>}
            {a.thin && <p className="mt-3 text-xs text-slate-500">Thin reading: no usage data yet, so this score leans on the other signals.</p>}
          </Card>
        )}
        <Card title="Account details">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            {facts.map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </Card>
        <Card title="Open risk flags">
          {a.flags.length ? <ul className="text-sm">{a.flags.map((f, i) => <li key={i} className="py-0.5">{f[0] + f.slice(1).toLowerCase()} severity flag</li>)}</ul> : <p className="text-sm text-slate-500">None.</p>}
        </Card>
        <Card title="HubSpot">
          <p className="text-sm">{a.hubspotId ? <>Company ID <span className="font-mono">{a.hubspotId}</span></> : <span className="text-amber-700">Not linked to a HubSpot company.</span>}</p>
          <p className="mt-1 text-sm">{a.chargebeeId ? <>Billing ID <span className="font-mono">{a.chargebeeId}</span></> : <span className="text-amber-700">No billing ID.</span>}</p>
          <p className="mt-2 text-xs text-slate-400">Simulated sync. IDs are fictional.</p>
        </Card>
      </div>
    </div>
  );
}
