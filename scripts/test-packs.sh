#!/usr/bin/env bash
# Runs the rule tests for every domain pack turned on in docs-kit.yml.
# Each pack's tests prove its rules still catch the mistakes they're meant
# to catch, and flag nothing in correct text.
#
# Run from the repository root:  bash scripts/test-packs.sh
set -euo pipefail

packs=$(python3 -c "import yaml; c=yaml.safe_load(open('docs-kit.yml')); print(' '.join(k for k, v in (c.get('packs') or {}).items() if v))")

if [ -z "$packs" ]; then
  echo "No domain packs are turned on, so there are no rule tests to run."
  exit 0
fi

status=0
for pack in $packs; do
  echo "== Pack: $pack"
  bash "packs/$pack/tests/run-tests.sh" || status=1
done
exit $status
