import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import { modules } from './modules/registry';
import ProjectPage from './modules/onboarding/ProjectPage';
import { TimeProvider } from './modules/time/store';

export default function App() {
  return (
    <TimeProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {modules.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
          <Route path="/onboarding/:id" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </TimeProvider>
  );
}
