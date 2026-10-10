import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { TimeEntry } from '../../types';
import { CATEGORY_STYLES } from './constants';
import { formatDuration, formatHours } from './duration';
import { dayLabel } from './dates';
import { projectName, workRefLabel } from './lookups';

interface Props {
  entries: TimeEntry[]; // already filtered to the visible month
  onEdit: (e: TimeEntry) => void;
}

export default function ListView({ entries, onEdit }: Props) {
  const days = useMemo(() => {
    const byDay = new Map<string, TimeEntry[]>();
    for (const e of entries) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
    return [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [entries]);

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-500">
        No time logged this month.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.map(([date, items]) => {
        const total = items.reduce((s, e) => s + e.minutes, 0);
        return (
          <section key={date} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
              <h3 className="text-sm font-semibold text-slate-700">{dayLabel(date)}</h3>
              <span className="text-sm tabular-nums text-slate-500">{formatHours(total)} h</span>
            </header>
            <ul className="divide-y divide-slate-100">
              {items.map((e) => {
                const proj = projectName(e.projectId);
                const ref = workRefLabel(e.projectId, e.workRef);
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => onEdit(e)}
                      className="grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-4 px-4 py-3 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-semibold tabular-nums">{formatDuration(e.minutes)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{e.activity ?? 'No activity'}</span>
                        <span className="flex min-w-0 items-center gap-1 truncate text-xs text-slate-500">
                          {proj ? (
                            <>
                              <span className="truncate">{proj}</span>
                              {ref && (
                                <>
                                  <ChevronRight size={12} className="shrink-0" />
                                  <span className="truncate">{ref}</span>
                                </>
                              )}
                            </>
                          ) : (
                            <span>No project</span>
                          )}
                          {e.description && <span className="truncate text-slate-400"> · {e.description}</span>}
                        </span>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_STYLES[e.category].chip}`}>
                        {e.category}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
