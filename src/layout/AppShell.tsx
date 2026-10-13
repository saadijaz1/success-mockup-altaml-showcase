import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { modules } from '../modules/registry';
import { users } from '../data/mock';
import { useConnectors } from '../modules/connectors/store';
import GlobalSearch from './GlobalSearch';

export default function AppShell() {
  const me = users[0];
  const { toast, log } = useConnectors();
  return (
    <div className="flex h-screen">
      <aside className="flex w-14 shrink-0 flex-col border-r border-slate-200 bg-white md:w-60">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-3.5 md:px-4">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 text-sm font-bold text-white">S</div>
          <span className="hidden text-base font-semibold md:inline">Success</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {modules.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={label}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-center gap-2.5 rounded-md px-3 py-2 md:justify-start text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-center gap-2.5 border-t border-slate-200 p-3 md:justify-start">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold">{me.initials}</div>
          <div className="hidden min-w-0 md:block">
            <div className="truncate text-sm font-medium">{me.name}</div>
            <div className="truncate text-xs text-slate-500">{me.role}</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <GlobalSearch />
          <Link to="/connectors?tab=activity" className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications sent" title="Notifications sent">
            <Bell size={18} />
            {log.length > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">{log.length > 9 ? '9+' : log.length}</span>}
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
        {toast && <div role="status" className="fixed bottom-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
      </div>
    </div>
  );
}
