#!/usr/bin/env bash
# Automated review gates. Usage: bash scripts/review-gates.sh [base-branch]   (default: main)
# Prints PASS / WARN / FAIL lines and exits 1 if anything FAILs. The pr-reviewer agent runs this first.
#
# Optional, local only: put one regex per line in .review-banned-terms (gitignored) to block names that must never
# appear in this repo. The terms are deliberately not stored in the repository.
set -u
BASE="${1:-main}"
FAIL=0
pass() { echo "PASS  $*"; }
warn() { echo "WARN  $*"; }
fail() { echo "FAIL  $*"; FAIL=1; }
# Print up to 5 matching lines (trimmed). Returns 0 when there was a match.
show() { local out; out=$(cut -c1-110 | head -5); [ -n "$out" ] && echo "$out" | sed 's/^/      /'; [ -n "$out" ]; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

git rev-parse --verify -q "$BASE" >/dev/null || { echo "FAIL  base branch '$BASE' not found"; exit 1; }
[ -x node_modules/.bin/tsc ] || { echo "FAIL  dependencies missing. Run: npm install"; exit 1; }
MB=$(git merge-base "$BASE" HEAD)
FILES=$(git diff --name-only "$MB" HEAD)
# Safety scans cover every added line except the lockfile. Hygiene scans cover source files only.
ADDED_ALL=$(git diff "$MB" HEAD -U0 -- . ':!package-lock.json' | grep -E '^\+' | grep -vE '^\+\+\+' || true)
ADDED_CODE=$(git diff "$MB" HEAD -U0 -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' '*.css' | grep -E '^\+' | grep -vE '^\+\+\+' || true)

echo "== Scope =="
read -r INS DEL <<<"$(git diff --numstat "$MB" HEAD -- . ':!*.json' | awk '{i+=$1; d+=$2} END {print i+0, d+0}')"
N=$(echo "$FILES" | grep -c . || true)
echo "      $N files, +$INS / -$DEL lines vs $BASE (JSON data and lockfile excluded from size)"
if [ $((INS + DEL)) -gt 1000 ]; then fail "PR is very large (>1000 changed lines). Split it."
elif [ $((INS + DEL)) -gt 400 ]; then warn "PR is large (>400 changed lines). Consider splitting."
else pass "PR size is reviewable"; fi
[ -n "$(git status --porcelain)" ] && warn "uncommitted or untracked changes are not part of this review"

echo "== Build gates =="
node_modules/.bin/oxlint >"$TMP/lint.txt" 2>&1 && pass "lint" || { fail "lint"; tail -15 "$TMP/lint.txt"; }
grep -qE ':[0-9]+:[0-9]+: warning' "$TMP/lint.txt" && { warn "lint reports warnings:"; grep -E ':[0-9]+:[0-9]+: warning' "$TMP/lint.txt" | show; }
node_modules/.bin/tsc -b >"$TMP/tsc.txt" 2>&1 && pass "type check" || { fail "type check"; tail -15 "$TMP/tsc.txt"; }
node_modules/.bin/vite build --outDir "$TMP/dist" --emptyOutDir >"$TMP/build.txt" 2>&1 && pass "production build" || { fail "production build"; tail -15 "$TMP/build.txt"; }

echo "== Extra code =="
if [ -x node_modules/.bin/knip ]; then
  node_modules/.bin/knip --no-progress >"$TMP/knip.txt" 2>&1 && pass "no unused files, exports or dependencies" || { warn "unused code found (knip):"; head -30 "$TMP/knip.txt"; }
else warn "knip not installed; run npm install"; fi
echo "$ADDED_CODE" | grep -E 'console\.(log|debug)|debugger|\bf(it|describe)\(|\.only\(' | show && warn "debug leftovers in added code" || pass "no debug leftovers"
echo "$ADDED_CODE" | grep -E 'TODO|FIXME|XXX|HACK' | show && warn "TODO/FIXME markers added" || pass "no TODO markers added"
echo "$ADDED_CODE" | grep -E '^\+\s*//\s*(const|let|var|function|import|return|if|for)\b' | show && warn "commented-out code added" || pass "no commented-out code added"
echo "$ADDED_CODE" | grep -E '(:|\bas|<)\s*any\b|\bany\[\]|@ts-ignore|@ts-expect-error|(eslint|oxlint)-disable' | show && warn "type or lint escapes added (check each is justified)" || pass "no type or lint escapes added"

echo "== Safety =="
npm audit --audit-level=high >"$TMP/audit.txt" 2>&1 && pass "no high-severity dependency vulnerabilities" || { warn "dependency vulnerabilities (npm audit):"; grep -E "^[a-z@].*(<|>=)|Severity|found" "$TMP/audit.txt" | show; }
# Matches are counted, never printed, so a real secret does not end up in review output or logs.
SECRETS=$(echo "$ADDED_ALL" | grep -ciE 'ghp_[a-z0-9]{20,}|github_pa[t]_|sk-[a-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|(password|passwd|secret|api[_-]?key|token)[a-z_]*["'"'"']?\s*[:=]\s*["'"'"'][^"'"'"']{8,}' || true)
[ "$SECRETS" -gt 0 ] && fail "possible secret in $SECRETS added line(s). Inspect with: git diff $MB HEAD | grep -iE 'key|token|secret|password'" || pass "no secrets in added lines"
if [ -s .review-banned-terms ]; then
  HITS=$(echo "$ADDED_ALL" | grep -ciEf .review-banned-terms || true)
  [ "$HITS" -gt 0 ] && fail "banned term in $HITS added line(s) (see .review-banned-terms). This repo must stay fictional." || pass "no banned terms"
else warn "no .review-banned-terms file: proprietary-name check skipped"; fi
echo "$FILES" | grep -E '(^|/)(\.env(\..+)?|.*\.pem|.*\.key)$' | show && fail "env or key file in diff" || pass "no env or key files"

echo "== SDLC hygiene =="
if echo "$FILES" | grep -q '^src/modules/' && ! echo "$FILES" | grep -qE '^(docs/|README)'; then warn "module code changed but docs/ and README were not updated"; else pass "docs updated with code (or no module change)"; fi
if echo "$FILES" | grep -qE '^(src|ml)/' && ! echo "$FILES" | grep -qE '(\.test\.|\.spec\.|__tests__|tests/)'; then warn "source changed with no tests added or updated"; else pass "tests accompany source changes"; fi
echo "$FILES" | grep -qx 'package.json' && ! echo "$FILES" | grep -qx 'package-lock.json' && warn "package.json changed but package-lock.json did not"
BAD=$(git log --format='%h %s' "$MB"..HEAD | awk '{ s=$0; sub(/^[^ ]+ /, "", s); if (length(s) < 12 || length(s) > 80) print $0 }' | head -3)
[ -n "$BAD" ] && { warn "commit subjects shorter than 12 or longer than 80 characters:"; echo "$BAD" | sed 's/^/      /'; } || pass "commit subjects look fine"

echo
[ "$FAIL" = 0 ] && echo "RESULT: no blocking gate failures" || echo "RESULT: blocking gate failures"
exit $FAIL
