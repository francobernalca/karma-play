# Karma Play

Free, offline balloon-popping learning game for kids (about ages 2-6).
Tap balloons, hear playful sounds, build streaks, complete gentle missions,
and level up across colorful worlds. Letters, numbers, shapes, and animals
show up as you play so learning stays inside the fun, not as homework UI.

**No ads. No accounts. No tracking. Works offline.**

## Play

**Live:** [francobernalca.github.io/karma-play](https://francobernalca.github.io/karma-play/)

Or open `index.html` in any browser. On a phone or tablet, use **Add to Home Screen**
for a fullscreen app-like experience (PWA).

## Level 2.2 features

- Silent autoplay intro video, then main PLAY screen (mobile, tablet, desktop)
- Six equal world portals (Dino, Cars, Ocean, Robot, Space, Fantasy) with mini scenes
- Glossy balloons, confetti, streaks, combos, gold stars
- Power balloons: rainbow, slow-mo, mega chain
- Gentle missions (letters, numbers, animals, colors, shapes) with no fail states
- Natural female voice pack (Microsoft Michelle Online Natural; same Edge neural family as Karma Race Andrew, female)
- Color, count-chain, and find-it learning inside the pop loop
- Adaptive quality so low-end tablets stay smooth
- Layered generative music and satisfying synthesized SFX
- Haptics when the device supports vibration
- Local stars, day streak, and pop stats (device only)
- Installable PWA with offline cache

## Privacy

Nothing leaves the device for gameplay. The game saves only:

- play counts / stars / day streak
- music and voice preferences
- letters and numbers seen (for local progress feel)

Stored in browser `localStorage`. Clear site data to reset.

## Security

See [SECURITY.md](SECURITY.md). Public surface is the playable game only: no secrets,
no personal files, no analytics SDKs.

## Future private + Cloudflare path

If the product grows and source should stop being public while play stays free,
follow [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md).

## Stack

Vanilla HTML / CSS / JS. No build step. No dependencies. Web Audio API only
(no audio files). Service worker for offline.

## License

Proprietary. See [LICENSE](LICENSE).

This repository is public so people can play the free game and learn from the work.
That does **not** grant permission to copy, redistribute, deploy, host, sell, or use
it commercially. All rights reserved unless you have written permission from the author.

Made by Franco Bernal · [francobernal.ca](https://francobernal.ca)

© 2026 Franco Bernal
