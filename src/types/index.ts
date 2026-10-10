// Core domain types for the Success mockup.
// These are a starting point — they will be reshaped as each module is walked through.

export type ID = string;

export interface User {
  id: ID;
  name: string;
  initials: string;
  role: string;
}

export type Status = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: ID;
  name: string;
  customer: string;
  ownerId: ID;
  startDate: string; // ISO date
  targetDate: string; // ISO date
}

export interface Task {
  id: ID;
  projectId: ID;
  title: string;
  status: Status;
  priority: Priority;
  assigneeId?: ID;
  dueDate?: string;
}
