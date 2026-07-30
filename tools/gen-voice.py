#!/usr/bin/env python3
"""Generate natural female neural voice pack for Karma Play.

Uses Microsoft Edge Online Natural (same family as Karma Race's Andrew pack).
Female default: en-US-AvaNeural — warmer, more human than Aria, never OS/browser TTS.
"""
import argparse
import asyncio
import json
import pathlib
import edge_tts

# Premium natural female (peer quality class to Andrew Online Natural).
VOICE = "en-US-AvaNeural"
OUT = pathlib.Path(__file__).resolve().parent.parent / "voice"
OUT.mkdir(exist_ok=True)

NUM_WORDS = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
}
ANIMALS = {
    "dog": "dog", "cat": "cat", "bunny": "bunny", "bear": "bear", "panda": "panda",
    "lion": "lion", "tiger": "tiger", "cow": "cow", "pig": "pig", "monkey": "monkey",
    "fox": "fox", "frog": "frog", "penguin": "penguin", "duck": "duck", "horse": "horse",
    "chicken": "chicken", "giraffe": "giraffe", "elephant": "elephant", "zebra": "zebra",
    "koala": "koala",
}
SHAPES = {
    "triangle": "triangle", "circle": "circle", "square": "square",
    "diamond": "diamond", "star": "star", "heart": "heart",
}
COLORS = {
    "red": "red", "blue": "blue", "green": "green",
    "yellow": "yellow", "purple": "purple", "orange": "orange",
}
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
    for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        words[f"L{ch}"] = ch
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
    # Slightly slower for toddlers; leave pitch natural (pitch hacks sound synthetic)
    c = edge_tts.Communicate(text, VOICE, rate="-5%")
    await c.save(str(path))
    return key, path.stat().st_size


async def main(force: bool = False):
    words = build_words()
    print(f"generating {len(words)} clips with {VOICE} force={force}")
    sem = asyncio.Semaphore(3)

    async def run(k, t):
        async with sem:
            try:
                return await one(k, t, force)
            except Exception as e:
                return k, f"ERR {e}"

    results = await asyncio.gather(*[run(k, t) for k, t in words.items()])
    ok = sum(1 for _, r in results if isinstance(r, int) or r == "skip")
    err = [x for x in results if isinstance(x[1], str) and str(x[1]).startswith("ERR")]
    print("ok", ok, "err", len(err))
    for e in err[:10]:
        print(e)
    if err:
        raise SystemExit(f"voice generation failed for {len(err)} clips")
    manifest = {
        "voice": VOICE,
        "family": "Microsoft Edge Online Natural (female Ava; peer of Andrew used in Karma Race)",
        "rate": "-5%",
        "count": len(words),
        "keys": sorted(words.keys()),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    total = sum(p.stat().st_size for p in OUT.glob("*.mp3"))
    print("total_mb", round(total / 1024 / 1024, 2))


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="Regenerate every clip even if present")
    args = ap.parse_args()
    asyncio.run(main(force=args.force))
