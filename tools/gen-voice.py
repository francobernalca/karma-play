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
import edge_tts

# Happy, clear female (Edge Online Natural; peer family of Andrew).
VOICE = "en-US-JennyNeural"
# Andrew-like energy for kids: a bit faster + brighter (not slow call-center).
RATE = "+12%"
PITCH = "+10Hz"

OUT = pathlib.Path(__file__).resolve().parent.parent / "voice"
OUT.mkdir(exist_ok=True)

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


async def one(key: str, text: str, force: bool):
    path = OUT / f"{key}.mp3"
    if not force and path.exists() and path.stat().st_size > 500:
        return key, "skip"
    c = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
    await c.save(str(path))
    size = path.stat().st_size
    if size < 800:
        raise RuntimeError(f"clip too small ({size} bytes)")
    return key, size


async def main(force: bool = False):
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
    args = ap.parse_args()
    asyncio.run(main(force=args.force))
