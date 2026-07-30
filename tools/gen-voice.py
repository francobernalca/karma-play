#!/usr/bin/env python3
"""Generate natural female neural voice pack (Edge Aria, same family as Andrew)."""
import asyncio
import json
import pathlib
import edge_tts

VOICE = "en-US-AriaNeural"
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


async def one(key: str, text: str):
    path = OUT / f"{key}.mp3"
    if path.exists() and path.stat().st_size > 500:
        return key, "skip"
    # Warm, slightly slower for toddlers (Aria Online Natural)
    c = edge_tts.Communicate(text, VOICE, rate="-8%", pitch="+4Hz")
    await c.save(str(path))
    return key, path.stat().st_size


async def main():
    words = build_words()
    print(f"generating {len(words)} clips with {VOICE}")
    sem = asyncio.Semaphore(4)

    async def run(k, t):
        async with sem:
            try:
                return await one(k, t)
            except Exception as e:
                return k, f"ERR {e}"

    results = await asyncio.gather(*[run(k, t) for k, t in words.items()])
    ok = sum(1 for _, r in results if isinstance(r, int) or r == "skip")
    err = [x for x in results if isinstance(x[1], str) and str(x[1]).startswith("ERR")]
    print("ok", ok, "err", len(err))
    for e in err[:10]:
        print(e)
    manifest = {
        "voice": VOICE,
        "family": "Microsoft Edge Online Natural (female Aria; peer of Andrew)",
        "count": len(words),
        "keys": sorted(words.keys()),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    total = sum(p.stat().st_size for p in OUT.glob("*.mp3"))
    print("total_mb", round(total / 1024 / 1024, 2))


if __name__ == "__main__":
    asyncio.run(main())
