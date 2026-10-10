import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import { modules } from './modules/registry';
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
        </Route>
      </Routes>
    </BrowserRouter>
    </TimeProvider>
  );
}
