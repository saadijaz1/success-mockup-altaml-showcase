# Success Mock Up — AltaML Showcase

A front-end mockup of **Success**, an internal work-management platform built to replace Jira and Monday.com for customer onboarding and project delivery.

This is an independent recreation for portfolio purposes. It contains **no proprietary source code, data, or assets** — all UI is rebuilt from scratch and all data is fictional.

## Stack

- React 19 + TypeScript (Vite)
- Tailwind CSS v4
- React Router
- lucide-react icons
- Fictional mock data (`src/data/mock.ts`), persisted to browser localStorage — no backend

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Structure

```
src/
  layout/AppShell.tsx     sidebar, top bar, page outlet
  modules/registry.tsx    one entry per module (route, nav label, icon, page)
  modules/<name>/         each module's pages and components
  components/             shared UI pieces
  data/mock.ts            fictional seed data
  types/                  domain types
docs/modules.md           functional notes for each module
```

### Adding a module

1. Create `src/modules/<name>/<Name>Page.tsx`
2. Add an entry to `src/modules/registry.tsx`
3. Document it in `docs/modules.md`

## Modules

| Module | Status |
| --- | --- |
| Dashboard | Placeholder |
| Time | List + monthly calendar views, Log time dialog |
| Connectors | Email and Slack notification settings, rules and activity log (simulated) |
| Sales | Prospect dashboard (cards/table, filters) and prospect overview |
| Onboarding | Summary, board, timeline, config tasks, QA, project overview |

_More modules to come._

## Code review

An independent reviewer agent lives in `.claude/agents/pr-reviewer.md`. In Claude Code:

- `/review` reviews the current branch against `main`
- `/review 12` reviews pull request 12 (uses `gh` if signed in)
- `/review --audit` audits the whole codebase

It runs `npm run review:gates` first (lint, type check, build, unused code via knip, debug leftovers, secrets, fictional-data check, PR size, docs and test hygiene), then reads the code against `docs/review-guidelines.md` and reports findings by severity. It never edits code. Use `npm run check:unused` on its own to list unused files, exports and dependencies.

To block names that must never appear in the repo, put one regex per line in `.review-banned-terms`. The file is gitignored on purpose, so the terms themselves are never committed.
