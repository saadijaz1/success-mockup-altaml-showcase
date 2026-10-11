import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { users } from '../../data/mock';
import { TASK_STATUSES, TASK_STATUS_META, addDays, fmt, today, type ConfigTask, type Onboarding, type TaskStatus } from './data';
import { useOnboardings } from './store';

const inp = 'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500';
const initials = (id?: string) => users.find((u) => u.id === id)?.initials ?? '–';

export default function ConfigTasks({ o }: { o: Onboarding }) {
  const { saveTask } = useOnboardings();
  const [dialog, setDialog] = useState<{ task?: ConfigTask } | null>(null);

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button onClick={() => setDialog({})} className="flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
          <Plus size={13} /> New task
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="pb-1.5">Key</th><th>Task</th><th>Status</th><th>Assignee</th><th>Reviewer</th><th>Due</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {o.configTasks.map((t) => (
              <tr key={t.id}>
                <td className="py-2 pr-2 font-mono text-xs text-slate-500">{t.key}</td>
                <td className="pr-3">
                  <button onClick={() => setDialog({ task: t })} className="text-left font-medium hover:text-brand-600">{t.title}</button>
                  {t.involved.length > 0 && <span className="ml-2 text-xs text-slate-400">+{t.involved.length}</span>}
                </td>
                <td className="pr-3">
                  <select
                    aria-label={`Status of ${t.key}`}
                    value={t.status}
                    onChange={(e) => saveTask(o.id, { ...t, status: e.target.value as TaskStatus })}
                    className={`rounded-full border-0 px-2 py-1 text-xs font-medium outline-none ${TASK_STATUS_META[t.status][1]}`}
                  >
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s][0]}</option>)}
                  </select>
                </td>
                <td className="pr-3">
                  <select aria-label={`Assignee of ${t.key}`} value={t.assigneeId} onChange={(e) => saveTask(o.id, { ...t, assigneeId: e.target.value })} className="rounded border-0 bg-transparent py-1 text-sm outline-none">
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </td>
                <td className="pr-3"><span title={users.find((u) => u.id === t.reviewerId)?.name} className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold">{initials(t.reviewerId)}</span></td>
                <td className={`whitespace-nowrap ${t.due < today && !['done', 'deployed'].includes(t.status) ? 'font-medium text-red-600' : 'text-slate-500'}`}>{fmt(t.due)}</td>
              </tr>
            ))}
            {o.configTasks.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">No tasks yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {dialog && <TaskDialog o={o} task={dialog.task} onClose={() => setDialog(null)} />}
    </div>
  );
}

function TaskDialog({ o, task, onClose }: { o: Onboarding; task?: ConfigTask; onClose: () => void }) {
  const { saveTask, deleteTask, nextKey } = useOnboardings();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'triage');
  const [assigneeId, setAssignee] = useState(task?.assigneeId ?? users[0].id);
  const [reviewerId, setReviewer] = useState(task?.reviewerId ?? '');
  const [involved, setInvolved] = useState<string[]>(task?.involved ?? []);
  const [due, setDue] = useState(task?.due ?? addDays(today, 7));
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!title.trim()) return;
    saveTask(o.id, {
      id: task?.id ?? crypto.randomUUID(), key: task?.key ?? nextKey(o), title: title.trim(), description: description.trim(),
      status, assigneeId, reviewerId: reviewerId || undefined, involved: involved.filter((id) => id !== assigneeId), due,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-10" onMouseDown={onClose}>
      <form role="dialog" aria-modal="true" aria-label="Task" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="font-semibold">{task ? `${task.key} · Edit task` : 'New task'} <span className="font-normal text-slate-400">· {o.customer}</span></h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm">
          <label className="block"><span className="mb-1 block font-medium">Title</span>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="e.g. Configure overtime rules" />
            {tried && !title.trim() && <span className="mt-1 block text-xs text-red-600">Enter a title.</span>}
          </label>
          <label className="block"><span className="mb-1 block font-medium">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inp} resize-none`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="mb-1 block font-medium">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={inp}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s][0]}</option>)}
              </select></label>
            <label><span className="mb-1 block font-medium">Due date</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inp} /></label>
            <label><span className="mb-1 block font-medium">Assignee</span>
              <select value={assigneeId} onChange={(e) => setAssignee(e.target.value)} className={inp}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select></label>
            <label><span className="mb-1 block font-medium">Reviewer</span>
              <select value={reviewerId} onChange={(e) => setReviewer(e.target.value)} className={inp}>
                <option value="">None</option>{users.filter((u) => u.id !== assigneeId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select></label>
          </div>
          <fieldset><legend className="mb-1 font-medium">Also involved</legend>
            <div className="flex flex-wrap gap-3">
              {users.filter((u) => u.id !== assigneeId).map((u) => (
                <label key={u.id} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={involved.includes(u.id)} onChange={(e) => setInvolved(e.target.checked ? [...involved, u.id] : involved.filter((x) => x !== u.id))} />
                  {u.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
          {task ? <button type="button" onClick={() => { deleteTask(o.id, task.id); onClose(); }} className="text-sm font-medium text-red-600 hover:underline">Delete</button> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" className="rounded-md bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-600">{task ? 'Save' : 'Create task'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
