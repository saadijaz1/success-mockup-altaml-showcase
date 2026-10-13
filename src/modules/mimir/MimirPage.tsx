import { useEffect, useRef, useState } from 'react';
import { BookOpen, LifeBuoy, Send, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { byId, docs, type Doc } from './data';
import { answer, type Answer, type Scope } from './search';

interface Msg { id: string; role: 'user' | 'assistant'; text?: string; a?: Answer; vote?: 'up' | 'down' }
const KEY = 'success.mimir.chat.v1';
const SUGGESTIONS = ['How do I set up overtime rules?', 'SSO login keeps looping back to the sign-in page', 'Payroll export totals do not match the provider', 'Timesheets stuck pending after an approver left'];
const SCOPES: [Scope, string][] = [['all', 'All sources'], ['article', 'Articles'], ['ticket', 'Tickets']];
const articles = docs.filter((d) => d.type === 'article').length;

function load(): Msg[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Msg[]; } catch { return []; }
}

export default function MimirPage() {
  const [msgs, setMsgs] = useState<Msg[]>(load);
  const [text, setText] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(msgs)); } catch { /* ignore */ }
    end.current?.scrollIntoView?.({ block: 'end' });
  }, [msgs, busy]);

  function ask(q: string) {
    q = q.trim();
    if (!q || busy) return;
    const prev = [...msgs].reverse().find((m) => m.role === 'user')?.text;
    const query = q.split(/\s+/).length <= 2 && prev ? `${prev} ${q}` : q; // very short follow-ups reuse the previous question
    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: 'user', text: q }]);
    setText('');
    setBusy(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', a: answer(query, scope) }]);
      setBusy(false);
    }, 450);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Mimir</h1>
          <p className="text-sm text-slate-500">Ask about features, past issues and how they were fixed.</p>
        </div>
        <span className="text-xs text-slate-500">Indexed: {articles} wiki articles · {docs.length - articles} support tickets</span>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Demo mode: answers come from a small fictional knowledge base using keyword search, not a language model. Every answer lists its sources.
      </div>

      <div className="flex items-center gap-1.5 text-sm">
        {SCOPES.map(([k, l]) => (
          <button key={k} onClick={() => setScope(k)} className={`rounded-full border px-3 py-1 ${scope === k ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>{l}</button>
        ))}
        {msgs.length > 0 && <button onClick={() => setMsgs([])} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-slate-700"><Trash2 size={13} /> Clear chat</button>}
      </div>

      <div className="min-h-64 space-y-4" aria-live="polite">
        {msgs.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-5">
            <p className="mb-3 text-sm text-slate-600">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-left text-sm hover:border-slate-500">{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m) => (m.role === 'user'
          ? <div key={m.id} className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-500 px-3.5 py-2 text-sm text-white">{m.text}</p></div>
          : <Reply key={m.id} m={m} onVote={(v) => setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, vote: x.vote === v ? undefined : v } : x)))} />))}
        {busy && <p className="text-sm text-slate-400">Searching…</p>}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="sticky bottom-0 flex gap-2 bg-slate-50 pb-2 pt-1">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask Mimir…" aria-label="Ask Mimir" className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500" />
        <button disabled={!text.trim() || busy} className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-slate-300"><Send size={14} /> Ask</button>
      </form>
    </div>
  );
}

function Reply({ m, onVote }: { m: Msg; onVote: (v: 'up' | 'down') => void }) {
  const a = m.a!;
  const [open, setOpen] = useState<string | null>(null);
  if (!a.found) {
    return <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm ring-1 ring-slate-200">I couldn't find anything on that in the wiki or past tickets. Try different keywords, or switch to All sources.</div>;
  }
  const src = a.sources.map(byId).filter((d): d is Doc => !!d);
  return (
    <div className="max-w-[90%] space-y-3 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm ring-1 ring-slate-200">
      <p>{a.lead}</p>
      {a.steps.length > 0 && <ol className="list-decimal space-y-0.5 pl-5 text-slate-700">{a.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
      {a.seen.length > 0 && (
        <div className="rounded-md bg-slate-50 px-3 py-2">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Seen before</div>
          <ul className="space-y-1 text-slate-700">{a.seen.map((s) => <li key={s.id}><span className="font-mono text-xs text-slate-500">{s.id}</span> {s.text}</li>)}</ul>
        </div>
      )}
      <div>
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Sources</div>
        <div className="flex flex-wrap gap-1.5">
          {src.map((d) => (
            <button key={d.id} onClick={() => setOpen(open === d.id ? null : d.id)} aria-expanded={open === d.id}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${open === d.id ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 hover:border-slate-500'}`}>
              {d.type === 'article' ? <BookOpen size={12} /> : <LifeBuoy size={12} />}{d.id} · {d.title.length > 34 ? `${d.title.slice(0, 34)}…` : d.title}
            </button>
          ))}
        </div>
        {src.filter((d) => d.id === open).map((d) => (
          <div key={d.id} className="mt-2 rounded-md border border-slate-200 p-3">
            <div className="font-medium">{d.title}</div>
            <div className="mb-2 text-xs text-slate-500">{d.type === 'article' ? 'Wiki article' : `Support ticket · ${d.customer} · ${d.status}`} · {d.area} · updated {d.daysAgo} days ago</div>
            <p className="text-slate-700">{d.type === 'ticket' ? 'Problem: ' : ''}{d.body}</p>
            {d.type === 'ticket' && <p className="mt-1.5 text-slate-700"><b>Resolution:</b> {d.answer}</p>}
            {d.steps && <ol className="mt-1.5 list-decimal pl-5 text-slate-700">{d.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 text-slate-400">
        <span className="mr-1 text-xs">Helpful?</span>
        <button onClick={() => onVote('up')} aria-label="Helpful" aria-pressed={m.vote === 'up'} className={`rounded p-1 hover:bg-slate-100 ${m.vote === 'up' ? 'text-emerald-600' : ''}`}><ThumbsUp size={14} /></button>
        <button onClick={() => onVote('down')} aria-label="Not helpful" aria-pressed={m.vote === 'down'} className={`rounded p-1 hover:bg-slate-100 ${m.vote === 'down' ? 'text-red-600' : ''}`}><ThumbsDown size={14} /></button>
      </div>
    </div>
  );
}
