#!/usr/bin/env bash
# Tests for the custom Telecom Vale rules.
#
#   should-fail.md: every sentence has one mistake. Vale must flag each one.
#   should-pass.md: every sentence is correct. Vale must flag nothing.
#
# Run from the repository root:  bash packs/telecom/tests/run-tests.sh
set -euo pipefail
cd "$(dirname "$0")"

# Stop if Vale can't load this folder's .vale.ini. Otherwise an empty result
# would look like a pass.
if ! vale ls-config > /dev/null 2>&1; then
  echo "FAIL: Vale couldn't load packs/telecom/tests/.vale.ini. Check that the file exists."
  exit 1
fi

# Lines to check: every non-empty line except the first (the instructions).
# comm needs both lists in text order (10 before 2), not number order.
expected=$(awk 'NR>1 && NF {print NR}' should-fail.md | LC_ALL=C sort)
flagged=$(vale --output=line should-fail.md | cut -d: -f2 | LC_ALL=C sort -u || true)
missed=$(LC_ALL=C comm -23 <(echo "$expected") <(echo "$flagged"))

pass_output=$(vale --output=line should-pass.md || true)

status=0
if [ -n "$missed" ]; then
  echo "FAIL: these lines in should-fail.md have a mistake that Vale missed: $(echo $missed)"
  status=1
else
  echo "PASS: Vale caught all $(echo "$expected" | wc -l | tr -d ' ') mistakes in should-fail.md."
fi
if [ -n "$pass_output" ]; then
  echo "FAIL: Vale flagged correct text in should-pass.md:"
  echo "$pass_output"
  status=1
else
  echo "PASS: Vale flagged nothing in should-pass.md."
fi
exit $status
