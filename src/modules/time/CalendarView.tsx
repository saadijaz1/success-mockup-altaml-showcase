import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Category, TimeEntry } from '../../types';
import { CATEGORIES, CATEGORY_STYLES, TARGET_DAY_MINUTES } from './constants';
import { formatDuration, formatHours } from './duration';
import { dayLabel, isWeekend, monthGrid, toISODate, todayISO } from './dates';
import { projectName } from './lookups';

interface Props {
  month: Date;
  entries: TimeEntry[]; // all entries; grid may show adjacent-month days
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onEdit: (e: TimeEntry) => void;
  onLog: (iso: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ month, entries, selectedDate, onSelectDate, onEdit, onLog }: Props) {
  const byDay = useMemo(() => {
    const m = new Map<string, TimeEntry[]>();
    for (const e of entries) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [entries]);

  const grid = monthGrid(month);
  const today = todayISO();
  const selected = byDay.get(selectedDate) ?? [];
  const selectedTotal = selected.reduce((s, e) => s + e.minutes, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const iso = toISODate(d);
            const inMonth = d.getMonth() === month.getMonth();
            const items = byDay.get(iso) ?? [];
            const total = items.reduce((s, e) => s + e.minutes, 0);
            const byCat = categoryTotals(items);
            const isSel = iso === selectedDate;
            const isToday = iso === today;
            const under = inMonth && !isWeekend(d) && iso < today && total < TARGET_DAY_MINUTES;

            return (
              <button
                key={iso}
                onClick={() => onSelectDate(iso)}
                onDoubleClick={() => onLog(iso)}
                className={`group relative flex h-24 flex-col border-slate-100 p-1.5 text-left transition-colors sm:h-28 sm:p-2 ${
                  i % 7 !== 6 ? 'border-r' : ''
                } ${i < grid.length - 7 ? 'border-b' : ''} ${inMonth ? (isWeekend(d) ? 'bg-slate-50/60' : 'bg-white') : 'bg-slate-50 text-slate-400'} ${
                  isSel ? 'ring-2 ring-inset ring-brand-500' : 'hover:bg-brand-50/40'
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-medium ${
                    isToday ? 'bg-brand-500 text-white' : inMonth ? 'text-slate-700' : ''
                  }`}
                >
                  {d.getDate()}
                </span>

                {total > 0 && (
                  <div className="mt-auto space-y-1">
                    <div className={`text-sm font-semibold tabular-nums ${under ? 'text-amber-600' : inMonth ? 'text-slate-800' : ''}`}>
                      {formatHours(total)}
                      <span className="ml-0.5 text-xs font-normal text-slate-400">h</span>
                    </div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                      {CATEGORIES.filter((c) => byCat[c]).map((c) => (
                        <div
                          key={c}
                          className={CATEGORY_STYLES[c].dot}
                          style={{ width: `${(byCat[c] / Math.max(total, TARGET_DAY_MINUTES)) * 100}%` }}
                          title={`${c}: ${formatDuration(byCat[c])}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {total === 0 && inMonth && !isWeekend(d) && iso < today && (
                  <span className="mt-auto text-xs text-amber-600">Missing</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      <aside className="h-fit rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">{dayLabel(selectedDate)}</div>
            <div className="text-xs text-slate-500">{formatHours(selectedTotal)} h logged</div>
          </div>
          <button
            onClick={() => onLog(selectedDate)}
            className="flex items-center gap-1 rounded-md bg-brand-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
          >
            <Plus size={14} /> Log
          </button>
        </div>
        {selected.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing logged.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {selected.map((e) => (
              <li key={e.id}>
                <button onClick={() => onEdit(e)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${CATEGORY_STYLES[e.category].dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.activity ?? 'No activity'}</span>
                    <span className="block truncate text-xs text-slate-500">{projectName(e.projectId) ?? e.category}</span>
                  </span>
                  <span className="text-sm tabular-nums text-slate-600">{formatDuration(e.minutes)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function categoryTotals(items: TimeEntry[]): Record<Category, number> {
  const t = { OPEX: 0, 'G&A': 0, CAPEX: 0, COGS: 0, PTO: 0 } as Record<Category, number>;
  for (const e of items) t[e.category] += e.minutes;
  return t;
}
