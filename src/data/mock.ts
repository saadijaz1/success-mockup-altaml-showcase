// Fictional seed data. No real customer or company data belongs in this repo.
import type { Project, Task, TimeEntry, User } from '../types';

export const CURRENT_USER_ID = 'u1';

export const users: User[] = [
  { id: 'u1', name: 'Alex Morgan', initials: 'AM', role: 'Onboarding Lead' },
  { id: 'u2', name: 'Priya Shah', initials: 'PS', role: 'Implementation Specialist' },
  { id: 'u3', name: 'Jordan Lee', initials: 'JL', role: 'Customer Success Manager' },
];

export const projects: Project[] = [
  {
    id: 'p1', name: 'Northwind Energy', customer: 'Northwind Energy', type: 'Onboarding',
    ownerId: 'u1', startDate: '2026-09-01', targetDate: '2026-11-10',
    stages: [
      { id: 'p1s1', name: 'Kickoff & Discovery' },
      { id: 'p1s2', name: 'Configuration' },
      { id: 'p1s3', name: 'Testing & UAT' },
      { id: 'p1s4', name: 'Go-Live' },
    ],
  },
  {
    id: 'p2', name: 'Ridgeline Services', customer: 'Ridgeline Services', type: 'Onboarding',
    ownerId: 'u1', startDate: '2026-09-15', targetDate: '2026-12-01',
    stages: [
      { id: 'p2s1', name: 'Kickoff & Discovery' },
      { id: 'p2s2', name: 'Configuration' },
      { id: 'p2s3', name: 'Testing & UAT' },
    ],
  },
  {
    id: 'p3', name: 'Northwind Energy – Overtime Rules', customer: 'Northwind Energy', type: 'Change Orders',
    ownerId: 'u2', startDate: '2026-10-01', targetDate: '2026-10-31',
    stages: [
      { id: 'p3s1', name: 'Scoping' },
      { id: 'p3s2', name: 'Build' },
      { id: 'p3s3', name: 'Sign-off' },
    ],
  },
  {
    id: 'p4', name: 'Customer Support Queue', customer: 'All customers', type: 'Support',
    ownerId: 'u3', startDate: '2026-01-01', targetDate: '2026-12-31',
    stages: [
      { id: 'p4s1', name: 'Triage' },
      { id: 'p4s2', name: 'Resolution' },
    ],
  },
];

