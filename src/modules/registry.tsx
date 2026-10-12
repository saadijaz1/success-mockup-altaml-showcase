// Single source of truth for Success modules.
// To add a module: create src/modules/<name>/<Name>Page.tsx and add one entry here.
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Clock, LayoutDashboard, Orbit, Plug, Rocket, Sparkles } from 'lucide-react';
import DashboardPage from './dashboard/DashboardPage';
import TimePage from './time/TimePage';
import ConnectorsPage from './connectors/ConnectorsPage';
import OnboardingPage from './onboarding/OnboardingPage';
import OrbitPage from './orbit/OrbitPage';
import MimirPage from './mimir/MimirPage';

export interface ModuleDef {
  path: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
}

export const modules: ModuleDef[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, component: DashboardPage },
  { path: '/onboarding', label: 'Onboarding', icon: Rocket, component: OnboardingPage },
  { path: '/orbit', label: 'Orbit', icon: Orbit, component: OrbitPage },
  { path: '/mimir', label: 'Mimir', icon: Sparkles, component: MimirPage },
  { path: '/time', label: 'Time', icon: Clock, component: TimePage },
  { path: '/connectors', label: 'Connectors', icon: Plug, component: ConnectorsPage },
];
