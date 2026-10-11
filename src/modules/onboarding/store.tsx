// oxlint-disable react/only-export-components
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CURRENT_USER_ID, users } from '../../data/mock';
import { useConnectors } from '../connectors/store';
import { mentionedUserIds } from '../connectors/mentions';
import { TASK_STATUS_META, fmt, onboardings as seed, type ConfigTask, type Onboarding } from './data';

const KEY = 'success.onboarding.tasks.v1';
type Overrides = Record<string, ConfigTask[]>; // only edited projects are persisted; the rest come from seed

interface Store {
  onboardings: Onboarding[];
  saveTask: (onboardingId: string, task: ConfigTask) => void;
  deleteTask: (onboardingId: string, taskId: string) => void;
  nextKey: (o: Onboarding) => string;
}
const Ctx = createContext<Store | null>(null);

function load(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Overrides;
  } catch {
    return {};
  }
}

const nameOf = (id?: string) => users.find((u) => u.id === id)?.name ?? 'Unassigned';

/** Turn a task edit into notification events. Creation (no previous version) is not notified. */
function emitChanges(notify: ReturnType<typeof useConnectors>['notify'], o: Onboarding, prev: ConfigTask, next: ConfigTask) {
  const base = { customer: o.customer, taskKey: next.key, taskTitle: next.title, path: `/onboarding/${o.id}/tasks/${next.id}`, actorId: CURRENT_USER_ID };
  const others = (ids: (string | undefined)[]) => [...new Set(ids.filter((x): x is string => !!x))].filter((x) => x !== CURRENT_USER_ID);
  const people = others([next.assigneeId, next.reviewerId, ...next.involved]);

  if (prev.status !== next.status) notify({ ...base, kind: 'status', recipients: people, detail: `${TASK_STATUS_META[prev.status][0]} → ${TASK_STATUS_META[next.status][0]}` });
  if (prev.assigneeId !== next.assigneeId)
    notify({ ...base, kind: 'assignee', recipients: others([next.assigneeId, prev.assigneeId, next.reviewerId, ...next.involved]), detail: `${nameOf(prev.assigneeId)} → ${nameOf(next.assigneeId)}` });
  if (prev.due !== next.due) notify({ ...base, kind: 'due', recipients: people, detail: `${fmt(prev.due, true)} → ${fmt(next.due, true)}` });

  for (const c of (next.comments ?? []).slice((prev.comments ?? []).length)) {
    const tagged = others(mentionedUserIds(c.text));
    const rest = people.filter((x) => !tagged.includes(x));
    const quote = `"${c.text.length > 160 ? `${c.text.slice(0, 160)}…` : c.text}"`;
    if (tagged.length) notify({ ...base, kind: 'mention', recipients: tagged, detail: quote });
    if (!tagged.length || rest.length) notify({ ...base, kind: 'comment', recipients: rest, detail: quote });
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [over, setOver] = useState<Overrides>(load);
  const { notify } = useConnectors();
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(over));
    } catch {
      /* ignore */
    }
  }, [over]);

  const store = useMemo<Store>(() => {
    const onboardings = seed.map((o) => ({ ...o, configTasks: over[o.id] ?? o.configTasks }));
    const edit = (id: string, fn: (t: ConfigTask[]) => ConfigTask[]) =>
      setOver((prev) => ({ ...prev, [id]: fn(prev[id] ?? seed.find((o) => o.id === id)!.configTasks) }));
    return {
      onboardings,
      saveTask: (id, task) => {
        const o = onboardings.find((x) => x.id === id);
        const prev = o?.configTasks.find((t) => t.id === task.id);
        edit(id, (ts) => (ts.some((t) => t.id === task.id) ? ts.map((t) => (t.id === task.id ? task : t)) : [...ts, task]));
        if (o && prev) emitChanges(notify, o, prev, task);
      },
      deleteTask: (id, taskId) => edit(id, (ts) => ts.filter((t) => t.id !== taskId)),
      nextKey: (o) => {
        const prefix = o.configTasks[0]?.key.split('-')[0] ?? o.customer.split(' ').map((w) => w[0]).join('').toUpperCase();
        const max = Math.max(0, ...o.configTasks.map((t) => Number(t.key.split('-')[1]) || 0));
        return `${prefix}-${max + 1}`;
      },
    };
  }, [over, notify]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useOnboardings() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOnboardings must be used inside OnboardingProvider');
  return c;
}
