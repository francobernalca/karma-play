# Security & privacy · Karma Play

## Product promises
- **No ads. No accounts. No analytics. No trackers.**
- Gameplay works offline. Progress is stored only in the browser (`localStorage` on the player's device).
- No personal data is collected or transmitted by the game.

## What is public (intentional)
This repository is public so people can view the work; the game itself is served by
Cloudflare Pages at karmaplay.francobernal.ca. Public does **not** mean free to copy or re-host as your product
(see LICENSE). Public surface should contain **only**:
- Game HTML/CSS/JS and static assets (icons, OG image, manifest, service worker)
- License, README, this file, migration notes
- No secrets, tokens, env files, personal documents, or deploy credentials

## What must never be committed
- `.env`, API tokens, Cloudflare/GitHub secrets, private keys
- Personal documents, certificates, family info, addresses, IDs
- Client contracts, invoices, or any non-game business files
- Source maps that embed private machine paths (not used here)
- Git history that ever held secrets (rotate + rewrite if that ever happens)

## Headers & deploy hardening
- Cloudflare Pages builds `bash scripts/build-public.sh`, which publishes only what
  `.publicfiles` names. docs/, tools/, lab/ and scripts/ never ship.
- `_headers` sends a strict Content-Security-Policy: `script-src 'self'` and
  `style-src 'self'` with no `'unsafe-inline'` (the game is ES modules plus one
  stylesheet), `connect-src 'self'`, no third-party origins at all. The meta CSP in
  `index.html` mirrors it.
- `frame-ancestors` allows only francobernal.ca, which embeds the game. There is
  deliberately no X-Frame-Options header (see the note in `_headers`).
- The service worker caches same-origin files only.
- No external CDNs, fonts, analytics or trackers. The font is self-hosted (OFL).

ose `.git`, env, or source maps.

## Reporting
If you find a security issue in the public game, contact Franco via
[francobernal.ca](https://francobernal.ca). Do not open public issues with exploit detail.
