// Fictional onboarding data. Dates are relative to today so the demo always looks current.
import { fromISODate, toISODate, todayISO } from '../time/dates';

export const STAGES = ['Kickoff', 'Discovery', 'Configuration', 'QA / UAT', 'Go-Live', 'Hypercare'] as const;
export type StageName = (typeof STAGES)[number];
export type Health = 'on_track' | 'at_risk' | 'off_track';
export type OStatus = 'active' | 'on_hold';
export type QAStatus = 'not_started' | 'in_progress' | 'needs_attention' | 'passed';
export type StepStatus = 'todo' | 'in_progress' | 'done' | 'failed';

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
  configTasks: Step[];
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
  const configTasks: Step[] = CONFIG.map((title, i) => ({
    id: `${id}c${i}`, title, assigneeId: OWNERS[(i + n) % 3], due: addDays(start, Math.round(((i + 1) / CONFIG.length) * span)),
    status: i < done ? 'done' : i === done && stage !== 'Kickoff' ? 'in_progress' : 'todo',
  }));
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
export const progress = (o: Onboarding) => Math.round((o.configTasks.filter((t) => t.status === 'done').length / o.configTasks.length) * 100);
export const needsAttention = (o: Onboarding) => o.status === 'active' && o.health !== 'on_track';
export const qaAttention = (o: Onboarding) => o.status === 'active' && o.qa === 'needs_attention';
export const goesLiveSoon = (o: Onboarding) => o.status === 'active' && daysBetween(today, o.goLive) >= 0 && daysBetween(today, o.goLive) <= 30;
