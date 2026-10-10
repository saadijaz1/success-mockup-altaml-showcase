import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Category, ProjectType, TimeEntry, WorkRef } from '../../types';
import { CURRENT_USER_ID, projects, tasks } from '../../data/mock';
import {
  ACTIVITIES, CATEGORIES, DURATION_PRESETS, PROJECT_REQUIRED, PROJECT_TYPES, PTO_ACTIVITIES,
} from './constants';
import { formatDuration, parseDuration } from './duration';
import { todayISO } from './dates';
import { useTime } from './context';

interface Props {
  onClose: () => void;
  /** Entry to edit; omit to create a new one. */
  entry?: TimeEntry;
  /** Pre-filled date for new entries (e.g. clicked calendar day). */
  defaultDate?: string;
}

function encodeRef(ref: WorkRef): string {
  return ref.kind === 'none' ? '' : `${ref.kind}:${ref.id}`;
}
function decodeRef(v: string): WorkRef {
  if (!v) return { kind: 'none' };
  const [kind, id] = v.split(':');
  return kind === 'stage' ? { kind: 'stage', id } : { kind: 'task', id };
}

/** Mounted only while open; the parent keys it so each open starts from fresh state. */
export default function LogTimeDialog({ onClose, entry, defaultDate }: Props) {
  const { addEntry, updateEntry, deleteEntry } = useTime();

  const [date, setDate] = useState(entry?.date ?? defaultDate ?? todayISO());
  const [durationText, setDurationText] = useState(entry ? formatDuration(entry.minutes).replace(' ', '') : '');
  const [activity, setActivity] = useState(entry?.activity ?? '');
  const [category, setCategory] = useState<Category>(entry?.category ?? 'OPEX');
  const [projectType, setProjectType] = useState<ProjectType>(entry?.projectType ?? 'Onboarding');
  const [projectId, setProjectId] = useState(entry?.projectId ?? '');
  const [workRef, setWorkRef] = useState(entry ? encodeRef(entry.workRef) : '');
  const [description, setDescription] = useState(entry?.description ?? '');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const minutes = parseDuration(durationText);
  const isPTO = category === 'PTO';
  const projectRequired = PROJECT_REQUIRED.has(category);
  const availableProjects = useMemo(() => projects.filter((p) => p.type === projectType), [projectType]);
  const project = projects.find((p) => p.id === projectId);

  const errors = {
    date: !date ? 'Pick a date.' : null,
    duration: minutes === null ? 'Enter a duration like 1.5, 1:30 or 90m.' : null,
    project: projectRequired && !projectId ? 'Select a project.' : null,
  };
  const valid = !errors.date && !errors.duration && !errors.project;

  function onActivityChange(v: string) {
    setActivity(v);
    if (PTO_ACTIVITIES.has(v)) setCategory('PTO');
    else if (category === 'PTO') setCategory('OPEX');
  }

  function onProjectTypeChange(t: ProjectType) {
    setProjectType(t);
    setProjectId('');
    setWorkRef('');
  }

  function save(keepOpen: boolean) {
    setSubmitted(true);
    if (!valid || minutes === null) return;
    const data: Omit<TimeEntry, 'id'> = {
      userId: entry?.userId ?? CURRENT_USER_ID,
      date,
      minutes,
      activity: activity || undefined,
      category,
      projectType: isPTO ? undefined : projectType,
      projectId: isPTO ? undefined : projectId || undefined,
      workRef: isPTO || !projectId ? { kind: 'none' } : decodeRef(workRef),
      description: description.trim() || undefined,
    };
    if (entry) updateEntry({ ...data, id: entry.id });
    else addEntry(data);

    if (keepOpen && !entry) {
      // Keep date, category and project for quick consecutive entries.
      setDurationText('');
      setDescription('');
      setWorkRef('');
      setSubmitted(false);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-10" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-time-title"
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="log-time-title" className="text-base font-semibold">{entry ? 'Edit time entry' : 'Log time'}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form
          className="space-y-5 px-5 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" error={submitted ? errors.date : null}>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>

            <Field
              label="Duration"
              hint={minutes !== null ? `= ${formatDuration(minutes)}` : 'e.g. "1.5", "1:30", "90m"'}
              error={submitted || (durationText && minutes === null) ? errors.duration : null}
            >
              <input
                autoFocus
                value={durationText}
                onChange={(e) => setDurationText(e.target.value)}
                placeholder="1:30"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="-mt-2 flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDurationText(p.label)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                  minutes === p.minutes ? 'bg-brand-500 text-white ring-brand-500' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Field label="Activity" tag="Optional">
            <select value={activity} onChange={(e) => onActivityChange(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {ACTIVITIES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Field>

          <Field label="Category" group>
            <Segmented options={CATEGORIES} value={category} onChange={setCategory} />
          </Field>

          {isPTO ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">PTO entries aren't tied to a project.</p>
          ) : (
            <>
              <Field label="Project type" group>
                <Segmented options={PROJECT_TYPES} value={projectType} onChange={onProjectTypeChange} />
              </Field>

              <Field
                label="Project"
                tag={projectRequired ? 'Required' : 'Optional'}
                hint={category === 'OPEX' ? 'OPEX entries must be tied to a project, BU, or support project.' : undefined}
                error={submitted ? errors.project : null}
              >
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setWorkRef('');
                  }}
                  className={inputCls}
                >
                  <option value="">Select a project…</option>
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Task or stage" hint="Optional — pick a task, a whole stage (lump sum), or leave blank for project-level.">
                <select value={workRef} onChange={(e) => setWorkRef(e.target.value)} className={inputCls} disabled={!project}>
                  <option value="">{project ? 'Project-level (no task)' : 'Select a project first'}</option>
                  {project?.stages.map((s) => (
                    <optgroup key={s.id} label={s.name}>
                      <option value={`stage:${s.id}`}>Whole stage — lump sum</option>
                      {tasks
                        .filter((t) => t.stageId === s.id)
                        .map((t) => (
                          <option key={t.id} value={`task:${t.id}`}>{t.title}</option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </Field>
            </>
          )}

          <Field label="Description" tag="Optional">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What did you work on?"
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            {entry ? (
              <button
                type="button"
                onClick={() => {
                  deleteEntry(entry.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              {!entry && (
                <button
                  type="button"
                  onClick={() => save(true)}
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Save & add another
                </button>
              )}
              <button type="submit" className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                {entry ? 'Save changes' : 'Log time'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400';

function Field({
  label, tag, hint, error, group, children,
}: { label: string; tag?: string; hint?: string; error?: string | null; group?: boolean; children: ReactNode }) {
  // Button groups use a div: a <label> would forward clicks on its text to the first button.
  const Wrapper = group ? 'div' : 'label';
  return (
    <Wrapper className="block" {...(group ? { role: 'group', 'aria-label': label } : {})}>
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {tag && (
          <span className={`text-xs font-normal ${tag === 'Required' ? 'text-red-600' : 'text-slate-400'}`}>{tag}</span>
        )}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </Wrapper>
  );
}

function Segmented<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === o ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
