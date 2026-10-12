# Success — Module Notes

Functional description of each module, captured during walkthrough. This drives what gets built.

Template per module:

- **Purpose** — what problem it solves / what it replaced (Jira, Monday.com, spreadsheets…)
- **Users** — who uses it
- **Key screens** — list views, detail views, forms
- **Data** — main entities and fields
- **Workflows** — status flows, approvals, automations
- **Showcase angle** — what this demonstrates to a hiring team

---

## Dashboard

_Placeholder — awaiting walkthrough._

---

## Time

- **Purpose** — log and review hours against projects, stages and tasks, with a finance category on every entry.
- **Users** — everyone on the delivery team; managers review totals.
- **Key screens**
  - **List view** — selected month, grouped by day (newest first) with daily totals. Click an entry to edit or delete it.
  - **Calendar view** — monthly grid with daily totals and a category-coloured fill bar against an 8h day. Past weekdays under 8h are flagged amber, and empty past weekdays show "Missing". Clicking a day opens a side panel with that day's entries; double-click or "Log" creates an entry for that date.
  - **Summary strip** — hours logged this month, hours expected to date (weekdays × 8h), and a breakdown by category.
  - **Log time dialog** — fields below.
- **Log time fields**
  - Date
  - Duration — free text (`1.5`, `1:30`, `90m`, `2h`, `1h30m`) plus chips for 15m/30m/45m/1h/2h/4h
  - Activity (optional) — 17 activities, from Client Meetings to Sick Day
  - Category — OPEX, G&A, CAPEX, COGS, PTO
  - Project type — Onboarding, Change Orders, Support (filters the project list)
  - Project — required for OPEX/CAPEX/COGS, optional for G&A
  - Task or stage (optional) — a task, a whole stage (lump sum), or blank for project-level
  - Description (optional)
- **Rules**
  - Choosing Vacation, Flex Day, Stat Holiday or Sick Day sets the category to PTO.
  - PTO entries hide the project fields and aren't tied to a project.
  - Changing project type clears the project; changing project clears the task/stage.
  - "Save & add another" keeps the date, category and project for quick consecutive entries.
- **Data** — `TimeEntry { date, minutes, activity?, category, projectType?, projectId?, workRef: none | stage | task, description? }`. Entries persist in browser localStorage and are seeded from Sep 1 – Oct 9, 2026.
- **Showcase angle** — structured time capture that ties effort to delivery stages and finance categories, giving per-stage effort data for onboarding timelines and for cost reporting (OPEX vs CAPEX).
- **Open questions** — is Project required for G&A? Should BUs be a selectable project type? Approval/submit flow? Weekly view?

---

## Onboarding

- **Purpose** — track every customer onboarding from kickoff to go-live (replaces board/timeline tracking in Jira and Monday.com).
- **Landing page** — summary tiles (current onboardings, need attention, QA needs attention, goes live in next 30 days, on hold) above four tabs:
  - **Board** — columns per journey stage (Kickoff, Discovery, Configuration, QA / UAT, Go-Live, Hypercare); cards show health, go-live countdown, config progress, QA status, owner.
  - **Timeline** — Gantt of start to go-live per customer, coloured by health, filled by config progress, with a today marker.
  - **Configuration tasks** — Jira-style task list per project (see below).
  - **QA** — QA status, checks passed and open issue per customer.
- **Project page** (`/onboarding/:id`) — tabs: Overview, Plan, Setup, Work, Documents, Comms, Admin.
  - **Overview** — onboarding journey, scope & product, key dates, health & key facts, team, authorized contacts.
  - **Setup** — configuration tasks and QA checks. **Work** — time logged from the Time module for linked projects. Plan, Documents, Comms and Admin are light placeholders.
- **Rules** — "Need attention" = active and health not on track; "QA needs attention" = active with a failed QA check; "Goes live" = active with go-live in the next 30 days.
- **Data** — fictional, generated relative to today in `src/modules/onboarding/data.ts`. Northwind and Ridgeline link to Time projects.

---

## Sales

- **Purpose** — track prospects from first call to handoff to Onboarding.
- **Dashboard** (`/sales`) — filters (search by name or owner, owner, tier, stage, quote, sort), scope chips (All / Owned by me / Lost), a live count, and a cards or table view. Cards show name, tier, stage, owner, days in pipeline, quote stage, and document and note counts.
- **Prospect page** (`/sales/:id`) — tabs: Overview, Quote, Documents, Handoff Notes, Master Data; "Raise a question" button.
  - **Overview** — deal stage tracker (synced from a CRM deal), three-step journey (Account & demo prep, Quote, Close & hand over), contacts, what they do (directory profile), similar customers, account details.
  - Quote, Documents, Handoff Notes and Master Data are light, read-only views.
- **Rules** — "Now" is the first incomplete step; step 1 is done once master data is extracted, step 2 when the quote is published, step 3 when it is accepted.
- **Data** — fictional, in `src/modules/sales/data.ts`. Deal stages and the customer directory are generic stand-ins; no CRM integration.
