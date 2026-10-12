import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import { modules } from './modules/registry';
import ProjectPage from './modules/onboarding/ProjectPage';
import ProspectPage from './modules/sales/ProspectPage';
import { TimeProvider } from './modules/time/store';

export default function App() {
  return (
    <TimeProvider>
    <OnboardingProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {modules.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
          <Route path="/sales/:id" element={<ProspectPage />} />
          <Route path="/onboarding/:id" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </OnboardingProvider>
    </TimeProvider>
  );
}
