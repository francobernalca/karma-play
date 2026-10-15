# Karma Play

A free balloon game for toddlers (about ages 2 to 6). Balloons float up; a tap pops
one and a warm voice names what was inside: letters A to Z, numbers 1 to 10, twenty
animals, six colours and six shapes. There is no way to fail.

**No ads. No accounts. No tracking. Works offline.**

**Play:** [karmaplay.francobernal.ca](https://karmaplay.francobernal.ca)

On a phone or tablet, add it to the home screen. Open it once online and every
picture, balloon and voice clip then works without a connection.

## How it plays

- **Start:** the Karma Play wordmark, three balloons drifting up, one big Play button.
- **Six worlds:** Dino, Cars, Ocean, Robot, Space and Fantasy, each a layered vector
  scene with slow ambient life. Tapping a world says its name.
- **A round** is 10 pops (or 6, set by a grown-up). Balloons rise calmly, at most 5 to 7
  on screen, each at least 2 cm wide with a generous hit area. Every pop names the item
  and floats it up large, with its word for animals, shapes and colours.
- **Find moments:** every third or fourth pop the voice asks for one thing ("Find it! B!")
  while two to four candidates float. After 6 seconds idle the target wobbles and the
  question repeats. Popping another balloon still pops: the voice names it and asks again.
- **Stickers:** a rare golden balloon gives a sticker (the world's hero or an animal)
  for the sticker book.
- **A natural stopping point:** the round ends by itself, the balloons float away, and
  the next round never starts on its own.
- **What comes first:** A to H, 1 to 4 and five animals. The set widens as the child
  meets things (tracked on the device only). Numbers above 10 never appear.

## Parent corner

The lock in the top corner opens it: hold for 2 seconds, then tap the number asked for
in words. Inside: music, pop sounds and voice; round length; a daily play time that
takes effect at the end of a round (never a countdown); what your child has seen and
found; how to use Guided Access (iPhone, iPad) and App pinning (Android); how to add
the game to the home screen; reset progress.

## Privacy

Nothing leaves the device. The game requests only its own files and saves one key in
`localStorage` (settings, items seen and found, stickers, today's play time), written at
the end of a round and when a setting changes. No analytics, no third-party scripts,
no third-party fonts.

## How it is built

Vanilla HTML, CSS and ES modules. No framework, no build step for the code, no
dependencies at runtime.

- `index.html`: the shell. `styles.css`: the one stylesheet.
- `js/game.js`: screens, rounds, Find moments, stickers, parent corner, storage.
- `js/stage.js`: one canvas for balloons (squash and spring, verlet strings), latex
  fragments, confetti and the floating item card. One rAF loop, pooled particles,
  devicePixelRatio capped at 2, adaptive resolution that never changes difficulty.
- `js/art.js`: every picture as code (SVG and canvas): worlds, heroes, animals, shapes,
  icons, the wordmark, and the Karma Play hand, a ball-and-stick alphabet with
  single-storey a and g for every word a child sees.
- `js/audio.js`: one AudioContext, music, pop and voice buses into a limiter;
  generative music on a lookahead scheduler; one voice queue that never drops praise.
- `js/content.js`: items and sequencing. `js/voice-pack.js`: the clip list (generated).
- `sw.js`: precaches the game and all voice clips. `voice2/`: the voice pack.
- `assets/`: font, icons, social card (immutable: new bytes get a new file name).

Security headers live in `_headers`; the public file list in `.publicfiles`
(`bash scripts/build-public.sh` builds `_site/` from it). `lab/` holds the art contact
sheet and the balloon physics lab; they are never published.

## Voice

Microsoft Edge neural voice en-US-JennyNeural, rate +12%, pitch +10 Hz.

- `python tools/gen-voice.py` generates the v2 prompt clips ("Find the letter B!",
  "You found it!", "All done! Great popping." and more) into `tools/.voice2-raw/`.
- `python tools/voice2-build.py` trims every clip to 40 ms of silence, matches loudness,
  encodes mono 24 kHz MP3, checks for truncation, and writes `voice2/`,
  `voice2/manifest.json` and `js/voice-pack.js`. Needs ffmpeg and numpy.
- Until a prompt clip exists, the game says "Find it!" followed by the item's own name.
- `/voice/` (the v1 pack) and `/voice2/` are cached for a year: never change the bytes
  of an existing clip name.

## License

Proprietary. See [LICENSE](LICENSE).

This repository is public so people can play the free game and learn from the work.
That does **not** grant permission to copy, redistribute, deploy, host, sell, or use
it commercially. All rights reserved unless you have written permission from the author.

Made by Franco Bernal · [francobernal.ca](https://francobernal.ca)

© 2026 Franco Bernal
