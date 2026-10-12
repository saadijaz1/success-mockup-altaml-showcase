import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { users } from '../../data/mock';
import { PRIORITY_META, TASK_STATUSES, TASK_STATUS_META, addDays, fmt, isComplete, today, type Onboarding, type TaskStatus } from './data';
import { useOnboardings } from './store';

const initials = (id?: string) => users.find((u) => u.id === id)?.initials ?? '–';

export default function ConfigTasks({ o }: { o: Onboarding }) {
  const { saveTask, nextKey } = useOnboardings();
  const nav = useNavigate();

  function newTask() {
    const id = crypto.randomUUID();
    saveTask(o.id, {
      id, key: nextKey(o), title: '', description: '', status: 'triage', assigneeId: users[0].id, involved: [],
      due: addDays(today, 7), priority: 'medium', comments: [],
    });
    nav(`/onboarding/${o.id}/tasks/${id}`);
  }

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button onClick={newTask} className="flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600">
          <Plus size={13} /> New task
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="pb-1.5">Key</th><th>Task</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Reviewer</th><th>Due</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {o.configTasks.map((t) => {
              const pr = PRIORITY_META[t.priority ?? 'medium'];
              return (
                <tr key={t.id}>
                  <td className="py-2 pr-2 font-mono text-xs text-slate-500">{t.key}</td>
                  <td className="pr-3">
                    <Link to={`/onboarding/${o.id}/tasks/${t.id}`} className="font-medium hover:text-brand-600">{t.title || 'Untitled task'}</Link>
                    {(t.comments?.length ?? 0) > 0 && <span className="ml-2 text-xs text-slate-400">{t.comments.length} 💬</span>}
                  </td>
                  <td className="pr-3"><span className="flex items-center gap-1.5 text-xs text-slate-600"><span className={`h-2 w-2 rounded-full ${pr[1]}`} />{pr[0]}</span></td>
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
                  <td className={`whitespace-nowrap ${t.due < today && !isComplete(t.status) ? 'font-medium text-red-600' : 'text-slate-500'}`}>{fmt(t.due)}</td>
                </tr>
              );
            })}
            {o.configTasks.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">No tasks yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
