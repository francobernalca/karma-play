#!/usr/bin/env python3
"""Build voice2/ for Karma Play: trim, normalise and re-encode every clip.

Inputs
  voice/*.mp3              the v1 Jenny clips that are still used (item names, world names)
  tools/.voice2-raw/*.mp3  new prompt clips from `python tools/gen-voice.py --pack v2`

Output
  voice2/<key>.mp3         mono 24 kHz MP3 ~48 kbps, leading and trailing silence cut to ~40 ms,
                           loudness matched (voiced RMS -18 dBFS, peaks under -1 dBFS)
  voice2/manifest.json     voice settings plus every clip's text and duration

Checks (the build fails loudly on any of these)
  - a raw clip whose speech runs into its last 30 ms (truncated by the TTS service)
  - a clip whose voiced part is implausibly short for its text
  - a missing or empty output

/voice/* is cached immutable for a year, so v2 lives in its own folder and never
overwrites v1. Requires ffmpeg on PATH and numpy.
"""
import importlib.util
import json
import pathlib
import subprocess
import sys

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
V1 = ROOT / "voice"
RAW2 = HERE / ".voice2-raw"
OUT = ROOT / "voice2"
SR = 24000
PAD = int(0.040 * SR)          # keep ~40 ms of room either side of the speech
HOP = int(0.005 * SR)          # 5 ms analysis frames
REL_DB = -40.0                 # speech starts/ends where the frame RMS is within 40 dB of the loudest frame
TARGET_RMS_DB = -18.0
PEAK_CEIL = 10 ** (-1.0 / 20)

spec = importlib.util.spec_from_file_location("genvoice", HERE / "gen-voice.py")
gv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gv)

# v1 clips that v2 still speaks, with the text they say. The short praise lines and
# "Find it!" stay as fallbacks the game uses until the matching v2 prompt exists.
V1_KEEP = {k: v for k, v in gv.build_words().items()
           if k[0] in "LNACS" or k in (
               "Pletsplay", "Pdino", "Pcars", "Pocean", "Probot", "Pspace", "Pfantasy",
               "Pfind", "Pgreatjob", "Pyay", "Psuper", "Pwow", "Pamazing", "Pgold")}
V2_NEW = gv.build_words_v2()


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def encode(x, path):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
         "-map_metadata", "-1", "-c:a", "libmp3lame", "-b:a", "48k", "-ar", str(SR), "-ac", "1", str(path)],
        input=x.astype(np.float32).tobytes(), check=True)


def frames_rms(x):
    n = len(x) // HOP
    f = x[: n * HOP].reshape(n, HOP)
    return np.sqrt((f * f).mean(axis=1) + 1e-12)


def process(key, text, src):
    x = decode(src)
    rms = frames_rms(x)
    peak_db = 20 * np.log10(rms.max())
    thr = 10 ** ((peak_db + REL_DB) / 20)
    voiced = np.where(rms > thr)[0]
    if len(voiced) == 0:
        raise SystemExit(f"{key}: no speech found")
    first, last = voiced[0], voiced[-1]
    # Truncation: speech still loud in the final 30 ms of what the service returned.
    tail = rms[-6:]
    truncated = bool((20 * np.log10(tail.max() + 1e-12)) > peak_db - 30)
    start = max(0, first * HOP - PAD)
    end = min(len(x), (last + 1) * HOP + PAD)
    y = x[start:end].copy()
    v = frames_rms(y)
    loud = v[v > thr]
    voiced_rms = float(np.sqrt((loud ** 2).mean()))
    gain = min(10 ** (TARGET_RMS_DB / 20) / voiced_rms, PEAK_CEIL / (np.abs(y).max() + 1e-9))
    y *= gain
    fi, fo = int(0.006 * SR), int(0.020 * SR)
    y[:fi] *= np.linspace(0, 1, fi)
    y[-fo:] *= np.linspace(1, 0, fo)
    dst = OUT / f"{key}.mp3"
    encode(y, dst)
    voiced_ms = (last - first + 1) * HOP * 1000 / SR
    letters = sum(c.isalnum() for c in text)
    return {
        "key": key, "text": text,
        "raw_ms": round(len(x) * 1000 / SR), "ms": round(len(y) * 1000 / SR),
        "voiced_ms": round(voiced_ms), "lead_cut_ms": round(start * 1000 / SR),
        "truncated": truncated, "letters": letters,
        "gain_db": round(float(20 * np.log10(gain)), 1), "bytes": dst.stat().st_size,
    }


def main():
    OUT.mkdir(exist_ok=True)
    # A v2 clip replaces the v1 clip of the same key (Pfantasy: "Fantasy World!").
    jobs = {k: (t, V1 / f"{k}.mp3") for k, t in V1_KEEP.items()}
    not_yet = []
    for k, t in V2_NEW.items():
        src = RAW2 / f"{k}.mp3"
        if src.exists() and src.stat().st_size > 800:
            jobs[k] = (t, src)
        else:
            not_yet.append(k)
    missing = [str(s) for _, s in jobs.values() if not s.exists()]
    if missing:
        raise SystemExit(f"missing v1 sources: {missing[:6]}")
    for stale in OUT.glob("*.mp3"):
        if stale.stem not in jobs:
            stale.unlink()
    jobs = [(k, t, s) for k, (t, s) in jobs.items()]
    rows, problems = [], []
    for k, t, s in jobs:
        r = process(k, t, s)
        rows.append(r)
        # A clip is suspect if it is cut at the end, or far too short for its words
        # (Jenny speaks ~12-16 letters per second at +12% rate; single letters are short by nature).
        if r["truncated"]:
            problems.append(f"{k}: speech reaches the end of the raw clip (truncated)")
        if r["letters"] >= 6 and r["voiced_ms"] < r["letters"] * 40:
            problems.append(f"{k}: voiced {r['voiced_ms']} ms is too short for '{t}'")
    manifest = {
        "pack": "v2", "voice": gv.VOICE, "rate": gv.RATE, "pitch": gv.PITCH,
        "format": "mp3 mono 24 kHz 48 kbps, silence trimmed to 40 ms, voiced RMS -18 dBFS",
        "count": len(rows),
        "clips": {r["key"]: {"text": r["text"], "ms": r["ms"]} for r in sorted(rows, key=lambda r: r["key"])},
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    # The game imports the clip list as a module (no runtime fetch of the manifest, so the
    # immutable /voice2/ cache rule never pins a stale list). Prompt clips that exist are
    # used; any that do not fall back to "Find it!" plus the item's own name.
    clips = json.dumps({r["key"]: r["ms"] for r in sorted(rows, key=lambda r: r["key"])}, separators=(",", ":"))
    js = ("// Generated by tools/voice2-build.py. Do not edit by hand.\n"
          "export const VOICE_DIR = 'voice2/';\n"
          f"export const CLIPS = {clips};\n")
    (ROOT / "js" / "voice-pack.js").write_text(js, encoding="utf-8", newline="\n")
    tot = sum(r["bytes"] for r in rows)
    print(f"{len(rows)} clips, {tot/1024:.0f} KB, mean {np.mean([r['ms'] for r in rows]):.0f} ms "
          f"(raw mean {np.mean([r['raw_ms'] for r in rows]):.0f} ms), "
          f"mean lead cut {np.mean([r['lead_cut_ms'] for r in rows]):.0f} ms")
    if not_yet:
        print(f"{len(not_yet)} v2 prompt clips not generated yet (the game falls back): {', '.join(not_yet[:6])}...")
    if problems:
        print("PROBLEMS:\n  " + "\n  ".join(problems))
        sys.exit(1)


if __name__ == "__main__":
    main()
