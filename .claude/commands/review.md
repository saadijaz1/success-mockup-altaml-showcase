---
description: Independent review of a PR, the current branch, or the whole codebase
argument-hint: [PR number | base branch | --audit]
---

Use the `pr-reviewer` agent to review: $ARGUMENTS

- No argument: review the current branch against `main`.
- A number: review that pull request (use `gh` if it is authenticated, otherwise review the matching local branch).
- A branch name: review the current branch against that base.
- `--audit`: audit the whole codebase.

Return the agent's report unchanged, then list the blockers and majors as a short fix checklist.
