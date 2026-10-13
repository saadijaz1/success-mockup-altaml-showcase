import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import { modules } from './modules/registry';
import ProjectPage from './modules/onboarding/ProjectPage';
import TaskPage from './modules/onboarding/TaskPage';
import AccountPage from './modules/orbit/AccountPage';
import { ConnectorsProvider } from './modules/connectors/store';
import { OnboardingProvider } from './modules/onboarding/store';
import ProspectPage from './modules/sales/ProspectPage';
import { TimeProvider } from './modules/time/store';

export default function App() {
  return (
    <TimeProvider>
    <ConnectorsProvider>
    <OnboardingProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppShell />}>
          {modules.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
          <Route path="/onboarding/:id/tasks/:taskId" element={<TaskPage />} />
          <Route path="/orbit/:id" element={<AccountPage />} />
          <Route path="/sales/:id" element={<ProspectPage />} />
          <Route path="/onboarding/:id" element={<ProjectPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </OnboardingProvider>
    </ConnectorsProvider>
    </TimeProvider>
  );
}

function NotFound() {
  return <p className="text-sm text-slate-500">Page not found. <Link to="/" className="text-brand-600">Go to Home</Link></p>;
}
