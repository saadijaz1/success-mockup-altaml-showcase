// Home page: what this mockup is and a way into each module.
import { Link } from 'react-router-dom';
import { modules } from '../registry';

const blurbs: Record<string, string> = {
  '/sales': 'Prospect pipeline with deal stages, filters and a prospect page that hands over to Onboarding.',
  '/onboarding': 'Customer onboarding projects: board, timeline, QA and Jira-style configuration tasks.',
  '/orbit': 'Customer health with a churn-risk score from a Python-trained model (pytest covered).',
  '/mimir': 'Knowledge assistant over wiki articles and past support tickets, with cited sources.',
  '/time': 'Time entry against projects, stages and tasks, with list and monthly calendar views.',
  '/connectors': 'Email and Slack notifications for task updates and @mentions (simulated).',
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Success Mock Up</h1>
        <p className="mt-1 text-sm text-slate-600">
          An independent rebuild of an internal work-management platform that replaced Monday.com and Jira project tracking. Built with
          Claude Code, one module at a time. All data is fictional.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {modules
          .filter((m) => blurbs[m.path])
          .map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-brand-500">
              <div className="flex items-center gap-2 font-medium">
                <Icon size={16} className="text-brand-600" /> {label}
              </div>
              <p className="mt-1 text-sm text-slate-500">{blurbs[path]}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}
