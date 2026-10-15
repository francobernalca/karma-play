#!/usr/bin/env python3
"""Generate happy, kid-game neural voice pack for Karma Play.

Same Microsoft Edge Online Natural family as Karma Race's Andrew pack,
but female and tuned for energy (brighter pitch + slightly faster rate).
Jenny is friendlier and more animated than flat "assistant" voices.
Never use OS/browser TTS (Zira etc).

Avoid Ava/Emma on this pipeline (truncated clips). Avoid Michelle for kids
(reads call-center / corporate).
"""
import argparse
import asyncio
import json
import pathlib
import os

import edge_tts
import edge_tts.communicate as _etc
import edge_tts.constants as _etk


def _pin_client_version(full: str) -> None:
    """The speech service rejects (HTTP 403) a client version it considers stale.
    edge-tts pins one at release time; pass the version of a current Edge build
    (for example `EDGE_CLIENT_VERSION=155.0.4283.45`) to keep the same voice working
    without upgrading the package. The voice, rate and pitch are unchanged."""
    major = full.split(".", 1)[0]
    gec = f"1-{full}"
    _etk.CHROMIUM_FULL_VERSION, _etk.CHROMIUM_MAJOR_VERSION, _etk.SEC_MS_GEC_VERSION = full, major, gec
    if hasattr(_etc, "SEC_MS_GEC_VERSION"):
        _etc.SEC_MS_GEC_VERSION = gec
    ua = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
          f"Chrome/{major}.0.0.0 Safari/537.36 Edg/{major}.0.0.0")
    for headers in (_etk.BASE_HEADERS, _etk.WSS_HEADERS, _etk.VOICE_HEADERS):
        headers["User-Agent"] = ua


if os.environ.get("EDGE_CLIENT_VERSION"):
    _pin_client_version(os.environ["EDGE_CLIENT_VERSION"])

# Happy, clear female (Edge Online Natural; peer family of Andrew).
VOICE = "en-US-JennyNeural"
# Andrew-like energy for kids: a bit faster + brighter (not slow call-center).
RATE = "+12%"
PITCH = "+10Hz"

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "voice"
# Pack v2: new prompt clips are generated raw here, then trimmed and normalised
# into voice2/ by tools/voice2-build.py. /voice/* is immutable on the CDN, so
# v2 never overwrites it.
RAW2 = pathlib.Path(__file__).resolve().parent / ".voice2-raw"

NUM_WORDS = {
    "1": "one!", "2": "two!", "3": "three!", "4": "four!", "5": "five!",
    "6": "six!", "7": "seven!", "8": "eight!", "9": "nine!", "10": "ten!",
}
ANIMALS = {
    "dog": "dog!", "cat": "cat!", "bunny": "bunny!", "bear": "bear!", "panda": "panda!",
    "lion": "lion!", "tiger": "tiger!", "cow": "cow!", "pig": "pig!", "monkey": "monkey!",
    "fox": "fox!", "frog": "frog!", "penguin": "penguin!", "duck": "duck!", "horse": "horse!",
    "chicken": "chicken!", "giraffe": "giraffe!", "elephant": "elephant!", "zebra": "zebra!",
    "koala": "koala!",
}
SHAPES = {
    "triangle": "triangle!", "circle": "circle!", "square": "square!",
    "diamond": "diamond!", "star": "star!", "heart": "heart!",
}
COLORS = {
    "red": "red!", "blue": "blue!", "green": "green!",
    "yellow": "yellow!", "purple": "purple!", "orange": "orange!",
}
# Short, punchy celebration lines (keep length game-safe)
PHRASES = {
    "wow": "Wow!",
    "yay": "Yay!",
    "amazing": "Amazing!",
    "greatjob": "Great job!",
    "levelup": "Level up!",
    "gold": "Gold star!",
    "mission": "Mission complete!",
    "find": "Find it!",
    "super": "Super!",
    "letsplay": "Let's play!",
    "tapme": "Tap me!",
    "dino": "Dino World!",
    "cars": "Car World!",
    "ocean": "Ocean World!",
    "robot": "Robot World!",
    "fantasy": "Fantasy Kingdom!",
    "space": "Space World!",
}


# v2: spoken "Find" prompt per item, round and world lines, sticker names.
NUM_NAMES = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
}
PHRASES_V2 = {
    "tryagain": "Try again!",
    "foundit": "You found it!",
    "yes": "Yes!",
    "greatpopping": "Great popping!",
    "alldone": "All done! Great popping.",
    "fantasy": "Fantasy World!",
    "askgrownup": "Ask a grown-up.",
    "sticker": "Sticker!",
    "rest": "Time for a rest. See you soon!",
}
HEROES = {
    "dino": "Dino!", "car": "Race car!", "whale": "Whale!",
    "robot": "Robot!", "rocket": "Rocket!", "unicorn": "Unicorn!",
}


