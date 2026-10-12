// Fictional sales data. Deal stages and the directory are generic stand-ins.
import { addDays, fmt, today } from '../onboarding/data';

export const DEAL_STAGES = ['Sales Qualified', 'Demo Scheduled', 'Demo Complete', 'Deep Dive', 'Negotiate and Review', 'Proposal'];
export const TIERS = ['Essentials', 'Performance', 'Enterprise'] as const;
export const PHASES = ['Sales', 'Handoff'] as const;
export const QUOTE_STAGES = ['Not started', 'Draft', 'Published', 'Accepted'] as const;
export const OWNERS = ['Morgan', 'Taylor', 'Riley', 'Jordan'];
export const ME = 'Morgan';

export type Tier = (typeof TIERS)[number];
export type Phase = (typeof PHASES)[number];
export type QuoteStage = (typeof QUOTE_STAGES)[number];

export interface Prospect {
  id: string; name: string; tier: Tier; phase: Phase; dealStage: number; quote: QuoteStage;
  owner: string; days: number; docs: number; notes: number; lost: boolean;
  masterData: boolean; website?: string; industry?: string; contacts: { name: string; role: string; champion: boolean }[];
}

// name, tier, phase, dealStage, quote, owner, days, docs, notes, lost
const ROWS: [string, Tier, Phase, number, QuoteStage, string, number, number, number, boolean][] = [
  ['Bob Joe Industrial Services', 'Performance', 'Sales', 2, 'Not started', 'Morgan', 8, 0, 0, false],
  ['Westfield Mechanical', 'Enterprise', 'Sales', 3, 'Draft', 'Morgan', 21, 4, 3, false],
  ['Lakeshore Excavating', 'Performance', 'Sales', 4, 'Published', 'Taylor', 34, 6, 5, false],
  ['Ironbridge Civil', 'Essentials', 'Sales', 1, 'Not started', 'Riley', 5, 1, 0, false],
  ['Maple Leaf Paving', 'Performance', 'Sales', 5, 'Published', 'Jordan', 47, 5, 6, false],
  ['Redwater Pipeline Services', 'Enterprise', 'Handoff', 5, 'Accepted', 'Taylor', 62, 9, 8, false],
  ['Tamarack Electric', 'Essentials', 'Sales', 0, 'Not started', 'Morgan', 2, 0, 1, false],
  ['Coyote Ridge Construction', 'Performance', 'Sales', 3, 'Draft', 'Riley', 28, 3, 2, false],
  ['Northern Lights Insulation', 'Essentials', 'Sales', 2, 'Not started', 'Jordan', 12, 2, 1, false],
  ['Summit Peak Roofing', 'Performance', 'Handoff', 5, 'Accepted', 'Morgan', 71, 8, 7, false],
  ['Badlands Earthworks', 'Enterprise', 'Sales', 4, 'Draft', 'Taylor', 39, 4, 4, false],
  ['Prairie Wind Builders', 'Essentials', 'Sales', 1, 'Not started', 'Riley', 9, 1, 1, false],
  ['Clearwater Plumbing', 'Performance', 'Sales', 2, 'Draft', 'Jordan', 18, 2, 2, false],
  ['Stonegate Concrete', 'Essentials', 'Sales', 3, 'Not started', 'Morgan', 26, 3, 2, true],
  ['Foothills Drilling', 'Performance', 'Sales', 4, 'Published', 'Taylor', 55, 5, 4, true],
];
const WEBSITES = new Set([3, 4, 5]);

export const prospects: Prospect[] = ROWS.map(([name, tier, phase, dealStage, quote, owner, days, docs, notes, lost], i) => {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, '');
  return {
    id: `s${i + 1}`, name, tier, phase, dealStage, quote, owner, days, docs, notes, lost,
    masterData: dealStage >= 4,
    website: WEBSITES.has(dealStage) ? `www.${slug}.example` : undefined,
    industry: WEBSITES.has(dealStage) ? 'Construction & trades' : undefined,
    contacts: dealStage >= 3 ? [
      { name: 'Casey Rivera', role: 'Operations Manager', champion: true },
      { name: 'Sam Patel', role: 'Payroll Administrator', champion: false },
    ] : [],
  };
});

export const byId = (id?: string) => prospects.find((p) => p.id === id);
export const syncedLabel = `${fmt(today)}, 10:45 a.m.`;
export const created = (p: Prospect) => addDays(today, -p.days);
