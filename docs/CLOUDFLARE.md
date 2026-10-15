# Future path: private source + free public play (Cloudflare)

Use this only if Karma Play graduates from open prototype to a private product
while staying free to play forever.

## Goals
1. Players keep a stable free URL (or redirect from francobernal.ca).
2. Source code is **not** public on GitHub.
3. Deploy surface exposes **only** static game files — never `.git`, secrets, or docs you do not want public.

## Recommended setup
1. Make the GitHub repo **private** (or move to a new private repo).
2. Create a Cloudflare Pages project from that private repo (or direct upload / wrangler).
3. Publish only the allowlisted files: `bash scripts/build-public.sh` copies what `.publicfiles`
   names into `_site/`, and nothing else.
4. Attach a free hostname, e.g. `play.francobernal.ca` or `karmaplay.pages.dev`.
5. On francobernal.ca, change the play link to the Cloudflare URL (301/redirect or href update).
6. Disable or archive the public github.io site so there is one canonical free URL.

## Headers
The live site already runs on Cloudflare Pages. The headers it sends are in the repo's
`_headers` file, which is the only source of truth. Do not copy an older sample here:
the game must keep `frame-ancestors 'self' https://francobernal.ca https://www.francobernal.ca`
and must not send X-Frame-Options, or the francobernal.ca portal goes blank.

## Cloudflare `_redirects` (optional)
```
# Force HTTPS is default on Pages
```

## Hard rules for deploys
- Never bind a Pages project to a folder that contains `.env`, keys, or personal Drive mirrors.
- Never enable Functions/Workers for this game unless you have a real reason (game needs none).
- Never put API tokens in the client JS.
- After making the repo private, rotate any token that ever lived in git history (should be none).
- Re-check live response headers and that `/.git` returns 404.

## Current host
Live: `https://karmaplay.francobernal.ca` on Cloudflare Pages, built from `main` with
`bash scripts/build-public.sh` into `_site/`. The repo stays public for portfolio view only
(proprietary, see LICENSE).

## Checklist before flipping private
- [ ] Cloudflare project live and tested on phone + cheap tablet
- [ ] francobernal.ca link updated
- [ ] OG meta URLs point at Cloudflare host + image
- [ ] Service worker cache name bumped if host changes
- [ ] Old github.io either redirects or is retired
- [ ] Repo visibility set to private
- [ ] No secrets in git history
