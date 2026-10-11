// Fictional onboarding data. Dates are relative to today so the demo always looks current.
import { fromISODate, toISODate, todayISO } from '../time/dates';

export const STAGES = ['Kickoff', 'Discovery', 'Configuration', 'QA / UAT', 'Go-Live', 'Hypercare'] as const;
export type StageName = (typeof STAGES)[number];
export type Health = 'on_track' | 'at_risk' | 'off_track';
export type OStatus = 'active' | 'on_hold';
export type QAStatus = 'not_started' | 'in_progress' | 'needs_attention' | 'passed';
export type StepStatus = 'todo' | 'in_progress' | 'done' | 'failed';

export const TASK_STATUSES = ['triage', 'todo', 'in_progress', 'peer_review', 'peer_review_passed', 'needs_attention', 'deployed', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
/** label, badge classes */
export const TASK_STATUS_META: Record<TaskStatus, [string, string]> = {
  triage: ['Triage', 'bg-slate-100 text-slate-700'],
  todo: ['To Do', 'bg-slate-100 text-slate-700'],
  in_progress: ['In Progress', 'bg-blue-50 text-blue-700'],
  peer_review: ['Peer Review', 'bg-violet-50 text-violet-700'],
  peer_review_passed: ['Peer Review Passed', 'bg-indigo-50 text-indigo-700'],
  needs_attention: ['Needs Attention', 'bg-red-50 text-red-700'],
  deployed: ['Deployed to Production', 'bg-teal-50 text-teal-700'],
  done: ['Done', 'bg-emerald-50 text-emerald-700'],
};
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const PRIORITY_META: Record<TaskPriority, [string, string]> = {
  low: ['Low', 'bg-slate-400'], medium: ['Medium', 'bg-blue-500'], high: ['High', 'bg-amber-500'], urgent: ['Urgent', 'bg-red-500'],
};
export interface TaskComment { id: string; authorId: string; at: string; text: string }
export const isComplete = (s: TaskStatus) => s === 'done' || s === 'deployed';

export interface ConfigTask {
  id: string; key: string; title: string; description: string; status: TaskStatus;
  assigneeId: string; reviewerId?: string; involved: string[]; due: string;
  priority: TaskPriority; comments: TaskComment[];
}

export interface Step { id: string; title: string; status: StepStatus; assigneeId: string; due: string }
export interface Contact { name: string; title: string; email: string; canApprove: boolean }
export interface Onboarding {
  id: string;
  customer: string;
  projectId?: string; // link to a Time-module project
  product: string;
  scope: string[];
  outOfScope: string[];
  stage: StageName;
  status: OStatus;
  health: Health;
  healthNote: string;
  qa: QAStatus;
  ownerId: string;
  team: { userId: string; role: string }[];
  contacts: Contact[];
  facts: { label: string; value: string }[];
  start: string;
  goLive: string;
  configTasks: ConfigTask[];
  qaChecks: Step[];
}

export const today = todayISO();
export function addDays(iso: string, n: number) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
export function daysBetween(a: string, b: string) {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 864e5);
}
export function fmt(iso: string, year = false) {
  return fromISODate(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', ...(year ? { year: 'numeric' } : {}) });
}

const CONFIG = ['Account & company setup', 'Employee import', 'Pay rules & overtime', 'Shift & premium rules', 'Field forms', 'Approval workflows', 'Exports & integrations', 'Reports & dashboards'];
const DESC = [
  'Create the customer account, company profile and base settings.', 'Import the employee list and validate required fields.',
  'Build pay rules and overtime expressions from the signed-off spec.', 'Configure shift differentials and premium rules.',
  'Build field forms for daily tickets and safety checks.', 'Set up approval chains and notifications.',
  'Configure payroll exports and any third-party integrations.', 'Build the standard reports and dashboards.',
];
const QA = ['Payroll calculation parity', 'Timesheet approvals', 'Overtime rules', 'Exports reconcile', 'Roles & permissions'];
const PROGRESS = [0, 0.1, 0.5, 1, 1, 1];
const OWNERS = ['u1', 'u2', 'u3'];

function build(
  n: number, customer: string, stage: StageName, status: OStatus, health: Health, qa: QAStatus,
  startOff: number, goLiveOff: number, healthNote: string, extra: Partial<Onboarding> = {},
): Onboarding {
  const start = addDays(today, startOff);
  const goLive = addDays(today, goLiveOff);
  const span = Math.max(daysBetween(start, goLive) - 14, 10);
  const done = Math.floor(CONFIG.length * PROGRESS[STAGES.indexOf(stage)]);
  const id = `o${n}`;
  const abbr = customer.split(' ').map((w) => w[0]).join('').toUpperCase();
  const configTasks: ConfigTask[] = CONFIG.map((title, i) => {
    let status: TaskStatus = i < done ? (i === done - 1 && stage === 'Configuration' ? 'deployed' : 'done') : i === done && stage !== 'Kickoff' ? 'in_progress' : 'todo';
    if (stage === 'Configuration' && n % 2 === 1) {
      if (i === done) status = 'peer_review';
      if (i === done + 1) status = 'triage';
    }
    if (n === 2 && i === done) status = 'needs_attention';
    return {
      id: `${id}c${i}`, key: `${abbr}-${i + 1}`, title, description: DESC[i], status, assigneeId: OWNERS[(i + n) % 3],
      reviewerId: OWNERS[(i + n + 1) % 3], involved: [], due: addDays(start, Math.round(((i + 1) / CONFIG.length) * span)),
      priority: n === 2 && i === done ? 'urgent' : i % 4 === 0 ? 'high' : 'medium',
      comments: i === done && stage !== 'Kickoff' ? [
        { id: `${id}c${i}a`, authorId: OWNERS[(i + n) % 3], at: `${addDays(today, -2)}T09:30:00`, text: 'Started on this. Waiting on the final sign-off from the customer.' },
        { id: `${id}c${i}b`, authorId: OWNERS[(i + n + 1) % 3], at: `${addDays(today, -1)}T14:10:00`, text: 'Reviewed the draft. A couple of questions on edge cases, see the description.' },
      ] : [],
    };
  });
  const qaChecks: Step[] = QA.map((title, i) => ({
    id: `${id}q${i}`, title, assigneeId: OWNERS[(i + n) % 3], due: addDays(goLive, -10 + i),
    status: qa === 'passed' ? 'done' : qa === 'not_started' ? 'todo' : i < 2 ? 'done' : i === 2 && qa === 'needs_attention' ? 'failed' : 'todo',
  }));
  return {
    id, customer, product: 'Workforce Platform', stage, status, health, healthNote, qa, ownerId: OWNERS[n % 3],
    scope: ['Timesheets', 'Payroll rules', 'Field forms', 'Approvals'],
    outOfScope: ['Historical data migration beyond 12 months'],
    team: [{ userId: 'u1', role: 'Onboarding lead' }, { userId: 'u2', role: 'Implementation specialist' }, { userId: 'u3', role: 'Customer success manager' }],
    contacts: [
      { name: `${customer.split(' ')[0]} Payroll Lead`, title: 'Payroll Manager', email: `payroll@${customer.split(' ')[0].toLowerCase()}.example`, canApprove: true },
      { name: `${customer.split(' ')[0]} Operations`, title: 'Operations Manager', email: `ops@${customer.split(' ')[0].toLowerCase()}.example`, canApprove: false },
    ],
    facts: [
      { label: 'Employees', value: String(60 + n * 35) }, { label: 'Pay cycle', value: n % 2 ? 'Bi-weekly' : 'Semi-monthly' },
      { label: 'Locations', value: String(1 + (n % 4)) }, { label: 'Union', value: n % 3 ? 'No' : 'Yes' },
    ],
    start, goLive, configTasks, qaChecks, ...extra,
  };
}

export const onboardings: Onboarding[] = [
  build(1, 'Northwind Energy', 'Configuration', 'active', 'on_track', 'not_started', -40, 35, 'Config on schedule; waiting on final pay rule sign-off.', { projectId: 'p1' }),
  build(2, 'Ridgeline Services', 'Configuration', 'active', 'at_risk', 'in_progress', -25, 20, 'Employee list arrived late; 4 days behind plan.', { projectId: 'p2' }),
  build(3, 'Summit Civil', 'QA / UAT', 'active', 'on_track', 'in_progress', -70, 12, 'UAT underway with customer payroll team.'),
  build(4, 'Cedar Valley Contractors', 'Kickoff', 'active', 'on_track', 'not_started', -5, 75, 'Kickoff complete; discovery sessions booked.'),
  build(5, 'Harbour Mechanical', 'Discovery', 'active', 'off_track', 'not_started', -20, 45, 'Requirements still changing; scope review needed.'),
  build(6, 'Prairie Roofing', 'QA / UAT', 'active', 'at_risk', 'needs_attention', -60, 8, 'Overtime rule mismatch found in QA.'),
  build(7, 'Blue Peak Electric', 'Go-Live', 'active', 'on_track', 'passed', -90, 3, 'Cutover scheduled; all QA checks passed.'),
  build(8, 'Granite Ridge Builders', 'Configuration', 'on_hold', 'at_risk', 'not_started', -50, 90, 'Paused at customer request until Q1.'),
];

export const byId = (id?: string) => onboardings.find((o) => o.id === id);
export const progress = (o: Onboarding) => Math.round((o.configTasks.filter((t) => isComplete(t.status)).length / Math.max(o.configTasks.length, 1)) * 100);
export const needsAttention = (o: Onboarding) => o.status === 'active' && (o.health !== 'on_track' || o.configTasks.some((t) => t.status === 'needs_attention'));
export const qaAttention = (o: Onboarding) => o.status === 'active' && o.qa === 'needs_attention';
export const goesLiveSoon = (o: Onboarding) => o.status === 'active' && daysBetween(today, o.goLive) >= 0 && daysBetween(today, o.goLive) <= 30;
