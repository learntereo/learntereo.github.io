#!/bin/sh
# Fails if any tracked (or, with --cached, staged) text file contains an em dash (U+2014).
# Used by the pre-commit hook and CI.
EM=$(printf '\342\200\224')
if git grep -nI ${1:+"$1"} -e "$EM" -- . ':!package-lock.json'; then
  echo "ERROR: em dash (U+2014) found above. Replace it with ':', ',', '-' or rewrite the sentence." >&2
  exit 1
fi
