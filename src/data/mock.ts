// Fictional seed data. No real customer or company data belongs in this repo.
import type { Project, Task, User } from '../types';

export const users: User[] = [
  { id: 'u1', name: 'Alex Morgan', initials: 'AM', role: 'Onboarding Lead' },
  { id: 'u2', name: 'Priya Shah', initials: 'PS', role: 'Implementation Specialist' },
  { id: 'u3', name: 'Jordan Lee', initials: 'JL', role: 'Customer Success Manager' },
];

export const projects: Project[] = [
  { id: 'p1', name: 'Northwind Energy Onboarding', customer: 'Northwind Energy', ownerId: 'u1', startDate: '2026-09-01', targetDate: '2026-11-10' },
  { id: 'p2', name: 'Ridgeline Services Rollout', customer: 'Ridgeline Services', ownerId: 'u2', startDate: '2026-09-15', targetDate: '2026-12-01' },
];

export const tasks: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Kickoff call', status: 'done', priority: 'high', assigneeId: 'u1', dueDate: '2026-09-03' },
  { id: 't2', projectId: 'p1', title: 'Configure payroll rules', status: 'in_progress', priority: 'urgent', assigneeId: 'u2', dueDate: '2026-10-15' },
  { id: 't3', projectId: 'p1', title: 'User acceptance testing', status: 'todo', priority: 'medium', assigneeId: 'u3', dueDate: '2026-10-28' },
  { id: 't4', projectId: 'p2', title: 'Collect field forms', status: 'review', priority: 'medium', assigneeId: 'u2', dueDate: '2026-10-12' },
  { id: 't5', projectId: 'p2', title: 'Data migration plan', status: 'backlog', priority: 'low' },
];
