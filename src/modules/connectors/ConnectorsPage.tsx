import { useState, type ReactNode } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { Card, Tabs, useTab } from '../onboarding/ui';
import { EVENTS, useConnectors, type Channel, type LogEntry } from './store';

const TABS: [string, string][] = [['connectors', 'Connectors'], ['rules', 'Notification rules'], ['activity', 'Activity']];
const inp = 'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500';

export default function ConnectorsPage() {
  const [tab, setTab] = useTab(TABS.map(([k]) => k));
  const { log } = useConnectors();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Connectors</h1>
        <p className="text-sm text-slate-500">Send task updates and @mentions to email and Slack.</p>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Demo mode: connectors are simulated. Messages appear under Activity and nothing is actually sent.
      </div>
      <Tabs tabs={TABS.map(([k, l]) => [k, k === 'activity' ? `${l} (${log.length})` : l])} active={tab} onChange={setTab} />
      {tab === 'connectors' && <Connectors />}
      {tab === 'rules' && <Rules />}
      {tab === 'activity' && <Activity />}
    </div>
  );
}

function Connectors() {
  const { settings, setEmail, setSlack, sendTest } = useConnectors();
  const { email, slack } = settings;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ConnectorCard
        icon={<Mail size={18} />} name="Email" connected={email.connected}
        onToggle={() => setEmail({ connected: !email.connected })} onTest={() => sendTest('email')}
      >
        <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">From name</span>
          <input className={inp} value={email.fromName} onChange={(e) => setEmail({ fromName: e.target.value })} /></label>
        <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">From address</span>
          <input className={inp} value={email.fromAddress} onChange={(e) => setEmail({ fromAddress: e.target.value })} /></label>
      </ConnectorCard>
      <ConnectorCard
        icon={<MessageSquare size={18} />} name="Slack" connected={slack.connected}
        onToggle={() => setSlack({ connected: !slack.connected })} onTest={() => sendTest('slack')}
      >
        <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</span>
          <input className={inp} value={slack.workspace} onChange={(e) => setSlack({ workspace: e.target.value })} /></label>
        <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Channel</span>
          <div className="flex items-center gap-1"><span className="text-slate-400">#</span>
            <input className={inp} value={slack.channel} onChange={(e) => setSlack({ channel: e.target.value.replace(/[^a-z0-9-_]/gi, '').toLowerCase() })} /></div></label>
      </ConnectorCard>
    </div>
  );
}

function ConnectorCard({ icon, name, connected, onToggle, onTest, children }: { icon: ReactNode; name: string; connected: boolean; onToggle: () => void; onTest: () => void; children: ReactNode }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold"><span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100">{icon}</span>{name}</div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{connected ? 'Connected' : 'Not connected'}</span>
      </div>
      <div className={`space-y-3 ${connected ? '' : 'pointer-events-none opacity-50'}`}>{children}</div>
      <div className="mt-4 flex gap-2">
        <button onClick={onToggle} className={`rounded-md px-3 py-1.5 text-sm font-medium ${connected ? 'border border-slate-300 hover:bg-slate-50' : 'bg-brand-500 text-white hover:bg-brand-600'}`}>
          {connected ? 'Disconnect' : `Connect ${name}`}
        </button>
        {connected && <button onClick={onTest} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Send test</button>}
      </div>
    </Card>
  );
}

function Rules() {
  const { rules, toggleRule, settings } = useConnectors();
  const channels: [Channel, string][] = [['email', 'Email'], ['slack', 'Slack']];
  return (
    <Card>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="pb-2">Event</th><th className="hidden pb-2 sm:table-cell">Who is notified</th>{channels.map(([c, l]) => <th key={c} className="pb-2 text-center">{l}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {EVENTS.map((e) => (
            <tr key={e.kind}>
              <td className="py-2.5 font-medium">{e.label}</td>
              <td className="hidden pr-3 text-slate-500 sm:table-cell">{e.who}</td>
              {channels.map(([c, l]) => (
                <td key={c} className="text-center">
                  <input type="checkbox" aria-label={`${e.label} via ${l}`} checked={rules[e.kind][c]} disabled={!settings[c].connected} onChange={() => toggleRule(e.kind, c)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">Email goes to each person individually. Slack posts once to the channel and tags the people involved. You are never notified about your own changes.</p>
    </Card>
  );
}

function Activity() {
  const { log, clearLog } = useConnectors();
  const [open, setOpen] = useState<string | null>(null);
  if (!log.length) return <Card><p className="py-6 text-center text-sm text-slate-500">No notifications yet. Change a task's status, reassign it, or tag someone with @name in a comment.</p></Card>;
  return (
    <div className="space-y-2">
      <div className="flex justify-end"><button onClick={clearLog} className="text-sm text-slate-500 hover:text-slate-700">Clear log</button></div>
      {log.map((e) => <Row key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />)}
    </div>
  );
}

function Row({ e, open, onToggle }: { e: LogEntry; open: boolean; onToggle: () => void }) {
  const Icon = e.channel === 'email' ? Mail : MessageSquare;
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
        <Icon size={16} className={e.channel === 'email' ? 'text-slate-500' : 'text-violet-600'} />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{e.title}</span><span className="block truncate text-xs text-slate-500">To {e.to} · {e.customer}</span></span>
        <span className="shrink-0 text-xs text-slate-400">{new Date(e.at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          {e.channel === 'email' && <div className="mb-2 text-xs text-slate-500">Subject: <span className="font-medium text-slate-700">{e.title}</span></div>}
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{e.body}</pre>
        </div>
      )}
    </div>
  );
}
