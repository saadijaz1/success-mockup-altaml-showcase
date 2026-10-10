# Success — Product Mockup

A front-end mockup of **Success**, an internal work-management platform built to replace Jira and Monday.com for customer onboarding and project delivery.

This is an independent recreation for portfolio purposes. It contains **no proprietary source code, data, or assets** — all UI is rebuilt from scratch and all data is fictional.

## Stack

- React 19 + TypeScript (Vite)
- Tailwind CSS v4
- React Router
- lucide-react icons
- In-memory mock data (`src/data/mock.ts`) — no backend

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

_More modules to come._
