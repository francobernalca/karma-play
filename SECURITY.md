# Security & privacy — Karma Play

## Product promises
- **No ads. No accounts. No analytics. No trackers.**
- Gameplay works offline. Progress is stored only in the browser (`localStorage` on the player's device).
- No personal data is collected or transmitted by the game.

## What is public (intentional)
This repository is public so the free game can run on GitHub Pages and people can
view the work. Public does **not** mean free to copy or re-host as your product
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
GitHub Pages does not support custom `_headers` the way Cloudflare Pages does.
This game still hardens via:
- Content-Security-Policy meta (no third-party scripts/connect)
- `referrer: no-referrer`
- Service worker that only caches same-origin assets
- No external CDNs, fonts, or analytics

When moving to **Cloudflare Pages** (private product path), use the headers in
`docs/CLOUDFLARE.md` so deploys never expose `.git`, env, or source maps.

## Reporting
If you find a security issue in the public game, contact Franco via
[francobernal.ca](https://francobernal.ca). Do not open public issues with exploit detail.
