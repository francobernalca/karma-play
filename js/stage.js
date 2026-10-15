// Karma Play stage: one canvas for balloons, strings, latex shards, confetti and the
// floating item. One rAF loop, time-based motion, pooled particles, sprites rendered once
// per colour and item, devicePixelRatio capped at 2, no per-frame filters or shadows.
// Adaptive quality lowers resolution and particle counts only. It never touches speed,
// size or how many balloons there are, so difficulty never changes with the device.

import {
  COLORS, GOLD, CREAM, INK, PASTELS, ANIMAL_BALLOON, SPRITE, ANIMALS, SHAPES, SHAPE_INK,
  makeBalloonBody, makeGloss, makeItemSprite, makeShard, svgImage, animalSVG, shapeSVG,
  lighten, darken, rgba, contrast, drawGlyphs, textWidth, dots,
} from './art.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const STR_N = 9;                 // verlet points per string
const SPRING_K = 520, SPRING_C = 15;
const HIT_DELAY = 0.11;          // squash, spring back, then pop (seconds)

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The colour a glyph is printed in on cream (the floating card): the balloon colour,
// deepened until it clears 3.4:1, so yellow and orange stay legible.
export function inkOnCream(c) {
  let t = 0, out = c;
  while (contrast(out, CREAM) < 3.4 && t < 0.8) { t += 0.05; out = darken(c, t); }
  return out;
}

// Which latex an item rides on.
export function balloonColorFor(item, pick) {
  if (item.kind === 'gold') return GOLD;
  if (item.kind === 'color') return COLORS[item.value].fill;
  if (item.kind === 'animal') return PASTELS[ANIMAL_BALLOON[item.value]];
  if (item.kind === 'shape') return PASTELS[Object.keys(PASTELS)[SHAPES.indexOf(item.value) % 6]];
  return COLORS[pick || 'red'].fill;
}

