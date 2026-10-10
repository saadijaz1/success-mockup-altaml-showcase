import { NavLink, Outlet } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { modules } from '../modules/registry';
import { users } from '../data/mock';

export default function AppShell() {
  const me = users[0];
  return (
    <div className="flex h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 text-sm font-bold text-white">S</div>
          <span className="text-base font-semibold">Success</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {modules.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2.5 border-t border-slate-200 p-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold">{me.initials}</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{me.name}</div>
            <div className="truncate text-xs text-slate-500">{me.role}</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex w-80 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">
            <Search size={14} /> Search projects, tasks…
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