def build_words_v2():
    words = {}
    for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        words[f"FL{ch}"] = f"Find the letter {ch}!"
    for k, v in NUM_NAMES.items():
        words[f"FN{k}"] = f"Find number {v}!"
    for k in ANIMALS:
        words[f"FA{k}"] = f"Find the {k}!"
    for k in COLORS:
        words[f"FC{k}"] = f"Find a {k} balloon!"
    for k in SHAPES:
        words[f"FS{k}"] = f"Find the {k}!"
    for k, v in PHRASES_V2.items():
        words[f"P{k}"] = v
    for k, v in HEROES.items():
        words[f"H{k}"] = v
    return words


def build_words():
    words = {}
    # Letter names with a light lift so they do not sound flat
    for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        words[f"L{ch}"] = f"{ch}!"
    for k, v in NUM_WORDS.items():
        words[f"N{k}"] = v
    for k, v in ANIMALS.items():
        words[f"A{k}"] = v
    for k, v in SHAPES.items():
        words[f"S{k}"] = v
    for k, v in COLORS.items():
        words[f"C{k}"] = v
    for k, v in PHRASES.items():
        words[f"P{k}"] = v
    return words


async def one(key: str, text: str, force: bool, out: pathlib.Path = OUT):
    path = out / f"{key}.mp3"
    if not force and path.exists() and path.stat().st_size > 500:
        return key, "skip"
    c = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await c.save(str(path))
    size = path.stat().st_size
    if size < 800:
        raise RuntimeError(f"clip too small ({size} bytes)")
    return key, size


async def main_v2(force: bool = False):
    """Generate the v2 prompt clips raw (serially, same voice, rate and pitch)."""
    RAW2.mkdir(exist_ok=True)
    words = build_words_v2()
    print(f"v2: generating {len(words)} clips with {VOICE} rate={RATE} pitch={PITCH}")
    err = []
    for i, (k, t) in enumerate(words.items(), 1):
        try:
            r = await one(k, t, force, RAW2)
        except Exception as e:  # keep going, report at the end
            r = (k, f"ERR {e}")
            err.append(r)
        if i % 15 == 0 or i == len(words):
            print(f"  {i}/{len(words)} {r[0]}={r[1]}")
        await asyncio.sleep(0.05)
    (RAW2 / "texts.json").write_text(json.dumps(words, indent=2), encoding="utf-8")
    if err:
        raise SystemExit(f"v2 generation failed for {len(err)} clips: {err[:5]}")
    print("v2 raw clips ready in", RAW2, "- now run tools/voice2-build.py")


async def main(force: bool = False):
    OUT.mkdir(exist_ok=True)
    words = build_words()
    print(f"generating {len(words)} clips with {VOICE} rate={RATE} pitch={PITCH} force={force}")
    # Serial generation: concurrent Edge calls often truncate energetic rate/pitch packs
    results = []
    for i, (k, t) in enumerate(words.items(), 1):
        try:
            r = await one(k, t, force)
        except Exception as e:
            r = (k, f"ERR {e}")
        results.append(r)
        if i % 15 == 0 or i == len(words):
            print(f"  {i}/{len(words)} {r[0]}={r[1]}")
        await asyncio.sleep(0.05)

    ok = sum(1 for _, r in results if isinstance(r, int) or r == "skip")
    err = [x for x in results if isinstance(x[1], str) and str(x[1]).startswith("ERR")]
    print("ok", ok, "err", len(err))
    for e in err[:10]:
        print(e)
    if err:
        raise SystemExit(f"voice generation failed for {len(err)} clips")

    sizes = [p.stat().st_size for p in OUT.glob("*.mp3")]
    # Short energetic clips often share a minimum MP3 frame size; uniqueness matters more.
    hashes = {p.read_bytes() for p in OUT.glob("*.mp3")}
    if len(hashes) < len(words) * 0.9:
        raise SystemExit(
            f"voice pack looks duplicated ({len(hashes)} unique of {len(words)})"
        )

    manifest = {
        "voice": VOICE,
        "family": "Microsoft Edge Online Natural (female Jenny; happy kids tone; peer of Andrew)",
        "rate": RATE,
        "pitch": PITCH,
        "count": len(words),
        "keys": sorted(words.keys()),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    total = sum(sizes)
    print("unique_sizes", len(set(sizes)), "total_mb", round(total / 1024 / 1024, 2))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="Regenerate every clip even if present")
    ap.add_argument("--pack", choices=["v1", "v2"], default="v2",
                    help="v2 (default) generates the new prompt clips for voice2/; v1 rebuilds voice/")
    args = ap.parse_args()
    asyncio.run(main_v2(force=args.force) if args.pack == "v2" else main(force=args.force))
