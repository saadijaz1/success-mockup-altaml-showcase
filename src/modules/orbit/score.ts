// Scores accounts with the logistic-regression model trained by ml/train_churn_model.py (weights in model.json).
import model from './model.json';
import raw from './accounts.json';

export type Sev = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Kind = 'LIVE' | 'ONBOARDING' | 'CHURNED';
export type Band = 'healthy' | 'watch' | 'at_risk' | 'critical';
export interface Account {
  id: string; name: string; kind: Kind; industry: string; tier: string; ownerId: string | null;
  hubspotId: string | null; chargebeeId: string | null; arr: number | null; employees: number; tenureMonths: number;
  renewalIn: number | null; lastTouchDays: number; usageYoY: number | null; flags: Sev[]; owing: number; overdueDays: number;
  workItems: number; tickets90: number; championLeft: boolean; integrations: number;
}
export interface Scored extends Account { p: number; health: number; band: Band; thin: boolean; drivers: { label: string; effect: number }[] }

const SEV_W: Record<Sev, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
export const BAND_META: Record<Band, [string, string]> = {
  healthy: ['Healthy', 'bg-emerald-50 text-emerald-700'], watch: ['Watch', 'bg-amber-50 text-amber-700'],
  at_risk: ['At risk', 'bg-orange-100 text-orange-800'], critical: ['Critical', 'bg-red-100 text-red-700'],
};
const LABEL: Record<string, (a: Account) => string> = {
  usageYoY: (a) => (a.usageYoY === null ? 'No usage data' : `Sign-ins ${a.usageYoY >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(a.usageYoY * 100))}% YoY`),
  lastTouchDays: (a) => `Last contact ${a.lastTouchDays} days ago`,
  flagScore: (a) => `${a.flags.length} open risk flag${a.flags.length === 1 ? '' : 's'}`,
  owingK: (a) => `${money(a.owing)} outstanding`,
  renewalPressure: (a) => `Renews in ${a.renewalIn} days`,
  tenureMonths: (a) => `Only ${a.tenureMonths} month${a.tenureMonths === 1 ? '' : 's'} as a customer`,
  tickets90: (a) => `${a.tickets90} support tickets in 90 days`,
  championLeft: () => 'Main champion has left',
  integrations: (a) => a.integrations === 0 ? 'No integrations in use' : `Only ${a.integrations} integration${a.integrations === 1 ? '' : 's'}`,
  workItems: (a) => `${a.workItems} open work items`,
};

export function money(n: number) {
  return n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n}`;
}

export function score(a: Account): Scored {
  const x = [
    a.usageYoY ?? model.usageImpute, a.lastTouchDays, a.flags.reduce((s, f) => s + SEV_W[f], 0), a.owing / 1000,
    a.renewalIn === null ? 0 : Math.min(Math.max(1 - a.renewalIn / 180, 0), 1), a.tenureMonths, a.tickets90, a.championLeft ? 1 : 0, a.integrations, a.workItems,
  ];
  const contrib = x.map((v, i) => (model.coef[i] * (v - model.mean[i])) / model.scale[i]);
  const z = model.intercept + contrib.reduce((s, c) => s + c, 0);
  const p = 1 / (1 + Math.exp(-z));
  const { watch, atRisk, critical } = model.bands;
  const band: Band = p >= critical ? 'critical' : p >= atRisk ? 'at_risk' : p >= watch ? 'watch' : 'healthy';
  const drivers = contrib
    .map((effect, i) => ({ label: LABEL[model.features[i]](a), effect }))
    .filter((d) => d.effect > 0.05)
    .sort((m, n) => n.effect - m.effect);
  return { ...a, p, health: Math.round(100 * (1 - p)), band, thin: a.usageYoY === null, drivers };
}

export const accounts: Scored[] = (raw as Account[]).map(score);
export const MODEL = model;
export const featureLabels = ['Sign-in trend (YoY)', 'Days since last contact', 'Open risk flags (weighted)', 'Amount outstanding', 'Renewal proximity', 'Tenure (months)', 'Support tickets (90 d)', 'Champion left', 'Integrations in use', 'Open work items'];
