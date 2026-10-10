// Placeholder dashboard — will be replaced once the real Dashboard module is walked through.
import { projects, tasks } from '../../data/mock';

export default function DashboardPage() {
  const open = tasks.filter((t) => t.status !== 'done').length;
  const stats = [
    { label: 'Active projects', value: projects.length },
    { label: 'Open tasks', value: open },
    { label: 'Completed', value: tasks.length - open },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">Scaffold placeholder — modules will be added one at a time.</p>
    </div>
  );
}
