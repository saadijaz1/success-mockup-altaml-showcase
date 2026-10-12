import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink } from 'lucide-react';
import { Card, Tabs, useTab } from '../onboarding/ui';
import { DEAL_STAGES, byId, syncedLabel, type Prospect } from './data';
import { QuoteChip } from './SalesPage';

const TABS: [string, string][] = [['overview', 'Overview'], ['quote', 'Quote'], ['documents', 'Documents'], ['notes', 'Handoff Notes'], ['master', 'Master Data']];
const DOCS = ['Sample tickets.pdf', 'Sample invoices.xlsx', 'Org chart.pdf', 'Pay rules summary.docx', 'Site list.xlsx', 'Crew roster.csv', 'Contract draft.pdf', 'Security review.pdf', 'Kickoff agenda.docx'];
const NOTES = ['Champion prefers weekly status updates.', 'Payroll runs bi-weekly; cutoff is Monday noon.', 'Union rules apply at two sites.', 'Wants field forms live before payroll.', 'Legal review needed on data terms.', 'Finance approver is on leave until next month.', 'Existing system exports nightly CSV.', 'Go-live target tied to fiscal year start.'];

export default function ProspectPage() {
  const { id } = useParams();
  const p = byId(id);
  const [tab, setTab] = useTab(TABS.map(([k]) => k));
  if (!p) return <p className="text-sm text-slate-500">Prospect not found. <Link to="/sales" className="text-brand-600">Back</Link></p>;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <Link to="/sales" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> Sales</Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{p.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700">{p.tier}</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{p.phase}</span>
              Owner: {p.owner} · {p.days}d in pipeline
            </div>
          </div>
          <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Raise a question</button>
        </div>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'overview' && <Overview p={p} />}
      {tab === 'quote' && <Quote p={p} />}
      {tab === 'documents' && <List title="Documents" empty="No documents uploaded yet." items={DOCS.slice(0, p.docs)} />}
      {tab === 'notes' && <List title="Handoff notes" empty="No handoff notes yet." items={NOTES.slice(0, p.notes)} />}
      {tab === 'master' && <MasterData p={p} />}
    </div>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-slate-500">{children}</p>;
const Row = ({ k, v }: { k: string; v?: string }) => (
  <div className="flex justify-between py-1.5 text-sm"><dt className="text-slate-500">{k}</dt><dd className={v ? 'font-medium' : 'text-slate-400'}>{v ?? '—'}</dd></div>
);

function Overview({ p }: { p: Prospect }) {
  const accepted = p.quote === 'Accepted';
  const done = [p.masterData, p.quote === 'Published' || accepted, accepted];
  const now = done.indexOf(false);
  const outstanding = accepted ? 0 : 2;
  const steps: [string, string][] = [
    ['Account & demo prep', p.masterData ? 'Master data extracted' : 'No master data extracted yet'],
    ['Quote', done[1] ? `Quote ${p.quote.toLowerCase()}` : 'No quote published yet'],
    ['Close & hand over', outstanding ? `${outstanding} required items outstanding` : 'All required items complete'],
  ];

  return (
    <div className="space-y-4">
      <Card title="HubSpot deal">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">{DEAL_STAGES[p.dealStage]}</span>
          <span className="flex items-center gap-3 text-slate-500">synced {syncedLabel} MDT
            <span className="inline-flex items-center gap-1 text-brand-600">Open in HubSpot <ExternalLink size={13} /></span></span>
        </div>
        <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {DEAL_STAGES.map((s, i) => (
            <li key={s} className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 ${i === p.dealStage ? 'bg-brand-50 font-medium text-brand-700' : i < p.dealStage ? 'text-emerald-700' : 'text-slate-400'}`}>
              {i < p.dealStage && <Check size={13} />}{s}
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map(([title, text], i) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 font-semibold">{done[i] ? <Check size={13} /> : i + 1}</span>
              <span className={i === now ? 'font-semibold text-brand-600' : 'text-slate-400'}>{done[i] ? 'Done' : i === now ? 'Now' : 'Later'}</span>
            </div>
            <div className="mt-2 font-medium">{title}</div>
            <div className="text-sm text-slate-500">{text}</div>
            {i === 0 && !p.masterData && (
              <p className="mt-2 text-xs text-slate-500"><span className="font-medium text-slate-700">Their data in the demo.</span> Upload their sample tickets and invoices, then run extraction, so the demo shows their sites and crews instead of ours.</p>
            )}
          </div>
        ))}
      </div>

      <Card title="Contacts">
        <p className="mb-3 text-xs text-slate-500">Who Onboarding will deal with. The champion and up to 5 others carry over at the transition.</p>
        {p.contacts.length ? (
          <ul className="divide-y divide-slate-100 text-sm">
            {p.contacts.map((c) => (
              <li key={c.name} className="flex justify-between py-2"><span className="font-medium">{c.name}{c.champion && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">Champion</span>}</span><span className="text-slate-500">{c.role}</span></li>
            ))}
          </ul>
        ) : <Empty>No contacts yet. Import them from the linked HubSpot deal, or add the champion by hand.</Empty>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="What they do">
          <div className="mb-2 text-xs text-slate-500">Not in the directory</div>
          {p.website ? (
            <dl className="divide-y divide-slate-100">
              <Row k="Size" v="120 employees" /><Row k="Founded" v="2009" /><Row k="Head office" v="Calgary, AB" /><Row k="Website" v={p.website} /><Row k="Site read" v="Complete" />
            </dl>
          ) : (
            <>
              <Empty>No profile yet. Add their website to start; the directory match and the site reader both run on it.</Empty>
              <dl className="mt-2 divide-y divide-slate-100"><Row k="Size" /><Row k="Founded" /><Row k="Head office" /><Row k="Website" /><Row k="Site read" /></dl>
            </>
          )}
        </Card>
        <div className="space-y-4">
          <Card title="Customers like this prospect">
            <p className="mb-2 text-xs text-slate-500">Ranked by shared work; headline services count double.</p>
            {p.website ? (
              <ul className="space-y-1.5 text-sm"><li>Redwater Pipeline Services</li><li>Summit Peak Roofing</li><li>Lakeshore Excavating</li></ul>
            ) : <Empty>Nothing is recorded about what this prospect does yet. Add their website above and the directory match can run.</Empty>}
          </Card>
          <Card title="Account details">
            <dl className="divide-y divide-slate-100"><Row k="Industry" v={p.industry} /><Row k="Plan tier" v={p.tier} /></dl>
            {!p.industry && <p className="mt-2 text-xs text-slate-400">Not recorded. Add one under What they do.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Quote({ p }: { p: Prospect }) {
  const issued = p.quote === 'Published' || p.quote === 'Accepted';
  const lines: [string, number][] = [[`${p.tier} plan, annual`, 24000], ['Onboarding package', 6500], ['Training sessions (2)', 1500]];
  return (
    <Card title="Quote">
      <div className="mb-3"><QuoteChip q={p.quote} /></div>
      {issued ? (
        <table className="w-full text-sm"><tbody className="divide-y divide-slate-100">
          {lines.map(([k, v]) => <tr key={k}><td className="py-2">{k}</td><td className="text-right tabular-nums">${v.toLocaleString()}</td></tr>)}
          <tr className="font-semibold"><td className="py-2">Total</td><td className="text-right tabular-nums">${lines.reduce((s, [, v]) => s + v, 0).toLocaleString()}</td></tr>
        </tbody></table>
      ) : <Empty>{p.quote === 'Draft' ? 'Quote is in draft and not yet published.' : 'No quote published yet.'}</Empty>}
    </Card>
  );
}

function List({ title, empty, items }: { title: string; empty: string; items: string[] }) {
  return (
    <Card title={`${title} (${items.length})`}>
      {items.length ? <ul className="divide-y divide-slate-100 text-sm">{items.map((i) => <li key={i} className="py-2">{i}</li>)}</ul> : <Empty>{empty}</Empty>}
    </Card>
  );
}

function MasterData({ p }: { p: Prospect }) {
  const rows = [['Sites', 4], ['Crews', 11], ['Employees', 120], ['Cost codes', 38]];
  return (
    <Card title="Master data">
      {p.masterData ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rows.map(([k, v]) => <div key={k} className="rounded-md bg-slate-50 p-3"><dt className="text-xs text-slate-500">{k}</dt><dd className="text-xl font-semibold tabular-nums">{v}</dd></div>)}
        </dl>
      ) : <Empty>No master data extracted yet. Upload sample tickets and invoices under Documents, then run extraction.</Empty>}
    </Card>
  );
}
