import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CURRENT_USER_ID, users } from '../../data/mock';
import { PRIORITY_META, TASK_PRIORITIES, TASK_STATUSES, TASK_STATUS_META, type ConfigTask, type TaskPriority, type TaskStatus } from './data';
import { Mentions } from '../connectors/mentions';
import { useOnboardings } from './store';

const inp = 'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500';
const userName = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown';
const stamp = (iso: string) => new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function TaskPage() {
  const { id, taskId } = useParams();
  const nav = useNavigate();
  const { onboardings, saveTask, deleteTask } = useOnboardings();
  const [confirm, setConfirm] = useState(false);

  const o = onboardings.find((x) => x.id === id);
  const raw = o?.configTasks.find((t) => t.id === taskId);
  if (!o || !raw) return <p className="text-sm text-slate-500">Task not found. <Link to="/onboarding" className="text-brand-600">Back</Link></p>;

  const t: ConfigTask = { ...raw, priority: raw.priority ?? 'medium', comments: raw.comments ?? [] };
  const update = (patch: Partial<ConfigTask>) => saveTask(o.id, { ...t, ...patch });
  const back = `/onboarding/${o.id}?tab=setup`;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <Link to={back} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft size={14} /> {o.customer} · Setup</Link>
        <div className="font-mono text-xs text-slate-500">{t.key}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Left: task info + comments */}
        <div className="min-w-0 space-y-6">
          <TitleField key={`${t.id}-title`} value={t.title} onSave={(v) => update({ title: v })} />
          <section>
            <h2 className="mb-1.5 text-sm font-semibold text-slate-700">Description</h2>
            <DescriptionField key={`${t.id}-desc`} value={t.description} onSave={(v) => update({ description: v })} />
          </section>
          <Comments
            comments={t.comments}
            onAdd={(text) => update({ comments: [...t.comments, { id: crypto.randomUUID(), authorId: CURRENT_USER_ID, at: new Date().toISOString(), text }] })}
          />
        </div>

        {/* Right: configuration */}
        <aside className="h-fit space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <Field label="Status">
            <select value={t.status} onChange={(e) => update({ status: e.target.value as TaskStatus })} className={`${inp} font-medium ${TASK_STATUS_META[t.status][1]}`}>
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s][0]}</option>)}
            </select>
          </Field>
          <Field label="Assignee">
            <select value={t.assigneeId} onChange={(e) => update({ assigneeId: e.target.value, involved: t.involved.filter((x) => x !== e.target.value), reviewerId: t.reviewerId === e.target.value ? undefined : t.reviewerId })} className={inp}>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Reviewer">
            <select value={t.reviewerId ?? ''} onChange={(e) => update({ reviewerId: e.target.value || undefined })} className={inp}>
              <option value="">None</option>
              {users.filter((u) => u.id !== t.assigneeId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={t.priority} onChange={(e) => update({ priority: e.target.value as TaskPriority })} className={inp}>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p][0]}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" value={t.due} onChange={(e) => e.target.value && update({ due: e.target.value })} className={inp} />
          </Field>
          <fieldset>
            <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Also involved</legend>
            <div className="space-y-1 text-sm">
              {users.filter((u) => u.id !== t.assigneeId).map((u) => (
                <label key={u.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={t.involved.includes(u.id)} onChange={(e) => update({ involved: e.target.checked ? [...t.involved, u.id] : t.involved.filter((x) => x !== u.id) })} />
                  {u.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() => (confirm ? (deleteTask(o.id, t.id), nav(back)) : setConfirm(true))}
              onBlur={() => setConfirm(false)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              {confirm ? 'Click again to confirm delete' : 'Delete task'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>{children}</label>
);

function TitleField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <input
      value={v} placeholder="Task title" autoFocus={!value} aria-label="Title"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v.trim() !== value && onSave(v.trim())}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-full rounded-md border border-transparent px-2 py-1 text-2xl font-semibold outline-none hover:border-slate-200 focus:border-brand-500"
    />
  );
}

function DescriptionField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <textarea
      value={v} rows={5} placeholder="Add a description…" aria-label="Description"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onSave(v)}
      className={`${inp} resize-y`}
    />
  );
}

function Comments({ comments, onAdd }: { comments: ConfigTask['comments']; onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-slate-700">Comments ({comments.length})</h2>
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold">{users.find((u) => u.id === c.authorId)?.initials ?? '?'}</span>
            <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-xs"><span className="font-medium text-slate-800">{userName(c.authorId)}</span> <span className="text-slate-400">{stamp(c.at)}</span></div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700"><Mentions text={c.text} /></p>
            </div>
          </li>
        ))}
        {comments.length === 0 && <li className="text-sm text-slate-400">No comments yet.</li>}
      </ul>
      <div className="mt-4 flex gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{users.find((u) => u.id === CURRENT_USER_ID)?.initials}</span>
        <div className="flex-1">
          <textarea
            value={text} rows={3} placeholder="Add a comment…" aria-label="New comment"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()}
            className={`${inp} resize-none`}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              Tag:
              {users.filter((u) => u.id !== CURRENT_USER_ID).map((u) => (
                <button key={u.id} type="button" onClick={() => setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}@${u.name.split(' ')[0]} `)} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 hover:bg-brand-50 hover:text-brand-700">@{u.name.split(' ')[0]}</button>
              ))}
              · Ctrl+Enter to post
            </span>
            <button onClick={submit} disabled={!text.trim()} className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:bg-slate-300">Comment</button>
          </div>
        </div>
      </div>
    </section>
  );
}
