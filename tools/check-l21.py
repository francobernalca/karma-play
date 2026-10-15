import re, tempfile, subprocess
from pathlib import Path

html = Path("index.html").read_text(encoding="utf-8")
print("ver", "2.1.0" in html)
print("wide_gone", "class=\"tCard wide\"" not in html and "tCard wide" not in html)
print("scene", "tScene" in html)
print("voice", "playVoiceFile" in html)
print("media_self", "media-src 'self'" in html)
print("conflict", "<<<<<<" not in html)
m = re.search(r"<script>(.*?)</script>", html, re.S)
p = Path(tempfile.gettempdir()) / "kp21.js"
p.write_text(m.group(1), encoding="utf-8")
r = subprocess.run(["node", "--check", str(p)], capture_output=True, text=True)
print("js", "OK" if r.returncode == 0 else r.stderr)
print("mp3", len(list(Path("voice").glob("*.mp3"))))
for k in ["LA", "N1", "Adog", "Cred", "Plevelup", "Pdino", "Pwow"]:
    f = Path("voice") / f"{k}.mp3"
    print(k, "ok" if f.exists() and f.stat().st_size > 500 else "MISSING")
