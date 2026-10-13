// Small in-browser retrieval: BM25 over title, tags and body, then a templated answer built from the best matches.
// A production version would use embeddings and an LLM on a server; this shows the experience without a backend.
import { docs, type Doc } from './data';

export type Scope = 'all' | 'article' | 'ticket';
export interface Answer {
  lead: string; steps: string[]; seen: { id: string; text: string }[]; sources: string[]; found: boolean;
}

const STOP = new Set('a an the is are was were be to of in on for and or how do does did i we you it my our can with why what when where which not no this that from at as by if any'.split(' '));
const SYN: Record<string, string> = { ot: 'overtime', sign: 'login', signin: 'login', pw: 'password', staff: 'employee', worker: 'employee', pay: 'payroll', sync: 'sync', approver: 'approval', approve: 'approval', lock: 'locked' };
const stem = (w: string) => { const s = w.replace(/(ing|ed|es|s)$/, (m) => (w.length > 5 ? '' : m)); return SYN[s] ?? SYN[w] ?? s; };
const tok = (t: string) => t.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)).map(stem);

const K1 = 1.4, B = 0.75;
const index = docs.map((d) => ({ d, t: tok(`${d.title} ${d.title} ${d.title} ${d.tags.join(' ')} ${d.tags.join(' ')} ${d.body} ${d.answer}`) }));
const avg = index.reduce((s, x) => s + x.t.length, 0) / index.length;
const df = new Map<string, number>();
index.forEach((x) => new Set(x.t).forEach((w) => df.set(w, (df.get(w) ?? 0) + 1)));
const idf = (w: string) => Math.log(1 + (index.length - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));

export function search(query: string, scope: Scope = 'all', limit = 5): { d: Doc; score: number }[] {
  const q = tok(query);
  const hits = index
    .filter((x) => scope === 'all' || x.d.type === scope)
    .map(({ d, t }) => {
      let score = 0;
      for (const w of new Set(q)) {
        const f = t.filter((x) => x === w).length;
        if (f) score += idf(w) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * t.length) / avg)));
      }
      return { d, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!hits.length || hits[0].score < 2.5) return [];
  const top = hits[0].score;
  const keep = hits.filter((h) => h.score >= top * 0.35).slice(0, limit);
  // Always offer the best matching article too, so a past ticket is paired with the documented behaviour.
  const art = hits.find((h) => h.d.type === 'article' && h.score >= top * 0.2);
  if (art && !keep.includes(art)) keep.push(art);
  return keep;
}

export function answer(query: string, scope: Scope): Answer {
  const hits = search(query, scope);
  if (!hits.length) return { lead: '', steps: [], seen: [], sources: [], found: false };
  const article = hits.find((h) => h.d.type === 'article')?.d;
  const tickets = hits.filter((h) => h.d.type === 'ticket').map((h) => h.d);
  const lead = hits[0].d.type === 'article' || !tickets.length ? (article ?? tickets[0]).answer : `This has come up before. ${tickets[0].answer}`;
  const seen = tickets.slice(0, 3).filter((t) => hits[0].d.type === 'article' || t.id !== tickets[0].id)
    .map((t) => ({ id: t.id, text: `${t.title}: ${t.answer}` }));
  return { lead, steps: hits[0].d.type === 'article' ? (article?.steps ?? []) : [], seen, sources: hits.map((h) => h.d.id), found: true };
}
