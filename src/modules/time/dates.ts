// Date helpers working in local time with YYYY-MM-DD strings.

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function currentMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function monthKey(d: Date): string {
  return toISODate(d).slice(0, 7); // YYYY-MM
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
}

export function dayLabel(iso: string): string {
  return fromISODate(iso).toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Whole weeks (Sunday start) covering the month: 4–6 rows of 7 dates. */
export function monthGrid(d: Date): Date[] {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => new Date(d.getFullYear(), d.getMonth(), 1 - first.getDay() + i));
}

export function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}