export class Stage {
  constructor(canvas, { onPop = () => {}, onLeave = () => {}, onMiss = () => {} } = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.onPop = onPop; this.onLeave = onLeave; this.onMiss = onMiss;
    this.balloons = [];
    this.loose = [];
    this.shards = []; this.shardFree = [];
    this.puffs = []; this.puffFree = [];
    this.floaters = [];
    this.cache = new Map();        // composite balloon sprites, LRU
    this.parts = new Map();        // bodies, gloss, floating cards
    this.imgs = {};
    this.quality = 2;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.k = this.dpr;
    this.w = 0; this.h = 0; this.R = 44;
    this.speedScale = 1;
    this.stringColor = 'rgba(52,56,80,.42)';
    this.puffColors = ['#F2D6A2', '#EAB9B3', '#BFD8C9', '#C9C3E6'];
    this.insetTop = 0; this.insetSide = 0; this.insetBottom = 0;
    this.focusIdx = -1; this.kbd = false;
    this.running = false; this.raf = 0; this.last = 0;
    this.stats = { frames: 0, work: new Float32Array(240), gap: new Float32Array(240), wi: 0, qualityChanges: 0 };
    this._winT = 0; this._winN = 0; this._winSum = 0; this._good = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const r = seeded(77);
    this.shardPaths = Array.from({ length: 24 }, () => makeShard(r, 1));
    this._frame = this._frame.bind(this);
    this._onDown = this._onDown.bind(this);
    canvas.addEventListener('pointerdown', this._onDown);
    canvas.addEventListener('keydown', e => this._onKey(e));
    canvas.addEventListener('focus', () => { if (this.focusIdx < 0) this.focusIdx = 0; });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._halt();
      else if (this.running) this._kick();
    });
    this.resize();
  }

  /* ---------------------------------------------------------------- setup */

  async prepare() {
    const jobs = [];
    for (const a of ANIMALS) jobs.push(svgImage(animalSVG(a, 'width="256" height="256"')).then(i => { this.imgs['a:' + a] = i; }));
    for (const s of SHAPES) jobs.push(svgImage(shapeSVG(s, SHAPE_INK, 'width="200" height="200"')).then(i => { this.imgs['s:' + s] = i; }));
    await Promise.all(jobs);
  }

  setWorld({ string, puff } = {}) {
    if (string) this.stringColor = string;
    if (puff) this.puffColors = puff;
  }

  // Reserved bands: the HUD row at the top and the safe areas. Balloons never spawn under
  // the side insets, and the hover band for Find candidates stays below the HUD.
  setInsets({ top = 0, side = 0, bottom = 0 } = {}) {
    this.insetTop = top; this.insetSide = side; this.insetBottom = bottom;
  }

  resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.rect = r;
    this.w = r.width; this.h = r.height;
    // At least 2 cm wide on a phone (76 CSS px), larger on big screens, never crowding.
    this.R = clamp(Math.min(this.w * 0.12, this.h * 0.085) + 2, 40, 66);
    this._applyK();
  }

  _applyK() {
    const q = this.quality;
    this.k = q === 2 ? this.dpr : q === 1 ? Math.min(this.dpr, 1.5) : 1;
    const W = Math.round(this.w * this.k), H = Math.round(this.h * this.k);
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
  }

  get maxBalloons() {
    const area = this.w * this.h;
    return area < 420000 ? 5 : area < 900000 ? 6 : 7;
  }

  /* ---------------------------------------------------------------- sprites */

  _part(key, make) {
    let p = this.parts.get(key);
    if (!p) { p = make(); this.parts.set(key, p); }
    return p;
  }

  _sprite(color, item, R) {
    const k = this.k, key = `${color}|${item ? item.key : '-'}|${R}|${k}`;
    let s = this.cache.get(key);
    if (s) { this.cache.delete(key); this.cache.set(key, s); return s; }
    const body = this._part(`b|${color}|${R}|${k}`, () => makeBalloonBody(color, R, k));
    const gloss = this._part(`g|${R}|${k}`, () => makeGloss(R, k));
    s = document.createElement('canvas');
    s.width = body.width; s.height = body.height;
    const x = s.getContext('2d');
    x.drawImage(body, 0, 0);
    if (item && item.kind !== 'color') {
      const img = item.kind === 'animal' ? this.imgs['a:' + item.value] : item.kind === 'shape' ? this.imgs['s:' + item.value] : null;
      const ink = item.ink || CREAM;
      x.drawImage(makeItemSprite(item, R, k, ink, img), 0, 0);
    }
    x.drawImage(gloss, 0, 0);
    this.cache.set(key, s);
    if (this.cache.size > 56) this.cache.delete(this.cache.keys().next().value);
    return s;
  }

  // The card that floats up after a pop: the item large on cream, with its word in the
  // Karma Play hand where a word helps (animals, shapes, colours).
  _card(b) {
    const R = this.R, k = this.k, it = b.item, key = `c|${it.key}|${b.color}|${R}|${k}`;
    return this._part(key, () => {
      const D = 1.04 * R, word = it.kind === 'animal' || it.kind === 'shape' ? it.value : it.kind === 'color' ? it.value : '';
      const cap = 0.46 * R, ww = word ? textWidth(word, 14) * cap / 100 : 0;
      const pillH = word ? cap * 1.7 : 0, pillW = ww + cap * 1.3;
      const W = Math.ceil(Math.max(2 * D, pillW) + 28), H = Math.ceil((it.kind === 'color' ? 0 : 2 * D) + (word ? pillH + 10 : 0) + 30);
      const c = document.createElement('canvas');
      c.width = Math.ceil(W * k); c.height = Math.ceil(H * k);
      const x = c.getContext('2d');
      x.scale(k, k);
      const cx = W / 2, cy = 14 + D;
      x.shadowColor = 'rgba(42,39,64,.2)'; x.shadowBlur = 14; x.shadowOffsetY = 4;
      x.fillStyle = CREAM;
      const ink = inkOnCream(b.color);
      if (it.kind !== 'color') { x.beginPath(); x.arc(cx, cy, D, 0, TAU); x.fill(); }
      const py = it.kind === 'color' ? 14 : cy + D + 8;
      if (word) {
        x.beginPath(); x.roundRect(cx - pillW / 2, py, pillW, pillH, pillH / 2); x.fill();
      }
      x.shadowColor = 'transparent';
      if (it.kind === 'letter') drawGlyphs(x, it.value + it.value.toLowerCase(), cx, cy + 0.04 * D, 0.82 * D, ink, 0.15);
      else if (it.kind === 'number') {
        const n = +it.value;
        drawGlyphs(x, String(n), cx, cy - 0.3 * D, 0.72 * D, ink, 0.16);
        const P = dots(n), sp = 0.2 * D, r = n > 6 ? 0.075 * D : 0.085 * D;
        x.fillStyle = ink;
        for (const [dx, dy] of P) { x.beginPath(); x.arc(cx + dx * sp, cy + 0.46 * D + dy * sp * 0.85, r, 0, TAU); x.fill(); }
      } else if (it.kind === 'animal') {
        const s = 1.62 * D;
        x.drawImage(this.imgs['a:' + it.value], cx - s / 2, cy - s / 2, s, s);
      } else if (it.kind === 'shape') {
        const s = 1.25 * D;
        x.drawImage(this.imgs['s:' + it.value], cx - s / 2, cy - s / 2, s, s);
      }
      if (word) {
        if (it.kind === 'color') {
          x.fillStyle = b.color;
          x.beginPath(); x.arc(cx - ww / 2 - cap * 0.05, py + pillH / 2, cap * 0.2, 0, TAU); x.fill();
        }
        drawGlyphs(x, word, cx + (it.kind === 'color' ? cap * 0.25 : 0), py + pillH / 2 - cap * 0.2, cap, it.kind === 'color' ? ink : INK, 0.15);
      }
      c.cssW = W; c.cssH = H; c.ox = cx; c.oy = cy;
      return c;
    });
  }

  /* ---------------------------------------------------------------- balloons */

  // Spawn a balloon just below the bottom edge. `hoverY` makes it settle and bob there
  // (Find candidates), so a toddler always has time.
  spawn({ item = null, color, x, speed, hoverY = null, target = false, golden = false, lane } = {}) {
    const R = this.R, side = this.insetSide + R * 1.15;
    if (x == null) x = this._freeX(side);
    x = clamp(x, side, this.w - side);
    const base = clamp(this.h / 9.5, 58, 104);
    const b = {
      item, color, R, x0: x, x, y: this.h + R * 1.3 + rnd(0, R * 0.6), vx: 0,
      speed: speed || base * rnd(0.88, 1.12), t: 0, ph: rnd(0, TAU), w: rnd(0.55, 0.9), amp: rnd(5, 12),
      rot: 0, sq: 0, sqv: 0, state: 'rise', hitT: 0, hoverY, target, golden, wob: 0, alpha: 1,
      tones: [lighten(color, 0.1), color, darken(color, 0.16)], id: ++Stage._id, lane,
    };
    b.str = this._newString(b);
    this._sprite(color, item, R);
    // Render the floating card while the balloon rises, not in the frame it pops.
    if (item && item.kind !== 'gold') {
      const warm = () => { if (b.state !== 'gone') this._card(b); };
      if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 600 }); else setTimeout(warm, 120);
    }
    this.balloons.push(b);
    return b;
  }

  // The spawn point farthest from every balloon still low on screen, so new balloons
  // never stack on top of each other as they enter.
  _freeX(side) {
    const span = this.w - side * 2;
    if (span <= 0) return this.w / 2;
    const y0 = this.h + this.R * 1.3;
    let best = side + Math.random() * span, bestD = -1;
    for (let i = 0; i < 14; i++) {
      const x = side + Math.random() * span;
      let d = 1e9;
      for (const b of this.balloons) {
        if (b.state !== 'rise' || b.y < this.h * 0.35) continue;
        const dx = (b.x - x) / this.R, dy = (b.y - y0) / this.R;
        d = Math.min(d, Math.sqrt(dx * dx + dy * dy * 0.6));
      }
      if (d > bestD) { bestD = d; best = x; }
    }
    return best;
  }

  _newString(b) {
    const L = b.R * 1.75, seg = L / (STR_N - 1), pts = new Float32Array(STR_N * 4);
    const kx = b.x, ky = b.y + 1.25 * b.R;
    for (let i = 0; i < STR_N; i++) {
      pts[i * 4] = pts[i * 4 + 2] = kx;
      pts[i * 4 + 1] = pts[i * 4 + 3] = ky + i * seg;
    }
    return { pts, seg, alpha: 1 };
  }

  count() { return this.balloons.filter(b => b.state === 'rise').length; }

  // Round end: what is left floats away, calmly but noticeably faster.
  releaseAll() {
    for (const b of this.balloons) { b.hoverY = null; b.target = false; }
    this.speedScale = 3.2;
  }

  clear() {
    this.balloons.length = 0; this.loose.length = 0; this.floaters.length = 0;
    for (const s of this.shards) this.shardFree.push(s);
    this.shards.length = 0;
    for (const p of this.puffs) this.puffFree.push(p);
    this.puffs.length = 0;
    this.speedScale = 1; this.focusIdx = -1;
  }

  setWobble(b, on) { if (b) b.wob = on ? 0.0001 : 0; }

  /* ---------------------------------------------------------------- input */

  hitTest(px, py) {
    let best = null, bestD = 1;
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      if (b.state !== 'rise') continue;
      const dx = (px - b.x) / (b.R * 1.3), dy = (py - (b.y + 0.02 * b.R)) / (b.R * 1.16 * 1.3);
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = b; }
    }
    return best;
  }

  _onDown(e) {
    this.kbd = false;
    const r = this.rect || this.cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const b = this.hitTest(x, y);
    if (b) this.hit(b, true);
    else this.onMiss(x, y);
  }

  _onKey(e) {
    const live = this.balloons.filter(b => b.state === 'rise' && b.y < this.h - b.R * 0.4 && b.y > -b.R);
    if (!live.length) return;
    live.sort((a, b) => a.x - b.x);
    const cur = live.indexOf(this._focused);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { this._focused = live[(cur + 1) % live.length]; this.kbd = true; e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { this._focused = live[(cur - 1 + live.length) % live.length]; this.kbd = true; e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.kbd = true;
      const b = cur >= 0 ? live[cur] : live[0];
      this.hit(b, true);
      this._focused = null;
    }
  }

  focused() {
    if (this._focused && this._focused.state === 'rise') return this._focused;
    if (!this.kbd) return null;
    let low = null;
    for (const b of this.balloons) if (b.state === 'rise' && b.y < this.h - b.R * 0.4 && (!low || b.y > low.y)) low = b;
    this._focused = low;
    return low;
  }

  hit(b, byUser) {
    if (b.state !== 'rise') return;
    b.state = 'hit';
    b.hitT = 0;
    b.byUser = byUser;
    if (this.reduced.matches) this._pop(b);
    else b.sqv += 5.5;
  }

  /* ---------------------------------------------------------------- effects */

  _pop(b) {
    b.state = 'gone';
    const i = this.balloons.indexOf(b);
    if (i >= 0) this.balloons.splice(i, 1);
    if (this._focused === b) this._focused = null;
    const R = b.R, reduced = this.reduced.matches;
    const n = this.quality === 0 ? 8 : 12;
    for (let j = 0; j < n; j++) {
      const s = this.shardFree.pop() || {};
      const a = (j / n) * TAU + rnd(-0.25, 0.25), d = rnd(0.55, 1.0);
      s.x = b.x + Math.cos(a) * R * d * 0.9; s.y = b.y + Math.sin(a) * R * d;
      const sp = reduced ? rnd(10, 40) : rnd(140, 340);
      s.vx = Math.cos(a) * sp + b.vx * 0.3; s.vy = Math.sin(a) * sp - (reduced ? 0 : rnd(40, 140));
      s.r = rnd(0, TAU); s.vr = reduced ? 0 : rnd(-9, 9); s.flip = rnd(0, TAU); s.vf = reduced ? 0 : rnd(5, 12);
      s.size = R * rnd(0.26, 0.42); s.path = this.shardPaths[(Math.random() * 24) | 0];
      s.color = b.tones[j % 3]; s.life = 0; s.max = rnd(0.9, 1.25);
      this.shards.push(s);
    }
    const m = reduced ? 0 : this.quality === 0 ? 4 : 9;
    for (let j = 0; j < m; j++) {
      const p = this.puffFree.pop() || {};
      const a = rnd(0, TAU), sp = rnd(50, 150);
      p.x = b.x; p.y = b.y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 40;
      p.r = rnd(2.4, 4.4); p.c = j % 3 === 0 ? b.tones[0] : this.puffColors[j % this.puffColors.length];
      p.life = 0; p.max = rnd(0.5, 0.8);
      this.puffs.push(p);
    }
    const st = b.str;
    st.alpha = 1;
    this.loose.push(st);
    if (b.item && b.item.kind !== 'gold' && b.byUser) this.floaters.push({ card: this._card(b), x: b.x, y: b.y, t: reduced ? 0 : -0.07 });   // the burst reads first, then the card blooms
    this.onPop(b);
  }

  /* ---------------------------------------------------------------- loop */

  start() {
    if (this.running) return;
    this.running = true;
    this._kick();
  }

  stop() { this.running = false; this._halt(); }

  _kick() {
    if (this.raf || document.hidden) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this._frame);
  }

  _halt() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }

  _frame(now) {
    this.raf = requestAnimationFrame(this._frame);
    const t0 = performance.now();
    const gap = now - this.last;
    this.last = now;
    const dt = clamp(gap / 1000, 0, 0.05);
    this.update(dt);
    this.draw();
    const work = performance.now() - t0, S = this.stats;
    S.work[S.wi % 240] = work; S.gap[S.wi % 240] = gap; S.wi++; S.frames++;
    this._adapt(gap);
  }

  // Quality steps by measured frame gaps over 2 s windows. Only resolution and particle
  // counts change. 30 fps (iOS Low Power Mode) settles one step down and stays there.
  _adapt(gap) {
    if (gap > 250) return;           // tab switch, not load
    this._winSum += gap; this._winN++;
    if (this._winSum < 2000) return;
    const mean = this._winSum / this._winN;
    this._winSum = 0; this._winN = 0;
    if (mean > 26 && this.quality > 0) { this.quality--; this._good = 0; this._requality(); }
    else if (mean < 18) { if (++this._good >= 3 && this.quality < 2) { this.quality++; this._good = 0; this._requality(); } }
    else this._good = 0;
  }

  _requality() {
    this.stats.qualityChanges++;
    this.cache.clear(); this.parts.clear();
    this._applyK();
  }

  update(dt) {
    const H = this.h, reduced = this.reduced.matches;
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      b.t += dt;
      if (b.state === 'hit') {
        b.hitT += dt;
        if (b.hitT >= HIT_DELAY) { this._pop(b); continue; }
      }
      // rise, or settle and bob at the hover line
      let vy = -b.speed * this.speedScale;
      if (b.hoverY != null && b.state === 'rise') {
        const d = b.y - b.hoverY;
        vy = -clamp(d * 0.9, -b.speed * 0.4, b.speed);
      }
      if (b.state === 'hit') vy *= 0.3;
      b.y += vy * dt;
      const swayAmp = reduced ? b.amp * 0.4 : b.amp;
      const nx = b.x0 + Math.sin(b.t * b.w + b.ph) * swayAmp + (b.hoverY != null && !reduced ? Math.sin(b.t * 1.7) * 3 : 0);
      b.vx = dt > 0 ? (nx - b.x) / dt : 0;
      b.x = nx;
      let rot = (reduced ? 0.02 : 0.055) * Math.sin(b.t * b.w * 0.8 + b.ph + 1) + clamp(b.vx * 0.0014, -0.05, 0.05);
      if (b.wob > 0 && !reduced) {
        b.wob += dt;
        const ph = b.wob % 1.6;
        if (ph < 0.9) rot += Math.sin(ph * 21) * 0.16 * (1 - ph / 0.9);
        if (ph < dt * 1.5) b.sqv += 2.2;
      }
      b.rot = rot;
      const acc = -SPRING_K * b.sq - SPRING_C * b.sqv;
      b.sqv += acc * dt; b.sq += b.sqv * dt;
      this._stepString(b.str, b, dt);
      if (b.y + b.R * 3.2 < 0) {
        this.balloons.splice(i, 1);
        if (this._focused === b) this._focused = null;
        b.state = 'gone';
        this.onLeave(b);
      }
    }
    for (let i = this.loose.length - 1; i >= 0; i--) {
      const s = this.loose[i];
      s.alpha -= dt * 1.4;
      if (s.alpha <= 0) { this.loose.splice(i, 1); continue; }
      this._stepString(s, null, dt);
    }
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.life += dt;
      if (s.life >= s.max || s.y > H + 60) { this.shards[i] = this.shards[this.shards.length - 1]; this.shards.pop(); this.shardFree.push(s); continue; }
      const drag = Math.exp(-2.2 * dt);
      s.vx *= drag; s.vy = s.vy * drag + (reduced ? 120 : 1250) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.vr * dt; s.flip += s.vf * dt;
    }
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.life += dt;
      if (p.life >= p.max) { this.puffs[i] = this.puffs[this.puffs.length - 1]; this.puffs.pop(); this.puffFree.push(p); continue; }
      const drag = Math.exp(-3.4 * dt);
      p.vx *= drag; p.vy = p.vy * drag + 160 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt;
      if (f.t > 1.35) this.floaters.splice(i, 1);
    }
  }

  _stepString(s, b, dt) {
    const p = s.pts, seg = s.seg, g = 520 * dt * dt;
    if (b) {
      const sy = 1 - b.sq, L = 1.25 * b.R * sy;
      p[0] = b.x - Math.sin(b.rot) * L; p[1] = b.y + Math.cos(b.rot) * L;
      p[2] = p[0]; p[3] = p[1];
    }
    for (let i = b ? 1 : 0; i < STR_N; i++) {
      const o = i * 4, x = p[o], y = p[o + 1];
      const vx = (x - p[o + 2]) * 0.97, vy = (y - p[o + 3]) * 0.97;
      p[o + 2] = x; p[o + 3] = y;
      p[o] = x + vx; p[o + 1] = y + vy + (b ? g : g * 2.4);
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < STR_N - 1; i++) {
        const a = i * 4, c = a + 4;
        const dx = p[c] - p[a], dy = p[c + 1] - p[a + 1];
        const d = Math.sqrt(dx * dx + dy * dy) || 1e-6, diff = (d - seg) / d;
        if (i === 0 && b) { p[c] -= dx * diff; p[c + 1] -= dy * diff; }
        else { p[a] += dx * diff * 0.5; p[a + 1] += dy * diff * 0.5; p[c] -= dx * diff * 0.5; p[c + 1] -= dy * diff * 0.5; }
      }
    }
  }

  draw() {
    const x = this.ctx, k = this.k;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, this.cv.width, this.cv.height);
    x.setTransform(k, 0, 0, k, 0, 0);
    // loose strings fall behind everything
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = 1.6;
    x.strokeStyle = this.stringColor;
    for (const s of this.loose) { x.globalAlpha = Math.max(0, s.alpha); this._strokeString(s.pts); }
    x.globalAlpha = 1;
    const reduced = this.reduced.matches, foc = this.focused();
    for (const b of this.balloons) {
      this._strokeString(b.str.pts);
      const spr = this._sprite(b.color, b.item, b.R), R = b.R;
      const sq = clamp(b.sq, -0.25, 0.3), sx = 1 + sq * 0.75, sy = 1 - sq;
      x.save();
      x.translate(b.x, b.y);
      x.rotate(b.rot);
      x.scale(sx, sy);
      if (b.target && reduced && b.wob > 0) {
        x.strokeStyle = 'rgba(255,248,236,.9)'; x.lineWidth = 4;
        x.beginPath(); x.ellipse(0, 0.02 * R, R * 1.22, R * 1.36, 0, 0, TAU); x.stroke();
      }
      x.drawImage(spr, -SPRITE.w * R / 2, -SPRITE.oy * R, SPRITE.w * R, SPRITE.h * R);
      if (b === foc) {
        x.lineWidth = 3.5; x.strokeStyle = INK;
        x.beginPath(); x.ellipse(0, 0.02 * R, R * 1.2, R * 1.34, 0, 0, TAU); x.stroke();
        x.lineWidth = 2; x.strokeStyle = CREAM;
        x.beginPath(); x.ellipse(0, 0.02 * R, R * 1.27, R * 1.41, 0, 0, TAU); x.stroke();
      }
      x.restore();
      x.lineWidth = 1.6; x.strokeStyle = this.stringColor;
    }
    for (const s of this.shards) {
      const t = s.life / s.max;
      x.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      x.fillStyle = s.color;
      x.setTransform(k, 0, 0, k, s.x * k, s.y * k);
      x.rotate(s.r);
      x.scale(s.size, s.size * (0.35 + 0.65 * Math.abs(Math.cos(s.flip))));
      x.fill(s.path);
    }
    x.setTransform(k, 0, 0, k, 0, 0);
    for (const p of this.puffs) {
      const t = p.life / p.max;
      x.globalAlpha = 1 - t * t;
      x.fillStyle = p.c;
      x.beginPath(); x.arc(p.x, p.y, p.r * (1 - t * 0.4), 0, TAU); x.fill();
    }
    for (const f of this.floaters) {
      const t = f.t, c = f.card;
      if (t < 0) continue;
      let s = 1, a = 1, dy;
      if (reduced) { a = t < 0.15 ? t / 0.15 : t > 1.05 ? Math.max(0, 1 - (t - 1.05) / 0.3) : 1; dy = 0; }
      else {
        const e = Math.min(1, t / 0.32);
        s = 0.55 + 0.45 * (1 + 2.2 * Math.pow(e - 1, 3) + 1.2 * Math.pow(e - 1, 2));
        a = t > 1.0 ? Math.max(0, 1 - (t - 1.0) / 0.35) : 1;
        dy = -46 * (1 - Math.pow(1 - Math.min(1, t / 1.35), 2));
      }
      x.globalAlpha = a;
      const fx = clamp(f.x, c.cssW / 2 + 8, this.w - c.cssW / 2 - 8), fy = clamp(f.y + dy, c.oy + this.insetTop, this.h - c.cssH + c.oy - 8);
      x.setTransform(k * s, 0, 0, k * s, fx * k, fy * k);
      x.drawImage(c, -c.ox, -c.oy, c.cssW, c.cssH);
    }
    x.globalAlpha = 1;
    x.setTransform(k, 0, 0, k, 0, 0);
  }

  _strokeString(p) {
    const x = this.ctx;
    x.beginPath();
    x.moveTo(p[0], p[1]);
    for (let i = 1; i < STR_N - 1; i++) {
      const o = i * 4, mx = (p[o] + p[o + 4]) / 2, my = (p[o + 1] + p[o + 5]) / 2;
      x.quadraticCurveTo(p[o], p[o + 1], mx, my);
    }
    const e = (STR_N - 1) * 4;
    x.lineTo(p[e], p[e + 1]);
    x.stroke();
  }

  frameStats() {
    const S = this.stats, n = Math.min(S.wi, 240);
    const w = Array.from(S.work.slice(0, n)).sort((a, b) => a - b), g = Array.from(S.gap.slice(0, n)).sort((a, b) => a - b);
    const q = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0;
    return { frames: S.frames, workP50: q(w, 0.5), workP95: q(w, 0.95), gapP50: q(g, 0.5), gapP95: q(g, 0.95), quality: this.quality, k: this.k, qualityChanges: S.qualityChanges };
  }

  resetStats() { this.stats.wi = 0; this.stats.frames = 0; }
}
Stage._id = 0;
