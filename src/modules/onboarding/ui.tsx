// oxlint-disable react/only-export-components
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Health, QAStatus, StepStatus } from './data';

/** Tab bar backed by ?tab= so views are linkable. Returns the active tab key. */
export function useTab(keys: string[]) {
  const [params, setParams] = useSearchParams();
  const t = params.get('tab');
  const active = t && keys.includes(t) ? t : keys[0];
  const set = (k: string) => setParams({ tab: k }, { replace: true });
  return [active, set] as const;
}

/** Page filters kept in the URL, so Back and shared links restore them. Values equal to the default are left out. */
export function useQuery<K extends string>(defaults: Record<K, string>) {
  const [params, setParams] = useSearchParams();
  const q = Object.fromEntries(Object.entries<string>(defaults).map(([k, d]) => [k, params.get(k) ?? d])) as Record<K, string>;
  const set = (patch: Partial<Record<K, string>>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries<string | undefined>(patch)) {
      if (v === undefined || v === defaults[k as K]) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  return [q, set] as const;
}

/** Returns value if it is one of the allowed keys, otherwise the fallback (guards against hand-edited URLs). */
export const oneOf = <T extends string>(value: string, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);

export function Tabs({ tabs, active, onChange }: { tabs: [string, string][]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
            active === k ? 'border-brand-500 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const HEALTH: Record<Health, [string, string, string]> = {
  on_track: ['On track', 'bg-emerald-50 text-emerald-700 ring-emerald-200', 'bg-emerald-500'],
  at_risk: ['At risk', 'bg-amber-50 text-amber-800 ring-amber-200', 'bg-amber-500'],
  off_track: ['Off track', 'bg-red-50 text-red-700 ring-red-200', 'bg-red-500'],
};
export const healthDot = (h: Health) => HEALTH[h][2];

const pill = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset';
export const HealthChip = ({ h }: { h: Health }) => <span className={`${pill} ${HEALTH[h][1]}`}>{HEALTH[h][0]}</span>;

const QA_STYLE: Record<QAStatus, [string, string]> = {
  not_started: ['Not started', 'bg-slate-100 text-slate-600 ring-slate-200'],
  in_progress: ['In progress', 'bg-blue-50 text-blue-700 ring-blue-200'],
  needs_attention: ['Needs attention', 'bg-red-50 text-red-700 ring-red-200'],
  passed: ['Passed', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
};
export const QAChip = ({ q }: { q: QAStatus }) => <span className={`${pill} ${QA_STYLE[q][1]}`}>{QA_STYLE[q][0]}</span>;

const STEP: Record<StepStatus, [string, string]> = {
  todo: ['To do', 'bg-slate-100 text-slate-600 ring-slate-200'],
  in_progress: ['In progress', 'bg-blue-50 text-blue-700 ring-blue-200'],
  done: ['Done', 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  failed: ['Failed', 'bg-red-50 text-red-700 ring-red-200'],
};
export const StepChip = ({ s }: { s: StepStatus }) => <span className={`${pill} ${STEP[s][1]}`}>{STEP[s][0]}</span>;

export const Progress = ({ pct }: { pct: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
    </div>
    <span className="text-xs tabular-nums text-slate-500">{pct}%</span>
  </div>
);

export const Card = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
    {title && <h3 className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">{title}</h3>}
    <div className="p-4">{children}</div>
  </section>
);
