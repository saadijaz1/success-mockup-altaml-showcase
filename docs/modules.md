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
