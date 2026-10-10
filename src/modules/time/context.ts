import { createContext, useContext } from 'react';
import type { TimeEntry } from '../../types';

export interface TimeStore {
  entries: TimeEntry[];
  addEntry: (e: Omit<TimeEntry, 'id'>) => void;
  updateEntry: (e: TimeEntry) => void;
  deleteEntry: (id: string) => void;
  resetEntries: () => void;
}

export const TimeContext = createContext<TimeStore | null>(null);

export function useTime() {
  const ctx = useContext(TimeContext);
  if (!ctx) throw new Error('useTime must be used inside TimeProvider');
  return ctx;
}
