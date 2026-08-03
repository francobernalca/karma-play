#!/usr/bin/env bash
# Portable public-surface build for a static Cloudflare Pages project.
#
# Drop this into a repo as scripts/build-public.sh, add a .publicfiles manifest
# beside it, and set the Pages project to:
#
#     Build command            : bash scripts/build-public.sh
#     Build output directory   : _site
#     Root directory           : /            (or www, see ROOT below)
#
# WHY THIS EXISTS
# Cloudflare Pages publishes whatever directory you hand it. Point it at the
# repository root and it serves README.md, LICENSE, wrangler.jsonc and anything
# else sitting there. This builds an allowlisted copy instead, so a file is
# public only because it was named, never because it happened to be in the repo.
#
# It mirrors main-site/deploy.ps1, which has been the proven pattern on
# francobernal.ca. Same two ideas: an explicit allowlist, and stub files over
# the well-known paths so a stale edge copy stays non-informative rather than
# revealing anything.
#
# Fails loudly. A build that half-works and reports success is worse than one
# that stops, because the deploy still happens.

set -euo pipefail

ROOT="${ROOT:-.}"
OUT="${OUT:-_site}"
MANIFEST="${MANIFEST:-.publicfiles}"

cd "$ROOT"

if [ ! -f "$MANIFEST" ]; then
  echo "BLOCKED: no $MANIFEST manifest. Refusing to guess what is public." >&2
  exit 1
fi

rm -rf "$OUT"
mkdir -p "$OUT"

copied=0
while IFS= read -r entry || [ -n "$entry" ]; do
  entry="${entry%%#*}"                      # strip comments
  entry="$(echo "$entry" | xargs || true)"  # trim
  [ -z "$entry" ] && continue
  if [ -d "$entry" ]; then
    mkdir -p "$OUT/$(dirname "$entry")"
    cp -r "$entry" "$OUT/$(dirname "$entry")/"
    copied=$((copied + 1))
  elif [ -f "$entry" ]; then
    mkdir -p "$OUT/$(dirname "$entry")"
    cp "$entry" "$OUT/$entry"
    copied=$((copied + 1))
  else
    echo "BLOCKED: '$entry' is listed in $MANIFEST but does not exist." >&2
    exit 1
  fi
done < "$MANIFEST"

# index.html and _headers are not optional. Without _headers the site deploys
# with no security headers at all, which is the exact silent regression this
# whole setup exists to prevent.
for required in index.html _headers; do
  [ -f "$OUT/$required" ] || { echo "BLOCKED: $OUT/$required missing." >&2; exit 1; }
done

# Anything that must never ship, even if a manifest line was careless.
for forbidden in .git .github node_modules .env deploy.ps1 ship.ps1 scripts wrangler.toml wrangler.jsonc .wrangler; do
  if [ -e "$OUT/$forbidden" ]; then
    echo "BLOCKED: $OUT/$forbidden must never be published." >&2
    exit 1
  fi
done
if find "$OUT" \( -name '*.map' -o -name '.env*' -o -name '*.ps1' \) | grep -q .; then
  echo "BLOCKED: source maps, env files or scripts present in $OUT." >&2
  exit 1
fi

# Stubs over well-known repo paths. Not security by itself, but it means a
# probe gets a definite harmless answer, and it evicts any stale cached copy.
for p in README.md LICENSE .gitignore wrangler.toml wrangler.jsonc; do
  printf 'Not part of the public site.\n' > "$OUT/$p"
done

echo "public surface ready: $(find "$OUT" -type f | wc -l) files from $copied manifest entries"
