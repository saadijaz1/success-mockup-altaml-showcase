# Review guidelines

The standard the `pr-reviewer` agent applies. It is also the checklist for human reviewers.

## 1. Correctness
- Does the code do what the PR says, including empty, error and boundary cases?
- Trace the changed logic by hand. Do not trust the description or comments.
- State, effects and persistence: stale closures, effects that should be derived values, localStorage reads and writes not wrapped in try/catch.
- Dates and units: time zones, month ends, rounding, currency formatting.

## 2. No extra code
- Unused files, exports, components, props, parameters, types and dependencies.
- Commented-out code, debug logging, TODOs without an owner.
- Speculative abstraction: options, hooks, wrappers or config with one caller and no current need.
- Duplicated logic that already exists elsewhere in the repo (search before approving a new helper).
- Code that restates what the framework or a library already does.

## 3. Scope and design
- One concern per PR. Unrelated refactors or reformatting belong in their own PR.
- Fits the existing structure: modules registered in `src/modules/registry.tsx`, shared UI reused, no cross-module reach-ins.
- Files that mix concerns or grow past what one person can hold in their head. Suggest a split only when it clearly helps.
- Public surface kept small. Prefer the simplest design that meets today's requirement.

## 4. Types and quality
- No `any`, non-null assertions or casts that hide a real type problem. Lint and type escapes must be justified.
- Names say what things are. Functions do one thing. Early returns over deep nesting.
- Comments explain why, not what.

## 5. Security and data
- No secrets, tokens or credentials, including in test data and screenshots.
- No proprietary names or real customer data. Everything in this repo is fictional.
- User-supplied text is never rendered as HTML. External calls and new dependencies are justified and pinned.

## 6. UI quality (front-end changes)
- Keyboard and screen-reader basics: labels on inputs, buttons are buttons, focus visible, no color-only meaning.
- Works at phone width. Empty, loading and error states exist.
- Consistent with the existing Tailwind patterns and tokens.

## 7. Tests
- Logic that can be wrong in subtle ways (parsers, scoring, search, date math, notification rules) has unit tests. State the cases that are missing.
- A bug fix includes a test that fails without the fix.
- If the repo has no test runner yet, say so once and list the first tests worth adding. Do not repeat it on every PR.

## 8. SDLC hygiene
- PR description says what and why, how it was tested, and what reviewers should look at. Screenshots for UI changes.
- Small, reviewable PRs (about 400 changed lines or fewer). Commits have clear subjects.
- Lint, type check and build pass. Docs and README updated with the change.
- Risky changes say how to roll back. Breaking changes and migrations are called out.
- Dependencies: justified, minimal, lockfile updated.

## Severity
- **Blocker:** wrong behavior, data loss, security problem, broken build. Must be fixed before merge.
- **Major:** likely to cause bugs or real maintenance cost. Should be fixed before merge.
- **Minor:** worth fixing, can follow up.
- **Nit:** taste. Only mention if it is cheap and clearly better. Never block on a nit.

Report only what you verified. Do not flag anything lint or the type checker already enforces.
