// Core domain types for the Success mockup.

export type ID = string;

export interface User {
  id: ID;
  name: string;
  initials: string;
  role: string;
}

export type Status = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectType = 'Onboarding' | 'Change Orders' | 'Support';

export interface Stage {
  id: ID;
  name: string;
}

export interface Project {
  id: ID;
  name: string;
  customer: string;
  type: ProjectType;
  ownerId: ID;
  startDate: string; // ISO date
  targetDate: string; // ISO date
  stages: Stage[];
}

export interface Task {
  id: ID;
  projectId: ID;
  stageId: ID;
  title: string;
  status: Status;
  priority: Priority;
  assigneeId?: ID;
  dueDate?: string;
}

// ---------- Time module ----------

export type Category = 'OPEX' | 'G&A' | 'CAPEX' | 'COGS' | 'PTO';

/**
 * What a time entry is booked against, below the project:
 * - none: project-level
 * - stage: whole stage, lump sum
 * - task: a specific task
 */
export type WorkRef =
  | { kind: 'none' }
  | { kind: 'stage'; id: ID }
  | { kind: 'task'; id: ID };

export interface TimeEntry {
  id: ID;
  userId: ID;
  date: string; // YYYY-MM-DD
  minutes: number;
  activity?: string;
  category: Category;
  projectType?: ProjectType;
  projectId?: ID;
  workRef: WorkRef;
  description?: string;
}
