// oxlint-disable react/only-export-components
import { Fragment } from 'react';
import { users } from '../../data/mock';

const names = users.flatMap((u) => [u.name, u.name.split(' ')[0]]).sort((a, b) => b.length - a.length);
const re = new RegExp(`(@(?:${names.join('|')})\\b)`, 'gi');

/** Users tagged in text with @Name or @FirstName. */
export function mentionedUserIds(text: string): string[] {
  const found = text.match(re) ?? [];
  return users
    .filter((u) => found.some((m) => [u.name, u.name.split(' ')[0]].some((n) => m.slice(1).toLowerCase() === n.toLowerCase())))
    .map((u) => u.id);
}

/** Render text with @mentions highlighted. */
export function Mentions({ text }: { text: string }) {
  return (
    <>
      {text.split(re).map((part, i) =>
        i % 2 ? <span key={i} className="rounded bg-brand-50 px-0.5 font-medium text-brand-700">{part}</span> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}
