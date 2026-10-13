// oxlint-disable react/only-export-components
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { users } from '../../data/mock';

export type Channel = 'email' | 'slack';
export type EventKind = 'status' | 'assignee' | 'due' | 'comment' | 'mention';

export const EVENTS: { kind: EventKind; label: string; who: string }[] = [
  { kind: 'status', label: 'Task status changed', who: 'Assignee, reviewer, involved' },
  { kind: 'assignee', label: 'Task reassigned', who: 'New and previous assignee, reviewer, involved' },
  { kind: 'due', label: 'Due date changed', who: 'Assignee, reviewer, involved' },
  { kind: 'comment', label: 'Comment added', who: 'Assignee, reviewer, involved' },
  { kind: 'mention', label: 'Tagged (@mention) in a comment', who: 'Each tagged person' },
];
const SLACK_VERB: Partial<Record<EventKind, string>> = { mention: 'tagged teammates in a comment' };
const VERB: Record<EventKind, string> = {
  status: 'changed the status', assignee: 'reassigned the task', due: 'changed the due date', comment: 'commented', mention: 'tagged you in a comment',
};

export interface Settings {
  email: { connected: boolean; fromName: string; fromAddress: string };
  slack: { connected: boolean; workspace: string; channel: string };
}
export type Rules = Record<EventKind, Record<Channel, boolean>>;
export interface LogEntry { id: string; at: string; channel: Channel; kind: EventKind; to: string; title: string; body: string; customer: string }
export interface NotifyEvent { kind: EventKind; customer: string; taskKey: string; taskTitle: string; path: string; actorId: string; recipients: string[]; detail?: string }

const DEFAULTS: Settings = {
  email: { connected: true, fromName: 'Success', fromAddress: 'notifications@success.example' },
  slack: { connected: true, workspace: 'success-demo', channel: 'onboarding-updates' },
};
const DEFAULT_RULES = Object.fromEntries(EVENTS.map((e) => [e.kind, { email: true, slack: true }])) as Rules;

export const userById = (id: string) => users.find((u) => u.id === id);
export const emailOf = (id: string) => `${(userById(id)?.name ?? id).toLowerCase().replace(/\s+/g, '.')}@success.example`;
export const handleOf = (id: string) => `@${(userById(id)?.name ?? id).toLowerCase().replace(/\s+/g, '.')}`;

interface Store {
  settings: Settings; rules: Rules; log: LogEntry[]; toast: string | null;
  setEmail: (p: Partial<Settings['email']>) => void;
  setSlack: (p: Partial<Settings['slack']>) => void;
  toggleRule: (k: EventKind, c: Channel) => void;
  notify: (e: NotifyEvent) => void;
  sendTest: (c: Channel) => void;
  clearLog: () => void;
}
const Ctx = createContext<Store | null>(null);
const KEY = 'success.connectors.v1';

function load(): { settings: Settings; rules: Rules; log: LogEntry[] } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw) return { settings: { ...DEFAULTS, ...raw.settings }, rules: { ...DEFAULT_RULES, ...raw.rules }, log: raw.log ?? [] };
  } catch {
    /* fall through */
  }
  return { settings: DEFAULTS, rules: DEFAULT_RULES, log: [] };
}

export function ConnectorsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>(0);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...state, log: state.log.slice(0, 200) }));
    } catch {
      /* ignore */
    }
  }, [state]);

  const show = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  /** Demo transport: appends to the activity log. A real integration would call its email / Slack API here. */
  const deliver = useCallback((entries: LogEntry[]) => {
    if (!entries.length) return;
    setState((s) => ({ ...s, log: [...entries, ...s.log] }));
    const em = entries.filter((e) => e.channel === 'email').length;
    const sl = entries.length - em;
    show(`Notified: ${[em && `${em} email${em > 1 ? 's' : ''}`, sl && `${sl} Slack message${sl > 1 ? 's' : ''}`].filter(Boolean).join(' + ')}`);
  }, [show]);

  const store = useMemo<Store>(() => {
    const { settings, rules } = state;
    const mk = (channel: Channel, kind: EventKind, to: string, title: string, body: string, customer: string): LogEntry =>
      ({ id: crypto.randomUUID(), at: new Date().toISOString(), channel, kind, to, title, body, customer });
    return {
      settings, rules, log: state.log, toast,
      setEmail: (p) => setState((s) => ({ ...s, settings: { ...s.settings, email: { ...s.settings.email, ...p } } })),
      setSlack: (p) => setState((s) => ({ ...s, settings: { ...s.settings, slack: { ...s.settings.slack, ...p } } })),
      toggleRule: (k, c) => setState((s) => ({ ...s, rules: { ...s.rules, [k]: { ...s.rules[k], [c]: !s.rules[k][c] } } })),
      clearLog: () => setState((s) => ({ ...s, log: [] })),
      sendTest: (c) =>
        deliver([c === 'email'
          ? mk('email', 'comment', emailOf('u1'), 'Test notification from Success', `This is a test email sent from ${settings.email.fromAddress}.`, 'Test')
          : mk('slack', 'comment', `#${settings.slack.channel}`, 'Test notification', `Test message to #${settings.slack.channel} in ${settings.slack.workspace}.`, 'Test')]),
      notify: (e) => {
        const actor = userById(e.actorId)?.name ?? 'Someone';
        const title = e.taskTitle || 'Untitled task';
        const label = EVENTS.find((x) => x.kind === e.kind)!.label;
        const out: LogEntry[] = [];
        if (settings.email.connected && rules[e.kind].email) {
          for (const r of e.recipients) {
            out.push(mk('email', e.kind, emailOf(r), `[${e.taskKey}] ${label}: ${title}`,
              `${actor} ${VERB[e.kind]}${e.detail ? `\n${e.detail}` : ''}\n\n${e.customer} · ${e.taskKey} ${title}\nOpen task: ${e.path}`, e.customer));
          }
        }
        if (settings.slack.connected && rules[e.kind].slack) {
          const cc = e.recipients.length ? `\ncc ${e.recipients.map(handleOf).join(' ')}` : '';
          const verb = SLACK_VERB[e.kind] ?? VERB[e.kind];
          out.push(mk('slack', e.kind, `#${settings.slack.channel}`, `${actor} ${verb} on ${e.taskKey}`,
            `*${e.taskKey}* ${title} (${e.customer})\n${actor} ${verb}${e.detail ? `: ${e.detail}` : ''}${cc}\nOpen task: ${e.path}`, e.customer));
        }
        deliver(out);
      },
    };
  }, [state, toast, deliver]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useConnectors() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useConnectors must be used inside ConnectorsProvider');
  return c;
}