export const tasks: Task[] = [
  { id: 't1', projectId: 'p1', stageId: 'p1s1', title: 'Kickoff call', status: 'done', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-03' },
  { id: 't2', projectId: 'p1', stageId: 'p1s1', title: 'Requirements workbook', status: 'done', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-12' },
  { id: 't3', projectId: 'p1', stageId: 'p1s2', title: 'Configure payroll rules', status: 'in_progress', priority: 'urgent', assigneeId: 'u1', dueDate: '2026-10-15' },
  { id: 't4', projectId: 'p1', stageId: 'p1s2', title: 'Build field forms', status: 'in_progress', priority: 'high', assigneeId: 'u2', dueDate: '2026-10-20' },
  { id: 't5', projectId: 'p1', stageId: 'p1s3', title: 'User acceptance testing', status: 'todo', priority: 'medium', assigneeId: 'u3', dueDate: '2026-10-28' },
  { id: 't6', projectId: 'p2', stageId: 'p2s1', title: 'Kickoff call', status: 'done', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-17' },
  { id: 't7', projectId: 'p2', stageId: 'p2s2', title: 'Import employee list', status: 'review', priority: 'medium', assigneeId: 'u2', dueDate: '2026-10-12' },
  { id: 't8', projectId: 'p2', stageId: 'p2s2', title: 'Approval workflow setup', status: 'todo', priority: 'medium', assigneeId: 'u1', dueDate: '2026-10-24' },
  { id: 't9', projectId: 'p3', stageId: 'p3s1', title: 'Confirm overtime thresholds', status: 'done', priority: 'high', assigneeId: 'u1', dueDate: '2026-10-05' },
  { id: 't10', projectId: 'p3', stageId: 'p3s2', title: 'Update overtime expressions', status: 'in_progress', priority: 'high', assigneeId: 'u1', dueDate: '2026-10-16' },
];

// ---------- Time entries ----------
// Generated deterministically so the calendar looks lived-in without a long literal list.

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

type Template = Omit<TimeEntry, 'id' | 'userId' | 'date' | 'minutes'>;

const templates: Template[] = [
  { activity: 'Client Meetings / Communication', category: 'OPEX', projectType: 'Onboarding', projectId: 'p1', workRef: { kind: 'none' }, description: 'Weekly status call' },
  { activity: 'Configuration', category: 'OPEX', projectType: 'Onboarding', projectId: 'p1', workRef: { kind: 'task', id: 't3' }, description: 'Overtime and shift premium rules' },
  { activity: 'Configuration', category: 'OPEX', projectType: 'Onboarding', projectId: 'p2', workRef: { kind: 'stage', id: 'p2s2' } },
  { activity: 'Client Delivery – Project setup and planning', category: 'OPEX', projectType: 'Onboarding', projectId: 'p2', workRef: { kind: 'stage', id: 'p2s1' }, description: 'Project plan and timeline' },
  { activity: 'Documentation', category: 'OPEX', projectType: 'Onboarding', projectId: 'p1', workRef: { kind: 'task', id: 't2' } },
  { activity: 'Peer Review', category: 'OPEX', projectType: 'Onboarding', projectId: 'p2', workRef: { kind: 'task', id: 't7' } },
  { activity: 'Client Investigation', category: 'OPEX', projectType: 'Support', projectId: 'p4', workRef: { kind: 'stage', id: 'p4s1' }, description: 'Timesheet export issue' },
  { activity: 'Client Follow-Up', category: 'OPEX', projectType: 'Support', projectId: 'p4', workRef: { kind: 'stage', id: 'p4s2' } },
  { activity: 'Process Improvement / Maintenance', category: 'CAPEX', projectType: 'Onboarding', projectId: 'p1', workRef: { kind: 'none' }, description: 'Reusable onboarding template' },
  { activity: 'General Admin', category: 'G&A', workRef: { kind: 'none' }, description: 'Email and planning' },
  { activity: 'Cross-Team Collaboration', category: 'OPEX', projectType: 'Change Orders', projectId: 'p3', workRef: { kind: 'stage', id: 'p3s1' } },
  { activity: 'Configuration', category: 'OPEX', projectType: 'Change Orders', projectId: 'p3', workRef: { kind: 'task', id: 't10' } },
];

const DURATIONS = [30, 45, 60, 90, 120, 150, 180];

function buildEntries(): TimeEntry[] {
  const rand = seededRandom(42);
  const out: TimeEntry[] = [];
  const start = new Date(2026, 8, 1); // Sep 1, 2026
  const end = new Date(2026, 9, 9); // Oct 9, 2026
  let n = 0;
  const pto: Record<string, string> = {
    '2026-09-07': 'Stat Holiday',
    '2026-09-25': 'Vacation',
    '2026-09-30': 'Flex Day',
  };

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (pto[date]) {
      out.push({ id: `e${++n}`, userId: CURRENT_USER_ID, date, minutes: 480, activity: pto[date], category: 'PTO', workRef: { kind: 'none' } });
      continue;
    }

    // Mostly full 8h days; a couple of deliberately short days show the under-target state.
    const short: Record<string, number> = { '2026-09-18': 390, '2026-10-07': 360 };
    let remaining = short[date] ?? 480 + (rand() < 0.3 ? 30 : 0);
    const usable = templates.filter((t) => !t.projectId || t.projectId !== 'p3' || date >= '2026-10-01')
      .filter((t) => !t.projectId || t.projectId !== 'p2' || date >= '2026-09-15');
    while (remaining > 0) {
      const t = usable[Math.floor(rand() * usable.length)];
      const minutes = Math.min(remaining, DURATIONS[Math.floor(rand() * DURATIONS.length)]);
      out.push({ id: `e${++n}`, userId: CURRENT_USER_ID, date, minutes, ...t });
      remaining -= minutes;
    }
  }
  return out;
}

export const seedTimeEntries: TimeEntry[] = buildEntries();
