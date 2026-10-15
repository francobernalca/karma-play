import re, tempfile, subprocess
from pathlib import Path

html = Path("index.html").read_text(encoding="utf-8")
assert "2.2.0" in html
assert "sIntro" in html
assert "startIntroPlayback" in html
assert "intro.mp4" in html
assert Path("intro.mp4").exists()
assert Path("intro.mp4").stat().st_size > 100_000
# Welcome must start hidden so intro is first
assert 'id="sWelcome"' in html
idx = html.find('id="sWelcome"')
assert "hide" in html[idx - 40 : idx]
m = re.search(r"<script>(.*?)</script>", html, re.S)
p = Path(tempfile.gettempdir()) / "kp22.js"
p.write_text(m.group(1), encoding="utf-8")
r = subprocess.run(["node", "--check", str(p)], capture_output=True, text=True)
assert r.returncode == 0, r.stderr
print("OK intro_mb", round(Path("intro.mp4").stat().st_size / 1024 / 1024, 2))
