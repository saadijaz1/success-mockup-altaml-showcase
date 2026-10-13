import { describe, expect, it } from 'vitest';
import expected from '../../../ml/parity_scores.json';
import raw from './accounts.json';
import { MODEL, money, score, type Account } from './score';

const all = raw as Account[];
const base = all.find((a) => a.kind === 'LIVE' && a.hubspotId && a.usageYoY !== null && a.tenureMonths >= 6)!;
const parity = expected as Record<string, { p: number; band: string }>;

describe('parity with the Python model', () => {
  it('has a Python score for every account', () => {
    expect(Object.keys(parity).sort()).toEqual(all.map((a) => a.id).sort());
  });

  it.each(all.map((a) => [a.id, a] as const))('%s: same probability and band as Python', (id, a) => {
    const s = score(a);
    if (s.band === 'no_data') return; // the no-data hold is a front-end rule, tested below
    expect(s.p).toBeCloseTo(parity[id].p, 9);
    expect(s.band).toBe(parity[id].band);
  });
});

describe('not enough data', () => {
  it.each([
    ['not linked to HubSpot', { hubspotId: null }],
    ['no usage history', { usageYoY: null }],
    ['under 3 months old', { tenureMonths: 2 }],
  ])('%s: held mid-scale and never flagged', (_, patch) => {
    const s = score({ ...base, ...patch, championLeft: true, flags: ['CRITICAL', 'HIGH'], tickets90: 12 });
    expect(s).toMatchObject({ band: 'no_data', health: 50, thin: true, drivers: [] });
    expect(s.gaps).toHaveLength(1);
  });

  it('still scores churned accounts', () => {
    expect(score({ ...base, kind: 'CHURNED', hubspotId: null }).band).not.toBe('no_data');
  });
});

describe('scoring', () => {
  it('health is 100 x (1 - probability)', () => {
    const s = score(base);
    expect(s.health).toBe(Math.round(100 * (1 - s.p)));
  });

  it('worse signals raise the risk', () => {
    const worse = score({ ...base, championLeft: true, tickets90: base.tickets90 + 8, lastTouchDays: base.lastTouchDays + 90 });
    expect(worse.p).toBeGreaterThan(score(base).p);
  });

  it('bands follow the cut-offs in model.json', () => {
    const { watch, atRisk, critical } = MODEL.bands;
    for (const s of all.map(score).filter((x) => !x.thin)) {
      const want = s.p >= critical ? 'critical' : s.p >= atRisk ? 'at_risk' : s.p >= watch ? 'watch' : 'healthy';
      expect(s.band).toBe(want);
    }
  });

  it('drivers only list risk-raising signals, largest first', () => {
    const { drivers } = score({ ...base, championLeft: true, tickets90: 10 });
    expect(drivers.length).toBeGreaterThan(0);
    expect(drivers.every((d) => d.effect > 0.05)).toBe(true);
    expect(drivers.map((d) => d.effect)).toEqual([...drivers.map((d) => d.effect)].sort((x, y) => y - x));
  });
});

describe('money', () => {
  it.each([
    [950, '$950'],
    [35000, '$35.0K'],
    [1250000, '$1.3M'],
  ])('%d -> %s', (n, want) => expect(money(n)).toBe(want));
});
