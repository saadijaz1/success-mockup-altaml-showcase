// Single source of truth for Success modules.
// To add a module: create src/modules/<name>/<Name>Page.tsx and add one entry here.
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Clock, LayoutDashboard } from 'lucide-react';
import DashboardPage from './dashboard/DashboardPage';
import TimePage from './time/TimePage';

export interface ModuleDef {
  path: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
}

export const modules: ModuleDef[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, component: DashboardPage },
  { path: '/time', label: 'Time', icon: Clock, component: TimePage },
];
