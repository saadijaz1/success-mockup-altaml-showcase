import { describe, expect, it } from 'vitest';
import { STAGES, addDays, onboardings, stagePlan } from './data';
import { oneOf } from './ui';

describe('stagePlan', () => {
  it.each(onboardings.map((o) => [o.customer, o] as const))('%s: stages are back to back from kickoff to hypercare', (_, o) => {
    const plan = stagePlan(o);
    expect(plan.map((p) => p.stage)).toEqual([...STAGES]);
    expect(plan[0].from).toBe(o.start);
    plan.slice(1).forEach((p, i) => expect(p.from).toBe(plan[i].to));
    expect(plan[4].to).toBe(o.goLive);
    expect(plan[5].to).toBe(addDays(o.goLive, 30));
  });
});

describe('seed onboardings', () => {
  it.each(onboardings.map((o) => [o.customer, o] as const))('%s: tasks due by end of Configuration; owner leads the team', (_, o) => {
    const configEnd = stagePlan(o)[2].to;
    expect(o.configTasks.every((t) => t.due <= configEnd)).toBe(true);
    expect(o.team.find((m) => m.role === 'Onboarding lead')?.userId).toBe(o.ownerId);
  });
});

describe('oneOf', () => {
  it('keeps allowed values and falls back on anything else', () => {
    expect(oneOf('table', ['feed', 'table'], 'feed')).toBe('table');
    expect(oneOf('toString', ['feed', 'table'], 'feed')).toBe('feed');
  });
});
