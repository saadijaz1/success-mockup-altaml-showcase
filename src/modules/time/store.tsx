import { useEffect, useState, type ReactNode } from 'react';
import type { TimeEntry } from '../../types';
import { seedTimeEntries } from '../../data/mock';
import { TimeContext, type TimeStore } from './context';

const STORAGE_KEY = 'success.time.entries.v1';

function load(): TimeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TimeEntry[];
  } catch {
    /* storage unavailable — fall back to seed */
  }
  return seedTimeEntries;
}

export function TimeProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TimeEntry[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries]);

  const store: TimeStore = {
    entries,
    addEntry: (e) => setEntries((prev) => [...prev, { ...e, id: crypto.randomUUID() }]),
    updateEntry: (e) => setEntries((prev) => prev.map((x) => (x.id === e.id ? e : x))),
    deleteEntry: (id) => setEntries((prev) => prev.filter((x) => x.id !== id)),
    resetEntries: () => setEntries(seedTimeEntries),
  };

  return <TimeContext.Provider value={store}>{children}</TimeContext.Provider>;
}
