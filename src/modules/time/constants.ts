import type { Category, ProjectType } from '../../types';

export const ACTIVITIES = [
  'Client Meetings / Communication',
  'Documentation',
  'Client Delivery – Project setup and planning',
  'Client Follow-Up',
  'Client Investigation',
  'Task Management',
  'Configuration',
  'Peer Review',
  'Cross-Team Collaboration',
  'Management & Leadership',
  'General Admin',
  'Knowledge & Enablement',
  'Process Improvement / Maintenance',
  'Vacation',
  'Flex Day',
  'Stat Holiday',
  'Sick Day',
] as const;

/** Picking one of these activities sets the category to PTO. */
export const PTO_ACTIVITIES = new Set<string>(['Vacation', 'Flex Day', 'Stat Holiday', 'Sick Day']);

export const CATEGORIES: Category[] = ['OPEX', 'G&A', 'CAPEX', 'COGS', 'PTO'];

/** Categories where a project is mandatory. */
export const PROJECT_REQUIRED: Set<Category> = new Set(['OPEX', 'CAPEX', 'COGS']);

export const PROJECT_TYPES: ProjectType[] = ['Onboarding', 'Change Orders', 'Support'];

export const DURATION_PRESETS: { label: string; minutes: number }[] = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
];

export const CATEGORY_STYLES: Record<Category, { chip: string; dot: string }> = {
  OPEX: { chip: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  'G&A': { chip: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-500' },
  CAPEX: { chip: 'bg-violet-50 text-violet-700 ring-violet-200', dot: 'bg-violet-500' },
  COGS: { chip: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  PTO: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
};

/** Expected hours per working day, used for the calendar fill indicator. */
export const TARGET_DAY_MINUTES = 480;
