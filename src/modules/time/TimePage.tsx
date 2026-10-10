import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus } from 'lucide-react';
import type { TimeEntry } from '../../types';
import { CURRENT_USER_ID } from '../../data/mock';
import { CATEGORIES, CATEGORY_STYLES, TARGET_DAY_MINUTES } from './constants';
import { formatHours } from './duration';
import { addMonths, currentMonthStart, fromISODate, isWeekend, monthGrid, monthKey, monthLabel, toISODate, todayISO } from './dates';
import { useTime } from './context';
import ListView from './ListView';
import CalendarView from './CalendarView';
import LogTimeDialog from './LogTimeDialog';

type View = 'list' | 'calendar';

export default function TimePage() {
  const { entries } = useTime();
  const [params, setParams] = useSearchParams();

  const view: View = params.get('view') === 'calendar' ? 'calendar' : 'list';
  const monthParam = params.get('month');
  const month = useMemo(() => (monthParam ? fromISODate(`${monthParam}-01`) : currentMonthStart()), [monthParam]);

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [dialog, setDialog] = useState<{ open: boolean; key: number; entry?: TimeEntry; date?: string }>({ open: false, key: 0 });

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  }

  function goToMonth(d: Date) {
    setParam('month', monthKey(d));
    const isCurrent = monthKey(d) === monthKey(new Date());
    setSelectedDate(isCurrent ? todayISO() : toISODate(d));
  }

  const mine = useMemo(() => entries.filter((e) => e.userId === CURRENT_USER_ID), [entries]);
  const key = monthKey(month);
  const monthEntries = useMemo(() => mine.filter((e) => e.date.startsWith(key)), [mine, key]);

  const stats = useMemo(() => {
    const total = monthEntries.reduce((s, e) => s + e.minutes, 0);
    const today = todayISO();
    const workdays = monthGrid(month).filter(
      (d) => d.getMonth() === month.getMonth() && !isWeekend(d) && toISODate(d) <= today,
    ).length;
    const byCat = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<string, number>;
    for (const e of monthEntries) byCat[e.category] += e.minutes;
    return { total, expected: workdays * TARGET_DAY_MINUTES, byCat };
  }, [monthEntries, month]);

  const openNew = (date?: string) =>
    setDialog((d) => ({ open: true, key: d.key + 1, date: date ?? (view === 'calendar' ? selectedDate : undefined) }));
  const openEdit = (entry: TimeEntry) => setDialog((d) => ({ open: true, key: d.key + 1, entry }));
  const closeDialog = useCallback(() => setDialog((d) => ({ ...d, open: false })), []);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Time</h1>
          <p className="text-sm text-slate-500">Log and review your hours by project, task and category.</p>
        </div>
        <button
          onClick={() => openNew()}
          className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
        >
          <Plus size={16} /> Log time
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-slate-200 bg-white">
            <button onClick={() => goToMonth(addMonths(month, -1))} className="p-2 text-slate-500 hover:bg-slate-50" aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => goToMonth(addMonths(month, 1))} className="border-l border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
          <h2 className="min-w-40 text-base font-semibold">{monthLabel(month)}</h2>
          <button
            onClick={() => goToMonth(currentMonthStart())}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
        </div>

        <div className="flex rounded-lg bg-slate-200/70 p-0.5">
          {([
            ['list', 'List', List],
            ['calendar', 'Calendar', CalendarDays],
          ] as const).map(([v, label, Icon]) => (
            <button
              key={v}
              onClick={() => setParam('view', v)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-[repeat(2,minmax(0,12rem))_1fr]">
        <Stat label="Logged this month" value={`${formatHours(stats.total)} h`} />
        <Stat
          label="Expected to date"
          value={`${formatHours(stats.expected)} h`}
          sub={stats.expected ? `${Math.round((stats.total / stats.expected) * 100)}% logged` : undefined}
        />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">By category</div>
          <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-slate-100">
            {CATEGORIES.filter((c) => stats.byCat[c]).map((c) => (
              <div key={c} className={CATEGORY_STYLES[c].dot} style={{ width: `${(stats.byCat[c] / stats.total) * 100}%` }} />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {CATEGORIES.map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[c].dot}`} />
                {c} <span className="tabular-nums text-slate-400">{formatHours(stats.byCat[c])}h</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <ListView entries={monthEntries} onEdit={openEdit} />
      ) : (
        <CalendarView
          month={month}
          entries={mine}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEdit={openEdit}
          onLog={(d) => openNew(d)}
        />
      )}

      {dialog.open && (
        <LogTimeDialog key={dialog.key} entry={dialog.entry} defaultDate={dialog.date} onClose={closeDialog} />
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
