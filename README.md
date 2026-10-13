# Success Mock Up — AltaML Showcase

**Live demo:** https://saadijaz1.github.io/success-mockup-altaml-showcase/

An independent rebuild of **Success**, an internal work-management platform I built with Claude that replaced Monday.com and took over project and task tracking from Jira. The original is internal to my employer, so this version was rebuilt from scratch for my AltaML application. It contains **no proprietary code, data, names or assets**; all data is fictional.

The point of the repo is to show how I work with AI day to day: Claude Code writes the code, I own the design, the build steps and the review.

## How it was built

- **Claude Code as the default workflow.** For each module I described how the real product works, had Claude break it into build steps, then implemented and checked one step at a time.
- **Small, focused commits and pull requests.** Modules were built one at a time, with later modules on feature branches merged through pull requests with written descriptions. See the closed PRs and `git log`.
- **An independent review agent.** `.claude/agents/pr-reviewer.md` reviews every branch or PR against `docs/review-guidelines.md`. It runs the automated gates first and reports findings by severity without editing code (see [Code review](#code-review)).
- **Tests and CI.** The churn model has a pytest suite, and GitHub Actions runs lint, type check, build and tests on every pull request.

## Modules

| Module | What it does |
| --- | --- |
| Home | Overview and entry point to each module |
| Time | Log time against projects, stages and tasks; list and monthly calendar views |
| Onboarding | Project summary, board, timeline, QA, and Jira-style configuration tasks with a task page and comments |
| Sales | Prospect dashboard (cards or table, filters) and a prospect page with deal stages and handover to Onboarding |
| Orbit | Customer accounts scored for churn risk by a model trained in Python |
| Mimir | Knowledge assistant over wiki articles and resolved support tickets, with cited sources |
| Connectors | Email and Slack notifications for task updates and @mentions (simulated) |

Functional notes for each module are in [`docs/modules.md`](docs/modules.md).

### Orbit churn model

`ml/train_churn_model.py` generates synthetic accounts and churn labels, trains a logistic regression (compared against gradient boosting), and writes the weights to `src/modules/orbit/model.json`. The browser applies those weights in `score.ts`, so every score and its "what's driving it" explanation comes from the trained model. Labels are simulated, so the AUC (about 0.82) shows the pipeline works, not real-world accuracy.

`ml/tests/` has 42 pytest tests covering sampling, training determinism, an AUC floor, coefficient signs, export fidelity, score monotonicity, and a check that the committed JSON matches a fresh training run.

### Mimir

The demo uses BM25 keyword search over a small fictional knowledge base and builds each answer from the best matches, with source chips. There is no language model in this version; `docs/modules.md` describes the production design (embeddings, vector search and an LLM answering from retrieved sources).

## Stack

- React 19, TypeScript, Vite, Tailwind CSS v4, React Router, lucide-react
- Python 3, NumPy, scikit-learn, pytest
- oxlint, knip, GitHub Actions
- No backend: seed data lives in the repo and edits persist in browser localStorage

## Getting started

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type check + production build
npm run lint

pip install -r ml/requirements.txt
npm run test:ml        # pytest for the churn model
python3 ml/train_churn_model.py   # retrain and rewrite model.json
```

## Code review

In Claude Code:

- `/review` reviews the current branch against `main`
- `/review 12` reviews pull request 12 (uses `gh` if signed in)
- `/review --audit` audits the whole codebase

The agent runs `npm run review:gates` first: lint, type check, build, pytest, unused code (knip), debug leftovers, secrets, fictional-data check, PR size, and docs and test hygiene. It then reads the code against `docs/review-guidelines.md`. It never edits code.

To block names that must never appear in the repo, put one regex per line in `.review-banned-terms`. The file is gitignored on purpose, so the terms themselves are never committed.

## Structure

```
src/
  layout/AppShell.tsx     sidebar, top bar, page outlet
  modules/registry.tsx    one entry per module (route, nav label, icon, page)
  modules/<name>/         each module's pages, data and logic
  data/mock.ts            shared fictional seed data
  types/                  domain types
ml/                       churn model training script and tests
docs/                     module notes and review guidelines
scripts/review-gates.sh   automated review gates
.claude/                  review agent and /review command
```
