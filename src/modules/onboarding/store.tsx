// oxlint-disable react/only-export-components
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onboardings as seed, type ConfigTask, type Onboarding } from './data';

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

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [over, setOver] = useState<Overrides>(load);
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
      saveTask: (id, task) => edit(id, (ts) => (ts.some((t) => t.id === task.id) ? ts.map((t) => (t.id === task.id ? task : t)) : [...ts, task])),
      deleteTask: (id, taskId) => edit(id, (ts) => ts.filter((t) => t.id !== taskId)),
      nextKey: (o) => {
        const prefix = o.configTasks[0]?.key.split('-')[0] ?? o.customer.split(' ').map((w) => w[0]).join('').toUpperCase();
        const max = Math.max(0, ...o.configTasks.map((t) => Number(t.key.split('-')[1]) || 0));
        return `${prefix}-${max + 1}`;
      },
    };
  }, [over]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useOnboardings() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOnboardings must be used inside OnboardingProvider');
  return c;
}
