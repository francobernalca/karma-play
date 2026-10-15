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
3. Publish only the static root (this folder's playable files):
   - `index.html`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `og-card.jpg`, `robots.txt`
   - Optional: keep `LICENSE` visible on the free host; omit internal docs from publish if you prefer.
4. Attach a free hostname, e.g. `play.francobernal.ca` or `karmaplay.pages.dev`.
5. On francobernal.ca, change the play link to the Cloudflare URL (301/redirect or href update).
6. Disable or archive the public github.io site so there is one canonical free URL.

## Cloudflare `_headers` (put at site root on Pages)
```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), microphone=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin

/*.map
  X-Robots-Tag: noindex
  Cache-Control: no-store
```

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

## GitHub Pages (current)
Live: `https://francobernalca.github.io/karma-play/`
Source branch: `main` root. Public for free play + portfolio view only (proprietary).

## Checklist before flipping private
- [ ] Cloudflare project live and tested on phone + cheap tablet
- [ ] francobernal.ca link updated
- [ ] OG meta URLs point at Cloudflare host + image
- [ ] Service worker cache name bumped if host changes
- [ ] Old github.io either redirects or is retired
- [ ] Repo visibility set to private
- [ ] No secrets in git history
