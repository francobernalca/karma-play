// Karma Play art. Every picture in the game is drawn here, as SVG strings for the DOM
// and canvas routines for the stage. No images, no emoji, no fonts for the learning glyphs.
//
// One style everywhere: rounded geometric shapes, matte fills with one soft gradient,
// a gentle top light, 2-4 tones per object, no outlines. Balloons are the most saturated
// things on screen because they are what the child learns from.

/* ------------------------------------------------------------------ colour */

export const INK = '#2A2740';
export const CREAM = '#FFF7EC';

// The six learning colours. `ink` is the colour a letter or number is printed in on that
// balloon, chosen so the glyph clears 3:1 against the balloon body.
export const COLORS = {
  red:    { fill: '#E2453C', ink: CREAM },
  orange: { fill: '#F07F2D', ink: '#4A2308' },
  yellow: { fill: '#F4C02F', ink: '#5A3A08' },
  green:  { fill: '#2F9A54', ink: CREAM },
  blue:   { fill: '#2F7ED6', ink: CREAM },
  purple: { fill: '#8A57C8', ink: CREAM },
};
export const COLOR_NAMES = Object.keys(COLORS);

// Softer latex for animal and shape balloons, so the six learning colours stay special.
export const PASTELS = {
  mint: '#A3D5BF', sky: '#A6C8E8', peach: '#F2BF9C', lilac: '#C7B5E4', butter: '#EBD891', rose: '#E9B4C2',
};
export const GOLD = '#DDA63C';

export function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function toHex([r, g, b]) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
}
export const lighten = (c, t) => mix(c, '#ffffff', t);
export const darken = (c, t) => mix(c, '#14101e', t);
export function rgba(c, a) { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; }
export function luminance(c) {
  return hex(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* ------------------------------------------------------------------ helpers */

let _uid = 0;
const uid = p => `${p}${(++_uid).toString(36)}`;
const lin = (id, a, b, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const rad = (id, stops, cx = 0.38, cy = 0.3, r = 0.85) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
// One soft top-lit gradient for a body colour: light from above, a touch deeper below.
function soft(defs, base, amt = 0.14) {
  const id = uid('g');
  defs.push(lin(id, lighten(base, amt), darken(base, amt * 0.6)));
  return `url(#${id})`;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f1 = n => Math.round(n * 10) / 10;
export const svg = (vb, body, attrs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${attrs}>${body}</svg>`;

/* ------------------------------------------------------------------ glyphs */
// Karma Play's own letters: ball-and-stick capitals, the manuscript form preschool alphabets
// teach (circles and straight sticks, single-storey a). Drawn as strokes with round ends,
// cap height 100, baseline y=100. Lowercase is only what the wordmark needs.

export const GLYPHS = {
  A: [92, 'M6 100 L46 0 L86 100 M21 63 H71'],
  B: [72, 'M10 100 V0 H35 A24 24 0 0 1 35 48 H10 M10 48 H39 A26 26 0 0 1 39 100 H10'],
  C: [94, 'M89 17 A50 50 0 1 0 89 83'],
  D: [84, 'M10 100 V0 H28 A50 50 0 0 1 28 100 Z'],
  E: [66, 'M64 0 H10 V100 H64 M10 50 H54'],
  F: [64, 'M62 0 H10 V100 M10 50 H52'],
  G: [102, 'M89 17 A50 50 0 1 0 102 52 H64'],
  H: [80, 'M10 0 V100 M70 0 V100 M10 50 H70'],
  I: [52, 'M6 0 H46 M26 0 V100 M6 100 H46'],
  J: [64, 'M56 0 V68 A26 26 0 0 1 4 68'],
  K: [76, 'M10 0 V100 M70 0 L10 60 M31 40 L72 100'],
  L: [62, 'M10 0 V100 H60'],
  M: [104, 'M10 100 V0 L52 66 L94 0 V100'],
  N: [84, 'M10 100 V0 L74 100 V0'],
  O: [104, 'M2 50 A50 50 0 1 1 102 50 A50 50 0 1 1 2 50 Z'],
  P: [72, 'M10 100 V0 H38 A26 26 0 0 1 38 52 H10'],
  Q: [106, 'M2 50 A50 50 0 1 1 102 50 A50 50 0 1 1 2 50 Z M64 66 L100 104'],
  R: [76, 'M10 100 V0 H38 A26 26 0 0 1 38 52 H10 M37 52 L72 100'],
  S: [74, 'M62 13 A28 25.5 0 1 0 37 51 A30 24.5 0 1 1 10 88'],
  T: [84, 'M2 0 H82 M42 0 V100'],
  U: [80, 'M10 0 V62 A30 38 0 0 0 70 62 V0'],
  V: [92, 'M4 0 L46 100 L88 0'],
  W: [128, 'M4 0 L32 100 L64 8 L96 100 L124 0'],
  X: [88, 'M6 0 L82 100 M82 0 L6 100'],
  Y: [88, 'M4 0 L44 52 L84 0 M44 52 V100'],
  Z: [80, 'M6 0 H74 L6 100 H74'],
  0: [76, 'M4 50 A34 50 0 1 1 72 50 A34 50 0 1 1 4 50 Z'],
  1: [48, 'M8 22 L34 0 V100'],
  2: [76, 'M9 30 A30 28 0 1 1 64 46 C56 62 30 78 8 100 H70'],
  3: [72, 'M12 13 A27 25 0 1 1 36 50 H25 M36 50 A30 25 0 1 1 9 88'],
  4: [80, 'M56 100 V0 L4 68 H78'],
  5: [72, 'M64 0 H18 L15 43 A31 30 0 1 1 9 86'],
  6: [72, 'M58 3 Q16 22 6 70 M6 70 A30 30 0 1 0 66 70 A30 30 0 1 0 6 70 Z'],
  7: [76, 'M4 0 H72 L28 100'],
  8: [72, 'M13 24 A23 23 0 1 1 59 24 A23 23 0 1 1 13 24 Z M9 73 A27 27 0 1 1 63 73 A27 27 0 1 1 9 73 Z'],
  9: [72, 'M6 30 A30 30 0 1 1 66 30 A30 30 0 1 1 6 30 Z M66 30 V100'],
  // Lowercase, the manuscript forms children are taught: single-storey a and g, round
  // bowls, plain sticks (x-height 40..100, ascender 0, descender 128).
  a: [72, 'M4 70 A30 30 0 1 1 64 70 A30 30 0 1 1 4 70 Z M64 40 V100'],
  b: [74, 'M10 0 V100 M10 70 A30 30 0 1 1 70 70 A30 30 0 1 1 10 70 Z'],
  c: [64, 'M57 47 A30 30 0 1 0 57 93'],
  d: [72, 'M4 70 A30 30 0 1 1 64 70 A30 30 0 1 1 4 70 Z M64 0 V100'],
  e: [70, 'M6 70 H64 A29 30 0 1 0 55.5 91.2'],
  f: [54, 'M50 6 A20 20 0 0 0 24 24 V100 M6 42 H46'],
  g: [72, 'M4 70 A30 30 0 1 1 64 70 A30 30 0 1 1 4 70 Z M64 40 V110 A26 20 0 0 1 12 118'],
  h: [74, 'M10 0 V100 M10 66 A27 26 0 0 1 64 66 V100'],
  i: [20, 'M10 40 V100 M10 14 V14.5'],
  j: [40, 'M28 40 V110 A20 18 0 0 1 2 122 M28 14 V14.5'],
  k: [66, 'M10 0 V100 M60 40 L10 76 M28 63 L62 100'],
  l: [20, 'M10 0 V100'],
  m: [108, 'M10 100 V40 M10 64 A22 24 0 0 1 54 64 V100 M54 64 A22 24 0 0 1 98 64 V100'],
  n: [74, 'M10 40 V100 M10 66 A27 26 0 0 1 64 66 V100'],
  o: [68, 'M4 70 A30 30 0 1 1 64 70 A30 30 0 1 1 4 70 Z'],
  p: [74, 'M10 40 V128 M10 70 A30 30 0 1 1 70 70 A30 30 0 1 1 10 70 Z'],
  q: [72, 'M4 70 A30 30 0 1 1 64 70 A30 30 0 1 1 4 70 Z M64 40 V128'],
  r: [52, 'M10 40 V100 M10 68 C10 50 24 41 46 43'],
  s: [46, 'M38 48 A17 15 0 1 0 23 70.5 A18 14.7 0 1 1 6 93'],
  t: [48, 'M24 10 V100 M6 40 H44'],
  u: [74, 'M10 40 V74 A27 26 0 0 0 64 74 M64 40 V100'],
  v: [64, 'M4 40 L32 100 L60 40'],
  w: [88, 'M4 40 L24 100 L44 48 L64 100 L84 40'],
  x: [64, 'M6 40 L58 100 M58 40 L6 100'],
  y: [72, 'M6 40 L37 100 M66 40 L24 128'],
  z: [62, 'M6 40 H56 L6 100 H56'],
  ' ': [26, ''],
};

const _p2d = new Map();
function glyphPath2D(ch) {
  if (!_p2d.has(ch)) _p2d.set(ch, new Path2D(GLYPHS[ch][1]));
  return _p2d.get(ch);
}

// Width of a string of glyphs in glyph units (cap 100), with a fixed gap between glyphs.
export function textWidth(text, gap = 16) {
  let w = 0;
  for (const ch of text) w += GLYPHS[ch][0] + gap;
  return w - gap;
}

// Draw a glyph string centred on (cx, cy) with cap height `cap` px.
export function drawGlyphs(ctx, text, cx, cy, cap, color, weight = 0.16) {
  const s = cap / 100, gap = 16, w = textWidth(text, gap);
  ctx.save();
  ctx.translate(cx - (w * s) / 2, cy - cap / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = 100 * weight;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const ch of text) {
    if (GLYPHS[ch][1]) ctx.stroke(glyphPath2D(ch));
    ctx.translate(GLYPHS[ch][0] + gap, 0);
  }
  ctx.restore();
}

export function glyphSVG(text, color = INK, weight = 0.16, gap = 16, attrs = '') {
  const w = textWidth(text, gap), sw = 100 * weight, pad = sw / 2 + 2;
  const desc = /[gjpqy]/.test(text) ? 28 : 0;
  let x = 0, paths = '';
  for (const ch of text) {
    if (GLYPHS[ch][1]) paths += `<path transform="translate(${x} 0)" d="${GLYPHS[ch][1]}"/>`;
    x += GLYPHS[ch][0] + gap;
  }
  return svg(`${-pad} ${-pad} ${w + pad * 2} ${100 + desc + pad * 2}`,
    `<g fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`, attrs);
}
// A child-facing word in the Karma Play hand, sized by CSS (height in em, see .word).
export function wordSVG(text, cls = 'word') {
  return glyphSVG(text, 'currentColor', 0.15, 14, `class="${cls}${/[gjpqy]/.test(text) ? ' desc' : ''}" aria-hidden="true" focusable="false"`);
}

// Subitizing dots: dice patterns for 1-6, two rows for 7-10. Unit coordinates, centred on 0.
export function dots(n) {
  const D = {
    1: [[0, 0]],
    2: [[-1, 0], [1, 0]],
    3: [[-1, 0.9], [0, 0], [1, -0.9]],
    4: [[-1, -0.9], [1, -0.9], [-1, 0.9], [1, 0.9]],
    5: [[-1, -0.9], [1, -0.9], [0, 0], [-1, 0.9], [1, 0.9]],
    6: [[-1, -0.9], [0, -0.9], [1, -0.9], [-1, 0.9], [0, 0.9], [1, 0.9]],
  };
  if (D[n]) return D[n];
  const top = n <= 8 ? 4 : 5, bottom = n - top, out = [];
  for (let i = 0; i < top; i++) out.push([(i - (top - 1) / 2) * 1.05, -0.55]);
  for (let i = 0; i < bottom; i++) out.push([(i - (bottom - 1) / 2) * 1.05, 0.55]);
  return out;
}

/* ------------------------------------------------------------------ icons */
// One stroke system: 24 grid, 2px stroke, round ends. Used through an inline sprite.

export const ICONS = {
  home: '<path d="M4 11.4 12 4.6l8 6.8"/><path d="M6.5 9.6V19h11V9.6"/><path d="M10.2 19v-4.6h3.6V19"/>',
  pause: '<path d="M9 6.5v11M15 6.5v11"/>',
  play: '<path d="M8.6 6.4 17.8 12l-9.2 5.6z" fill="currentColor"/>',
  music: '<path d="M9 17.2V6.2l9-1.7v10.4"/><circle cx="6.8" cy="17.2" r="2.2"/><circle cx="15.8" cy="14.9" r="2.2"/>',
  musicOff: '<path d="M9 17.2V6.2l9-1.7v10.4"/><circle cx="6.8" cy="17.2" r="2.2"/><circle cx="15.8" cy="14.9" r="2.2"/><path d="M4 4l16 16"/>',
  voice: '<circle cx="9" cy="8.6" r="3.3"/><path d="M3.6 19.5c.5-3.6 2.8-5.3 5.4-5.3s4.9 1.7 5.4 5.3"/><path d="M16.8 7.2c1.4 1.5 1.4 3.9 0 5.4M19.4 5.2c2.6 2.7 2.6 6.9 0 9.6"/>',
  voiceOff: '<circle cx="9" cy="8.6" r="3.3"/><path d="M3.6 19.5c.5-3.6 2.8-5.3 5.4-5.3s4.9 1.7 5.4 5.3"/><path d="M4 4l16 16"/>',
  speaker: '<path d="M4.5 9.6H8l4.6-4v12.8L8 14.4H4.5z"/><path d="M16 9.2c1.3 1.5 1.3 4.1 0 5.6M18.7 6.6c2.7 2.9 2.7 7.9 0 10.8"/>',
  sounds: '<path d="M12 3.6c3.5 0 5.9 2.6 5.9 6 0 3.8-3 6.6-5.9 7.2-2.9-.6-5.9-3.4-5.9-7.2 0-3.4 2.4-6 5.9-6z"/><path d="M11.2 16.8h1.6l-.4 1.3h-.8z"/><path d="M12 18.1c0 1.6-1.4 2-.4 3.3"/>',
  back: '<path d="M19 12H5.6M11 6l-6 6 6 6"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/>',
  lock: '<rect x="5.8" y="10.6" width="12.4" height="9" rx="2.2"/><path d="M8.7 10.6V8a3.3 3.3 0 0 1 6.6 0v2.6"/><path d="M12 14.2v2"/>',
  close: '<path d="M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4"/>',
  replay: '<path d="M5.6 12a6.4 6.4 0 1 0 2.2-4.8"/><path d="M8.2 3.8 7.8 7.4l3.5.5"/>',
  check: '<path d="M5.5 12.6 10 17l8.5-9.6"/>',
};

export function iconSprite() {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="sprite" aria-hidden="true" focusable="false">${
    Object.entries(ICONS).map(([k, v]) =>
      `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('')
  }</svg>`;
}
export const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;

/* ------------------------------------------------------------------ latex balloon (SVG) */
// The SVG twin of the canvas balloon, for the wordmark, app icon and stickers.

const BALLOON_D = 'M0 -112C60 -112 100 -74 100 -14C100 44 56 96 7 116H-7C-56 96 -100 44 -100 -14C-100 -74 -60 -112 0 -112Z';
const KNOT_D = 'M-8 115H8L12 128Q0 124 -12 128Z';
export function balloonSVGGroup(color, defs, { string = true, stringColor = '#5B5670' } = {}) {
  const body = uid('b'), gl = uid('gl'), sub = uid('ss');
  defs.push(rad(body, [[0, lighten(color, 0.32)], [0.35, lighten(color, 0.07)], [0.78, color], [1, darken(color, 0.28)]], 0.3, 0.24, 0.95));
  defs.push(rad(gl, [[0, '#fff', 0.55], [1, '#fff', 0]], 0.5, 0.5, 0.5));
  defs.push(rad(sub, [[0, lighten(color, 0.3), 0.45], [1, lighten(color, 0.3), 0]], 0.5, 0.5, 0.5));
  return `${string ? `<path d="M0 128C-10 160 12 186 -2 222" fill="none" stroke="${stringColor}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` : ''}
  <path d="${KNOT_D}" fill="${darken(color, 0.18)}"/>
  <path d="${BALLOON_D}" fill="url(#${body})"/>
  <ellipse cx="18" cy="62" rx="52" ry="40" fill="url(#${sub})"/>
  <ellipse cx="-44" cy="-56" rx="26" ry="44" transform="rotate(-28 -44 -56)" fill="url(#${gl})"/>
  <ellipse cx="-56" cy="-76" rx="7" ry="11" transform="rotate(-28 -56 -76)" fill="#fff" opacity=".55"/>`;
}

/* ------------------------------------------------------------------ wordmark */

export function wordmarkSVG({ ink = INK, accent = COLORS.red.fill, attrs = 'role="img" aria-label="Karma Play"' } = {}) {
  // "Karma Play" in the Karma Play hand. The l of Play runs on into a string that holds
  // one latex balloon: every letter stays whole, and the mark still says what the game is.
  const sw = 15, gap = 15, defs = [];
  let x = 0, out = '', lx = 0;
  const put = ch => {
    if (ch === 'l') lx = x;
    out += `<path transform="translate(${x} 0)" d="${GLYPHS[ch][1]}"/>`;
    x += GLYPHS[ch][0] + gap;
  };
  for (const ch of 'Karma') put(ch);
  x += 30;
  for (const ch of 'Play') put(ch);
  const w = x - gap, R = 27, bx = lx + 10 + 24, by = -76;
  const kx = bx - 1.28 * R * Math.sin(0.14), ky = by + 1.28 * R * Math.cos(0.14);
  const string = `<path d="M${lx + 10} -4 C${lx + 10} -20 ${f1(kx - 6)} ${f1(ky + 18)} ${f1(kx)} ${f1(ky)}" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/>`;
  const balloon = `<g transform="translate(${bx} ${by}) rotate(8) scale(${R / 100})">${balloonSVGGroup(accent, defs, { string: false })}</g>`;
  const top = Math.floor(by - 1.14 * R - 6);
  return svg(`-10 ${top} ${w + 20} ${142 - top}`,
    `<defs>${defs.join('')}</defs>${string}<g fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${out}</g>${balloon}`,
    attrs);
}

/* ------------------------------------------------------------------ app icon */

export function appIconSVG({ maskable = false, size = 512 } = {}) {
  const defs = [], bg = uid('bg'), hl = uid('h');
  defs.push(lin(bg, '#9CC2D6', '#E6D3BE'));
  defs.push(lin(hl, '#86A992', '#6E917C'));
  const s = maskable ? 0.74 : 0.92;           // maskable: keep the balloon inside the 80% safe circle
  const balloon = balloonSVGGroup(COLORS.red.fill, defs, { stringColor: '#45506A' });
  const body = `<rect width="512" height="512" fill="url(#${bg})"/>
    <path d="M0 420C90 380 170 372 256 392S420 430 512 404V512H0Z" fill="url(#${hl})"/>
    <path d="M0 462C120 436 230 444 330 460S470 474 512 466V512H0Z" fill="#5F826D"/>
    <g transform="translate(256 ${maskable ? 236 : 226}) scale(${1.55 * s})">${balloon}
      <g transform="translate(-30 -60) scale(.6)" fill="none" stroke="${CREAM}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><path d="${GLYPHS.K[1]}"/></g>
    </g>`;
  return svg('0 0 512 512', `<defs>${defs.join('')}</defs>${body}`, `width="${size}" height="${size}"`);
}

/* ------------------------------------------------------------------ animals */
// Front-facing heads in a 100x100 box. Shared parts keep the family consistent.

export const ANIMALS = ['dog', 'cat', 'bunny', 'bear', 'panda', 'lion', 'tiger', 'cow', 'pig', 'monkey',
  'fox', 'frog', 'penguin', 'duck', 'horse', 'chicken', 'giraffe', 'elephant', 'zebra', 'koala'];
// The pastel latex each animal rides on, picked for contrast with its face.
export const ANIMAL_BALLOON = {
  dog: 'sky', cat: 'peach', bunny: 'lilac', bear: 'butter', panda: 'mint', lion: 'sky', tiger: 'mint',
  cow: 'sky', pig: 'mint', monkey: 'butter', fox: 'sky', frog: 'peach', penguin: 'butter', duck: 'lilac',
  horse: 'mint', chicken: 'sky', giraffe: 'lilac', elephant: 'peach', zebra: 'rose', koala: 'butter',
};

const EYE = '#2B2430';
const eye = (x, y, s = 1) =>
  `<ellipse cx="${x}" cy="${y}" rx="${f1(4.1 * s)}" ry="${f1(4.9 * s)}" fill="${EYE}"/><circle cx="${f1(x + 1.4 * s)}" cy="${f1(y - 1.9 * s)}" r="${f1(1.45 * s)}" fill="#fff"/>`;
const eyes = (y, dx = 10, s = 1) => eye(50 - dx, y, s) + eye(50 + dx, y, s);
const blush = (y, dx = 19, c = '#E8806F', o = 0.32) =>
  `<ellipse cx="${50 - dx}" cy="${y}" rx="5.2" ry="3.2" fill="${c}" opacity="${o}"/><ellipse cx="${50 + dx}" cy="${y}" rx="5.2" ry="3.2" fill="${c}" opacity="${o}"/>`;
const smile = (y, w = 4.5, c = EYE) =>
  `<path d="M${50 - w} ${y} Q${50 - w / 2} ${y + 3.6} 50 ${y} Q${50 + w / 2} ${y + 3.6} ${50 + w} ${y}" fill="none" stroke="${c}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`;
const mirror = (s) => `${s}<g transform="translate(100 0) scale(-1 1)">${s}</g>`;

const ANIMAL_ART = {
  dog(d) {
    const fur = '#C99A68', ear = '#7C5539';
    return `${mirror(`<path d="M24 30C12 30 7 46 10 60C12 70 22 72 27 62C30 54 30 40 24 30Z" fill="${soft(d, ear)}"/>`)}
      <ellipse cx="50" cy="53" rx="29" ry="28" fill="${soft(d, fur)}"/>
      <ellipse cx="60" cy="45" rx="9.5" ry="10" fill="${ear}" opacity=".55"/>
      <ellipse cx="50" cy="67" rx="15.5" ry="11.5" fill="#F2E1C7"/>
      ${eyes(46)}<ellipse cx="50" cy="60.5" rx="6.2" ry="4.6" fill="${EYE}"/><circle cx="51.6" cy="59.2" r="1.3" fill="#fff" opacity=".7"/>
      <path d="M50 65V68" stroke="${EYE}" stroke-width="2" stroke-linecap="round"/>${smile(68.5, 5)}`;
  },
  cat(d) {
    const fur = '#9EA6B8';
    return `${mirror(`<path d="M22 44L25 13Q26 10 29 12L46 28Z" fill="${fur}" stroke="${fur}" stroke-width="4" stroke-linejoin="round"/><path d="M27 34L28.5 19L39 29Z" fill="#E6B3B5"/>`)}
      <ellipse cx="50" cy="56" rx="31" ry="27" fill="${soft(d, fur)}"/>
      <ellipse cx="50" cy="68" rx="15" ry="9" fill="#EEF0F4"/>
      ${eyes(51, 11)}<path d="M46.5 62.5H53.5L50 66.5Z" fill="#D9878A" stroke="#D9878A" stroke-width="1.6" stroke-linejoin="round"/>
      ${smile(68, 4)}${mirror('<path d="M33 66H19M33 70.5L20 74" stroke="#6E7588" stroke-width="1.5" stroke-linecap="round"/>')}`;
  },
  bunny(d) {
    const fur = '#E4DED7', inner = '#EDB5BD';
    return `${mirror(`<ellipse cx="37" cy="24" rx="8.5" ry="22" transform="rotate(-8 37 24)" fill="${soft(d, fur)}"/><ellipse cx="37" cy="26" rx="4.2" ry="15" transform="rotate(-8 37 26)" fill="${inner}"/>`)}
      <ellipse cx="50" cy="62" rx="27" ry="24" fill="${soft(d, fur, 0.08)}"/>
      ${eyes(58, 10)}${blush(67, 17, '#E58D98', 0.4)}
      <path d="M47 66H53L50 69Z" fill="#D9808E" stroke="#D9808E" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M50 69V71.5" stroke="${EYE}" stroke-width="1.8" stroke-linecap="round"/>${smile(72, 4)}
      <rect x="47.4" y="73" width="5.2" height="5" rx="1.4" fill="#fff"/>`;
  },
  bear(d) {
    const fur = '#8F6143';
    return `${mirror(`<circle cx="26" cy="30" r="11.5" fill="${fur}"/><circle cx="26" cy="30" r="6" fill="#C08F6C"/>`)}
      <ellipse cx="50" cy="56" rx="30" ry="28" fill="${soft(d, fur)}"/>
      <ellipse cx="50" cy="67" rx="14.5" ry="11" fill="#D2AA88"/>
      ${eyes(49, 11)}<ellipse cx="50" cy="61.5" rx="6" ry="4.4" fill="${EYE}"/>
      <path d="M50 65.5V68" stroke="${EYE}" stroke-width="2" stroke-linecap="round"/>${smile(68.5, 4.5)}`;
  },
  panda(d) {
    const black = '#2E2D35';
    return `${mirror(`<circle cx="26" cy="29" r="11.5" fill="${black}"/>`)}
      <ellipse cx="50" cy="56" rx="31" ry="28" fill="${soft(d, '#F3F0EA', 0.06)}"/>
      ${mirror(`<ellipse cx="38" cy="51" rx="8.5" ry="11.5" transform="rotate(28 38 51)" fill="${black}"/>`)}
      ${mirror('<circle cx="39" cy="50" r="3.6" fill="#fff"/><circle cx="39.6" cy="50.4" r="2.1" fill="#2B2430"/>')}
      <ellipse cx="50" cy="63" rx="5.6" ry="3.9" fill="${black}"/>${smile(68, 4.5, black)}${blush(67, 21, '#E58D98', 0.35)}`;
  },
  lion(d) {
    const mane = '#B86F35', face = '#E8B25E';
    let scallops = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      scallops += `<circle cx="${f1(50 + Math.cos(a) * 33)}" cy="${f1(53 + Math.sin(a) * 32)}" r="12.5"/>`;
    }
    return `<g fill="${mane}">${scallops}<circle cx="50" cy="53" r="34"/></g>
      ${mirror(`<circle cx="31" cy="33" r="7.5" fill="${face}"/><circle cx="31" cy="33" r="3.8" fill="#C98C46"/>`)}
      <circle cx="50" cy="55" r="25" fill="${soft(d, face)}"/>
      ${mirror('<ellipse cx="44" cy="66" rx="7.5" ry="6" fill="#F6DDB0"/>')}
      ${eyes(50, 9.5, 0.95)}<path d="M45.5 60H54.5L50 64.5Z" fill="#6B3E27" stroke="#6B3E27" stroke-width="2" stroke-linejoin="round"/>
      ${smile(69, 4.2, '#6B3E27')}`;
  },
  tiger(d) {
    const fur = '#E58A3C', stripe = '#3A2A24';
    return `${mirror(`<circle cx="26" cy="30" r="10" fill="${fur}"/><circle cx="26" cy="30" r="5" fill="#F6E4CC"/>`)}
      <ellipse cx="50" cy="55" rx="31" ry="28" fill="${soft(d, fur)}"/>
      <path d="M22 62Q30 52 42 60Q50 54 58 60Q70 52 78 62Q72 80 50 82Q28 80 22 62Z" fill="#F7E7D2"/>
      <g fill="${stripe}"><path d="M50 28Q47 34 50 41Q53 34 50 28Z"/><path d="M41 30Q40 34 43 38Q44 33 41 30Z"/><path d="M59 30Q60 34 57 38Q56 33 59 30Z"/>
      ${mirror('<path d="M19 48Q26 47 30 51Q25 52 19 48Z"/><path d="M20 56Q26 55 29 58Q25 59 20 56Z"/>')}</g>
      ${eyes(49, 11)}<path d="M46 62H54L50 66Z" fill="#B85A4A" stroke="#B85A4A" stroke-width="2" stroke-linejoin="round"/>${smile(70, 4.2)}`;
  },
  cow(d) {
    const white = '#F2EEE7', spot = '#4E3F3A';
    return `${mirror(`<path d="M30 25Q26 12 33 9Q32 18 37 24Z" fill="#E7D7AE"/><ellipse cx="17" cy="42" rx="11" ry="6" transform="rotate(-18 17 42)" fill="${white}"/><ellipse cx="18" cy="42" rx="6" ry="3" transform="rotate(-18 18 42)" fill="#E9AEA6"/>`)}
      <ellipse cx="50" cy="51" rx="26" ry="28" fill="${soft(d, white, 0.06)}"/>
      <path d="M56 26Q72 26 74 40Q70 50 60 46Q52 40 56 26Z" fill="${spot}"/>
      <ellipse cx="50" cy="70" rx="20" ry="13" fill="#E9A99F"/>
      <ellipse cx="43" cy="70" rx="2.8" ry="3.6" fill="#9E5A55"/><ellipse cx="57" cy="70" rx="2.8" ry="3.6" fill="#9E5A55"/>
      ${eye(41, 47)}<ellipse cx="59" cy="47" rx="4.1" ry="4.9" fill="#fff"/><ellipse cx="59" cy="47" rx="3.2" ry="3.9" fill="${EYE}"/><circle cx="60.2" cy="45.4" r="1.2" fill="#fff"/>`;
  },
  pig(d) {
    const pink = '#EBA6A6';
    return `${mirror(`<path d="M24 38L22 20Q23 16 27 18L40 30Z" fill="#DE8F92" stroke="#DE8F92" stroke-width="4" stroke-linejoin="round"/>`)}
      <ellipse cx="50" cy="56" rx="31" ry="28" fill="${soft(d, pink)}"/>
      <ellipse cx="50" cy="64" rx="13" ry="9.5" fill="#F3BDB8"/>
      <ellipse cx="45.5" cy="64" rx="2.6" ry="3.6" fill="#B35F64"/><ellipse cx="54.5" cy="64" rx="2.6" ry="3.6" fill="#B35F64"/>
      ${eyes(49, 11)}${smile(76, 4)}${blush(64, 21, '#E07B85', 0.35)}`;
  },
  monkey(d) {
    const fur = '#7B5139', face = '#ECC29B';
    return `${mirror(`<circle cx="16" cy="52" r="11.5" fill="${fur}"/><circle cx="16" cy="52" r="6.5" fill="${face}"/>`)}
      <ellipse cx="50" cy="52" rx="30" ry="29" fill="${soft(d, fur)}"/>
      <path d="M50 44C44 34 28 36 28 50C28 56 31 60 34 62C30 70 36 80 50 80C64 80 70 70 66 62C69 60 72 56 72 50C72 36 56 34 50 44Z" fill="${face}"/>
      ${eyes(50, 9)}<ellipse cx="47" cy="63" rx="1.6" ry="2.2" fill="#6A4632"/><ellipse cx="53" cy="63" rx="1.6" ry="2.2" fill="#6A4632"/>
      <path d="M42 69Q50 76 58 69" fill="none" stroke="${EYE}" stroke-width="2.1" stroke-linecap="round"/>`;
  },
  fox(d) {
    const fur = '#E17B3B';
    return `${mirror(`<path d="M22 42L20 12Q21 8 25 10L46 30Z" fill="${fur}" stroke="${fur}" stroke-width="4" stroke-linejoin="round"/><path d="M20 12Q21 8 25 10L30 15L21 20Z" fill="#3B2B28"/><path d="M26 36L25 21L37 31Z" fill="#F4DFC8"/>`)}
      <path d="M14 46Q15 30 32 29H68Q85 30 86 46Q83 64 50 84Q17 64 14 46Z" fill="${soft(d, fur)}"/>
      <path d="M17 52Q30 60 50 62Q70 60 83 52Q76 68 50 84Q24 68 17 52Z" fill="#F7EADB"/>
      ${eyes(48, 12)}<ellipse cx="50" cy="75" rx="5" ry="3.8" fill="${EYE}"/>`;
  },
  frog(d) {
    const g = '#7CB15A';
    return `${mirror(`<circle cx="32" cy="35" r="13.5" fill="${g}"/><circle cx="32" cy="35" r="8.6" fill="#fff"/><circle cx="33" cy="36" r="4.8" fill="${EYE}"/><circle cx="34.6" cy="34" r="1.5" fill="#fff"/>`)}
      <ellipse cx="50" cy="60" rx="35" ry="24" fill="${soft(d, g)}"/>
      <ellipse cx="50" cy="70" rx="24" ry="11" fill="#B9D88E" opacity=".55"/>
      <path d="M33 64Q50 77 67 64" fill="none" stroke="#2F4A26" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="46" cy="55" r="1.4" fill="#2F4A26"/><circle cx="54" cy="55" r="1.4" fill="#2F4A26"/>${blush(65, 25, '#E38C7A', 0.4)}`;
  },
  penguin(d) {
    const dark = '#323A4A';
    return `<ellipse cx="50" cy="53" rx="31" ry="31" fill="${soft(d, dark, 0.2)}"/>
      <path d="M50 44C44 34 26 36 26 52C26 70 38 80 50 80C62 80 74 70 74 52C74 36 56 34 50 44Z" fill="#F4F2EC"/>
      ${eyes(51, 10)}<path d="M43.5 60H56.5L50 67Z" fill="#EE9E3E" stroke="#EE9E3E" stroke-width="2.6" stroke-linejoin="round"/>${blush(64, 17, '#E58D98', 0.45)}`;
  },
  duck(d) {
    const y = '#F2C94C';
    return `<path d="M48 26Q44 16 51 13Q49 20 55 24Z" fill="${y}"/>
      <circle cx="50" cy="52" r="29" fill="${soft(d, y)}"/>
      <path d="M32 64Q50 56 68 64Q66 76 50 76Q34 76 32 64Z" fill="#EE8A3B"/>
      <path d="M36 66Q50 63 64 66" fill="none" stroke="#C96A26" stroke-width="1.8" stroke-linecap="round"/>
      ${eyes(47, 10)}${blush(57, 21, '#EB8C6E', 0.35)}`;
  },
  horse(d) {
    const fur = '#A9703F', mane = '#4E3226';
    return `${mirror(`<path d="M34 26L31 6Q33.5 3 36.5 6L43 22Z" fill="${fur}" stroke="${fur}" stroke-width="3" stroke-linejoin="round"/><path d="M33.6 10L35.4 8.4L38.6 19L35.4 20Z" fill="#7E4F2E"/>`)}
      <path d="M50 12C64 12 70 24 70 38C70 48 67 56 67 64C67 80 60 92 50 92C40 92 33 80 33 64C33 56 30 48 30 38C30 24 36 12 50 12Z" fill="${soft(d, fur)}"/>
      <path d="M50 30Q53 29 54 32L55 60Q50 63 45 60L46 32Q47 29 50 30Z" fill="#F3E6D4"/>
      <ellipse cx="50" cy="77" rx="18.5" ry="14" fill="${soft(d, '#D7A07A', 0.08)}"/>
      <ellipse cx="43.5" cy="78" rx="2.6" ry="3.6" fill="#5A3523"/><ellipse cx="56.5" cy="78" rx="2.6" ry="3.6" fill="#5A3523"/>
      <path d="M38 16Q44 6 52 12Q60 6 63 18Q58 16 56 24Q52 18 50 28Q46 20 43 25Q41 18 38 16Z" fill="${mane}"/>
      ${eyes(45, 14)}${smile(87, 4)}`;
  },
  chicken(d) {
    return `<g fill="#DE4A3E"><circle cx="42" cy="27" r="7"/><circle cx="50" cy="22" r="7.5"/><circle cx="58" cy="27" r="7"/></g>
      <circle cx="50" cy="56" r="28" fill="${soft(d, '#F5F1EA', 0.05)}"/>
      ${eyes(50, 10)}<path d="M44 57H56L50 65Z" fill="#F0A53A" stroke="#F0A53A" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M50 66Q46 72 50 76Q54 72 50 66Z" fill="#DE4A3E"/>${blush(60, 18, '#E58D98', 0.4)}`;
  },
  giraffe(d) {
    const y = '#ECC26A', spot = '#B9773F';
    return `${mirror(`<path d="M41 26V12" stroke="${spot}" stroke-width="4" stroke-linecap="round"/><circle cx="41" cy="11" r="4.5" fill="#8F5A32"/><ellipse cx="22" cy="42" rx="10" ry="5" transform="rotate(-20 22 42)" fill="${y}"/>`)}
      <path d="M50 22C64 22 72 34 72 50C72 64 66 76 50 78C34 76 28 64 28 50C28 34 36 22 50 22Z" fill="${soft(d, y)}"/>
      <g fill="${spot}" opacity=".8"><path d="M34 34Q40 30 42 36Q38 40 34 38Z"/><path d="M58 30Q64 31 64 36Q59 38 57 34Z"/><path d="M66 46Q70 48 69 53Q65 52 65 48Z"/><path d="M31 48Q35 46 35 51Q32 54 30 51Z"/></g>
      <ellipse cx="50" cy="70" rx="16" ry="11" fill="#F3D9A2"/>
      <ellipse cx="45" cy="69" rx="1.8" ry="2.4" fill="#7A4D2C"/><ellipse cx="55" cy="69" rx="1.8" ry="2.4" fill="#7A4D2C"/>
      ${eyes(49, 11)}${smile(75, 3.6)}`;
  },
  elephant(d) {
    const g = '#9DA3B2';
    return `${mirror(`<ellipse cx="20" cy="46" rx="18" ry="23" fill="${soft(d, darken(g, 0.06))}"/><ellipse cx="21" cy="47" rx="11" ry="15" fill="#C9B5BA"/>`)}
      <circle cx="50" cy="46" r="24" fill="${soft(d, g)}"/>
      <path d="M50 54C50 70 50 76 58 82" fill="none" stroke="${g}" stroke-width="13" stroke-linecap="round"/>
      <path d="M50 54C50 70 50 76 58 82" fill="none" stroke="${darken(g, 0.1)}" stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round" opacity=".7"/>
      ${eyes(44, 9.5)}${blush(53, 16, '#E58D98', 0.35)}`;
  },
  zebra(d) {
    const s = '#2E2D35', w = '#F3F0EB';
    return `${mirror(`<path d="M34 26L31 6Q33.5 3 36.5 6L43 22Z" fill="${w}" stroke="${w}" stroke-width="3" stroke-linejoin="round"/><path d="M31.4 7.2Q33.5 3 36.5 6L36 11L32 11Z" fill="${s}"/>`)}
      <path d="M50 12C64 12 70 24 70 38C70 48 67 56 67 64C67 80 60 92 50 92C40 92 33 80 33 64C33 56 30 48 30 38C30 24 36 12 50 12Z" fill="${soft(d, w, 0.05)}"/>
      <g fill="${s}">
        <path d="M43 24Q50 30 57 24L56 29Q50 34 44 29Z"/><path d="M45 35Q50 39 55 35L54.4 39Q50 42 45.6 39Z"/>
        ${mirror('<path d="M30.5 33Q38 34 42 40Q37 42 31.5 38Z"/><path d="M31.6 47Q38 47 41 53Q36 55 32.6 51.5Z"/><path d="M33.4 60Q38.5 59.5 40.5 64Q37 66 34 63.6Z"/>')}
      </g>
      <ellipse cx="50" cy="77" rx="18.5" ry="14" fill="${soft(d, '#5D5B66', 0.1)}"/>
      <ellipse cx="43.5" cy="78" rx="2.6" ry="3.6" fill="${s}"/><ellipse cx="56.5" cy="78" rx="2.6" ry="3.6" fill="${s}"/>
      <path d="M40 17Q44 6 50 11Q56 6 60 17Q56 14 54 21L50 16L46 21Q44 14 40 17Z" fill="${s}"/>
      ${eyes(46, 14)}`;
  },
  koala(d) {
    const g = '#A3A7B2';
    return `${mirror(`<circle cx="20" cy="36" r="16" fill="${g}"/><circle cx="21" cy="37" r="10" fill="#EDE8E3"/>`)}
      <ellipse cx="50" cy="57" rx="29" ry="27" fill="${soft(d, g)}"/>
      ${eyes(52, 13, 0.9)}<ellipse cx="50" cy="61" rx="8.6" ry="11.5" fill="${soft(d, '#3B3A44', 0.2)}"/>
      <ellipse cx="47.6" cy="56" rx="2.2" ry="3" fill="#fff" opacity=".25"/>${smile(76, 3.6)}`;
  },
};

export function animalSVG(name, attrs = '') {
  const d = [];
  const body = ANIMAL_ART[name](d);
  return svg('0 0 100 100', `<defs>${d.join('')}</defs>${body}`, attrs);
}

/* ------------------------------------------------------------------ shapes */

export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'heart'];
function starPts(cx, cy, R, r, n = 5) {
  const p = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n, rr = i % 2 ? r : R;
    p.push(`${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}`);
  }
  return 'M' + p.join(' L') + 'Z';
}
export const SHAPE_D = {
  circle: 'M50 12A38 38 0 1 1 49.9 12Z',
  square: 'M16 16H84V84H16Z',
  triangle: 'M50 12L88 82H12Z',
  diamond: 'M50 8L84 50L50 92L16 50Z',
  star: starPts(50, 54, 42, 18),
  heart: 'M50 86C30 72 12 58 12 38C12 24 22 15 34 15C42 15 47 19 50 25C53 19 58 15 66 15C78 15 88 24 88 38C88 58 70 72 50 86Z',
};
export const SHAPE_INK = '#2F3756';
export function shapeSVG(name, color = SHAPE_INK, attrs = '') {
  const d = [];
  return svg('0 0 100 100', `<defs>${d.join('')}</defs><path d="${SHAPE_D[name]}" fill="${soft(d, color, 0.18)}" stroke="${color}" stroke-width="7" stroke-linejoin="round"/>`, attrs);
}

/* ------------------------------------------------------------------ world heroes */
// One friendly character per world, in a 160x140 box, facing right.

const HERO_ART = {
  dino(d) {
    const g = '#7FAD66', dark = '#6A9554', plate = '#D98C5A';
    return `<g fill="${plate}">${[[52, 66], [66, 61], [80, 60], [93, 63]].map(([x, y], i) => `<path d="M${x - 7} ${y + 4}Q${x} ${y - 13 - (i % 2) * 2} ${x + 7} ${y + 4}Z" stroke="${plate}" stroke-width="3" stroke-linejoin="round"/>`).join('')}</g>
      <path d="M38 96Q14 100 4 116Q22 116 46 108Z" fill="${dark}"/>
      <rect x="48" y="104" width="15" height="24" rx="7" fill="${dark}"/><rect x="88" y="104" width="15" height="24" rx="7" fill="${dark}"/>
      <path d="M100 82C114 70 118 50 116 38" fill="none" stroke="${g}" stroke-width="22" stroke-linecap="round"/>
      <ellipse cx="76" cy="96" rx="44" ry="28" fill="${soft(d, g)}"/>
      <ellipse cx="80" cy="108" rx="30" ry="13" fill="#D7E4AE"/>
      <rect x="58" y="108" width="15" height="22" rx="7" fill="${g}"/><rect x="98" y="106" width="15" height="22" rx="7" fill="${g}"/>
      <ellipse cx="126" cy="32" rx="22" ry="17" fill="${soft(d, g)}"/>
      ${eye(130, 27, 1.05)}<circle cx="144" cy="30" r="1.6" fill="#3B5230"/>
      <path d="M127 39Q135 44 142 38" fill="none" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="121" cy="37" rx="4.5" ry="2.8" fill="#E8806F" opacity=".35"/>`;
  },
  car(d) {
    const body = '#E66A4E';
    return `<path d="M14 92Q12 74 30 70L58 66Q66 50 84 48H104Q118 48 124 64L144 70Q154 74 152 92Z" fill="${soft(d, body)}"/>
      <path d="M70 66Q76 54 88 54H100Q110 54 114 66Z" fill="#BFD9E8"/>
      <path d="M92 54V66" stroke="${body}" stroke-width="4"/>
      <path d="M8 66H28V72H10Z" fill="#3E8C8E"/><path d="M12 64V74" stroke="#3E8C8E" stroke-width="4" stroke-linecap="round"/>
      <path d="M22 82H146" stroke="${CREAM}" stroke-width="5" stroke-linecap="round" opacity=".9"/>
      ${[42, 124].map(x => `<circle cx="${x}" cy="94" r="17" fill="#2E3342"/><circle cx="${x}" cy="94" r="7.5" fill="#C9CEDA"/><circle cx="${x}" cy="94" r="2.6" fill="#2E3342"/>`).join('')}
      <circle cx="80" cy="78" r="7" fill="${CREAM}"/><path d="${starPts(80, 78.6, 4.6, 2)}" fill="${body}"/>`;
  },
  whale(d) {
    const b = '#5E8EB6';
    return `<g fill="#A9D3E6"><path d="M66 22Q62 10 70 4Q72 14 66 22Z"/><path d="M74 24Q78 12 88 10Q84 20 74 24Z"/><path d="M58 24Q50 14 52 6Q60 14 58 24Z"/></g>
      <path d="M150 54Q156 34 144 30Q140 46 128 60Q122 46 110 46Q120 62 128 70Z" fill="${darken(b, 0.08)}"/>
      <path d="M20 84C16 54 44 32 78 32C110 32 130 52 130 74C130 100 104 116 72 116C40 116 22 104 20 84Z" fill="${soft(d, b)}"/>
      <path d="M26 92Q60 112 108 104Q96 116 72 116C48 116 30 106 26 92Z" fill="#D3E3EC"/>
      <path d="M40 100Q66 110 96 104M48 108Q70 113 90 110" fill="none" stroke="#B4CAD8" stroke-width="2" stroke-linecap="round"/>
      <path d="M76 94Q86 104 96 98" fill="none" stroke="${darken(b, 0.12)}" stroke-width="7" stroke-linecap="round"/>
      ${eye(44, 70, 1.05)}<path d="M28 82Q36 88 44 84" fill="none" stroke="${EYE}" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="54" cy="82" rx="5" ry="3" fill="#E8806F" opacity=".3"/>`;
  },
  robot(d) {
    const m = '#B9C3D4', dk = '#2F3A55';
    return `<path d="M80 22V10" stroke="#8C97AC" stroke-width="4" stroke-linecap="round"/><circle cx="80" cy="9" r="6.5" fill="#E8735A"/>
      <rect x="50" y="22" width="60" height="46" rx="14" fill="${soft(d, m)}"/>
      <rect x="44" y="38" width="8" height="16" rx="4" fill="#8C97AC"/><rect x="108" y="38" width="8" height="16" rx="4" fill="#8C97AC"/>
      <rect x="58" y="30" width="44" height="30" rx="9" fill="${dk}"/>
      <rect x="66" y="38" width="8" height="10" rx="4" fill="#9EDCC4"/><rect x="86" y="38" width="8" height="10" rx="4" fill="#9EDCC4"/>
      <path d="M72 52Q80 57 88 52" fill="none" stroke="#9EDCC4" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M52 84Q36 88 34 104M108 84Q124 88 126 104" fill="none" stroke="#8C97AC" stroke-width="7" stroke-linecap="round"/>
      <circle cx="34" cy="106" r="6" fill="#8C97AC"/><circle cx="126" cy="106" r="6" fill="#8C97AC"/>
      <rect x="54" y="72" width="52" height="44" rx="13" fill="${soft(d, '#A9B5C9')}"/>
      <rect x="64" y="82" width="32" height="20" rx="6" fill="#E9EDF3"/>
      <circle cx="72" cy="92" r="3.6" fill="#E8735A"/><circle cx="80" cy="92" r="3.6" fill="#9EDCC4"/><circle cx="88" cy="92" r="3.6" fill="#EBD27C"/>
      <rect x="62" y="114" width="12" height="16" rx="5" fill="#8C97AC"/><rect x="86" y="114" width="12" height="16" rx="5" fill="#8C97AC"/>`;
  },
  rocket(d) {
    return `<g transform="rotate(28 80 70)">
      <path d="M68 104Q80 140 92 104Q86 112 80 126Q74 112 68 104Z" fill="#EB7F4F"/>
      <path d="M72 104Q80 126 88 104Z" fill="#F3B562"/>
      <path d="M62 92L46 108Q44 96 56 80Z" fill="#3E8C8E"/><path d="M98 92L114 108Q116 96 104 80Z" fill="#3E8C8E"/>
      <path d="M80 8C98 22 104 46 102 72C101 88 98 100 96 106H64C62 100 59 88 58 72C56 46 62 22 80 8Z" fill="${soft(d, '#F3E9DB', 0.06)}"/>
      <path d="M80 8C92 17 98 30 100 42H60C62 30 68 17 80 8Z" fill="#E36E55"/>
      <circle cx="80" cy="64" r="13" fill="#8E9BB5"/><circle cx="80" cy="64" r="9" fill="#8FC3DE"/>
      <path d="M74 60Q77 56 82 57" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
      <path d="M80 90V106" stroke="#3E8C8E" stroke-width="5" stroke-linecap="round"/></g>`;
  },
  unicorn(d) {
    const w = '#F4EFF6', pink = '#EBA6C4', lil = '#B8A4E0', mint = '#A6D9C9';
    return `<path d="M30 74Q6 70 8 96Q14 84 26 88Q12 100 22 112Q26 96 38 92Z" fill="${lil}"/>
      <path d="M24 86Q16 96 20 104" fill="none" stroke="${pink}" stroke-width="5" stroke-linecap="round"/>
      <rect x="42" y="96" width="13" height="30" rx="6" fill="#E3DAE8"/><rect x="86" y="96" width="13" height="30" rx="6" fill="#E3DAE8"/>
      <ellipse cx="66" cy="88" rx="38" ry="24" fill="${soft(d, w, 0.05)}"/>
      <rect x="52" y="98" width="13" height="30" rx="6" fill="${w}"/><rect x="96" y="96" width="13" height="30" rx="6" fill="${w}"/>
      <rect x="52" y="122" width="13" height="7" rx="3" fill="#C9B6D8"/><rect x="96" y="120" width="13" height="7" rx="3" fill="#C9B6D8"/>
      <path d="M92 76Q98 50 108 36" fill="none" stroke="${w}" stroke-width="24" stroke-linecap="round"/>
      <path d="M110 18L118 40L104 38Z" fill="#E6C27C" stroke="#E6C27C" stroke-width="3" stroke-linejoin="round"/>
      <path d="M108 26L114 25M106 32L116 31" stroke="#C9A35D" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="120" cy="50" rx="22" ry="17" transform="rotate(18 120 50)" fill="${soft(d, w, 0.05)}"/>
      <ellipse cx="136" cy="58" rx="9" ry="7" fill="#EBDDE8"/>
      <path d="M96 30Q84 34 82 48Q90 44 92 52Q80 58 84 70Q92 60 98 62Z" fill="${pink}"/>
      <path d="M100 34Q92 44 96 56" fill="none" stroke="${lil}" stroke-width="6" stroke-linecap="round"/>
      <path d="M90 40Q86 50 88 58" fill="none" stroke="${mint}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="121" cy="47" rx="3.6" ry="4.4" fill="${EYE}"/><circle cx="122.3" cy="45.3" r="1.3" fill="#fff"/>
      <path d="M117 42.4L114.6 40.4M119.4 41.2L118.2 38.6" stroke="${EYE}" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="128" cy="56" rx="4.5" ry="2.8" fill="#E58D98" opacity=".4"/>`;
  },
};
export const HERO_FOR = { dino: 'dino', cars: 'car', ocean: 'whale', robot: 'robot', space: 'rocket', fantasy: 'unicorn' };
export function heroSVG(hero, attrs = '') {
  const d = [];
  const body = HERO_ART[hero](d);
  return svg('0 0 160 140', `<defs>${d.join('')}</defs>${body}`, attrs);
}

/* ------------------------------------------------------------------ stickers */
// A sticker is a hero or an animal with a white die-cut edge and a soft lift.

export const STICKERS = [...Object.values(HERO_FOR).map(h => 'h:' + h), ...ANIMALS.map(a => 'a:' + a)];
export function stickerSVG(id, attrs = '') {
  const [kind, name] = id.split(':');
  const d = [], f = uid('st');
  const inner = kind === 'h' ? `<g transform="translate(6 16) scale(.55)">${HERO_ART[name](d)}</g>` : `<g transform="translate(5 5) scale(.9)">${ANIMAL_ART[name](d)}</g>`;
  d.push(`<filter id="${f}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius="4.2" result="o"/>
    <feFlood flood-color="#FFFDF8"/><feComposite in2="o" operator="in" result="w"/>
    <feOffset in="o" dy="2.2" result="so"/><feFlood flood-color="#2A2740" flood-opacity=".18"/><feComposite in2="so" operator="in" result="s"/>
    <feMerge><feMergeNode in="s"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  return svg('0 0 100 100', `<defs>${d.join('')}</defs><g filter="url(#${f})">${inner}</g>`, attrs);
}
export function stickerLabel(id) {
  const [kind, name] = id.split(':');
  if (kind === 'a') return name[0].toUpperCase() + name.slice(1);
  return { dino: 'Dino', car: 'Race car', whale: 'Whale', robot: 'Robot', rocket: 'Rocket', unicorn: 'Unicorn' }[name];
}

/* ------------------------------------------------------------------ world scenes */
// Each world is a sky gradient plus three layered ridges (far, mid, near) in a 2400x600
// box, anchored to the bottom and cropped to fit any screen, plus a few slow living
// details. Far layers sit closer to the sky colour (air), near layers are deeper.

function ridge(seed, base, amps, step = 100, W = 2400, H = 600) {
  const r = rng(seed), waves = amps.map(([a, wl]) => [a, (Math.PI * 2) / wl, r() * Math.PI * 2]);
  const pts = [];
  for (let x = -step; x <= W + step; x += step) {
    let y = base;
    for (const [a, f, ph] of waves) y -= a * Math.sin(x * f + ph);
    pts.push([x, y]);
  }
  let d = `M${-step} ${H} L${pts[0][0]} ${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${f1(p2[1])}`;
  }
  return { d: d + ` L${W + step} ${H}Z`, y: x => { let y = base; for (const [a, f, ph] of waves) y -= a * Math.sin(x * f + ph); return y; } };
}
// A filled ridge with one soft gradient and a hairline of light along its crest.
function hill(d, seed, base, amps, top, bottom, crest = 0.1) {
  const id = uid('r'), R = ridge(seed, base, amps);
  d.push(lin(id, top, bottom));
  return { svg: `<path d="${R.d}" fill="url(#${id})"/>` + (crest ? `<path d="${R.d.replace(/ L\d+ 600Z$/, '').replace(/^M-?\d+ 600 L/, 'M')}" fill="none" stroke="#fff" stroke-opacity="${crest}" stroke-width="3"/>` : ''), y: R.y };
}
// The 2400-wide strip is mirrored once on each side, so a wide, short screen scales the
// layer by height (hills keep their designed size) instead of by width (which would
// inflate the hills and crop their crests). Phones still see the middle of the strip.
// Each strip is clipped to its own 2400 width: ridges run 100 past either end, and without the
// clip the overlap with the mirrored copy shows as a flat green block at every seam.
const layer = (h, body, defs, cls = '') => {
  const id = uid('L'), cp = uid('lc');
  return { h, cls, svg: `<svg class="layer ${cls}" viewBox="-2400 0 7200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>${defs.join('')}<clipPath id="${cp}"><rect x="-0.5" y="-600" width="2401" height="1800"/></clipPath></defs><g id="${id}" clip-path="url(#${cp})">${body}</g><use href="#${id}" transform="matrix(-1 0 0 1 0 0)"/><use href="#${id}" transform="matrix(-1 0 0 1 4800 0)"/></svg>` };
};

function cloud(c = '#fff', o = 0.75) {
  return svg('0 0 200 80', `<path d="M30 70C12 70 6 56 14 46C10 30 30 22 44 30C52 12 80 8 94 24C106 12 132 16 136 34C154 28 172 40 166 56C180 60 178 70 164 70Z" fill="${c}" fill-opacity="${o}"/>`, 'aria-hidden="true"');
}
function lollipopTrees(r, R, xs, col, trunk, s = 1) {
  return xs.map(x => {
    const y = R.y(x), h = (60 + r() * 40) * s, rr = (34 + r() * 16) * s;
    return `<path d="M${x} ${f1(y + 10)}V${f1(y - h + rr * 0.6)}" stroke="${trunk}" stroke-width="${f1(9 * s)}" stroke-linecap="round"/><circle cx="${x}" cy="${f1(y - h)}" r="${f1(rr)}" fill="${col}"/>`;
  }).join('');
}

export const WORLD_IDS = ['dino', 'cars', 'ocean', 'robot', 'space', 'fantasy'];

export const WORLDS = {
  home: {
    name: 'Home', sky: ['#A9C5D5', '#D5DCD6', '#EEDFCA'], string: 'rgba(52,56,80,.42)', dark: false,
    build() {
      const h = [], a = [], b = [], c = [];
      const haze = hill(h, 10, 432, [[58, 1500], [24, 620], [9, 230]], '#C5D3D6', '#D2D9D3', 0);
      const far = hill(a, 11, 372, [[46, 1300], [22, 520]], '#ABC2BE', '#BBCBBF', 0.2);
      const mid = hill(b, 12, 300, [[50, 1100], [20, 430]], '#94B49F', '#86A792', 0.14);
      const r = rng(5);
      const trees = lollipopTrees(r, mid, [470, 600, 720, 1560, 1670, 1770, 1890], '#7C9F87', '#6A8A74', 0.9);
      const near = hill(c, 13, 150, [[26, 900], [12, 300]], '#7E9F88', '#6D8E78', 0.12);
      let flowers = '';
      const fr = rng(6);
      for (let i = 0; i < 24; i++) {
        const x = 60 + i * 98 + fr() * 40, y = near.y(x) + 24 + fr() * 70;
        flowers += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(5 + fr() * 4)}" fill="${['#EFD9B4', '#E6BFC4', '#F4ECDD'][i % 3]}" opacity=".9"/>`;
      }
      return [layer(0.6, haze.svg, h, 'haze'), layer(0.5, far.svg, a, 'far'), layer(0.38, mid.svg + trees, b, 'mid'), layer(0.2, near.svg + flowers, c, 'near')];
    },
    ambient: [
      { kind: 'sun', top: 9, right: 12, w: 17 },
      { kind: 'cloud', top: 12, left: 8, w: 30, dur: 90 },
      { kind: 'cloud', top: 26, left: 62, w: 22, dur: 120, o: 0.6 },
    ],
  },
  dino: {
    name: 'Dino', sky: ['#D3A08A', '#E6BB9E', '#EFD0AE'], string: 'rgba(70,46,40,.42)', dark: false,
    build() {
      const a = [], b = [], c = [];
      const vid = uid('v');
      a.push(lin(vid, '#A86F61', '#C29079'));
      const volcano = `<path d="M860 600C1030 420 1140 236 1206 148Q1232 120 1262 122L1338 122Q1368 120 1394 148C1460 236 1570 420 1740 600Z" fill="url(#${vid})"/>
        <path d="M1206 148Q1232 120 1262 122L1338 122Q1368 120 1394 148" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="4"/>`;
      const farHills = hill(a, 21, 420, [[40, 1200], [18, 400]], '#C99D86', '#D3AC92', 0.14);
      const mid = hill(b, 22, 300, [[52, 1000], [22, 380]], '#90A679', '#7D9668', 0.14);
      const r = rng(7);
      const cycad = (x, s) => {
        const y = mid.y(x);
        let leaves = '';
        for (let i = 0; i < 7; i++) {
          const ang = -160 + i * 23, L = 90 * s;
          const ex = x + Math.cos(ang * Math.PI / 180) * L, ey = y - 120 * s + Math.sin(ang * Math.PI / 180) * L * 0.7;
          leaves += `<path d="M${x} ${f1(y - 120 * s)}Q${f1((x + ex) / 2)} ${f1(ey - 30 * s)} ${f1(ex)} ${f1(ey)}" fill="none" stroke="#5F7D52" stroke-width="${f1(16 * s)}" stroke-linecap="round"/>`;
        }
        return `<path d="M${x} ${f1(y + 10)}L${x} ${f1(y - 120 * s)}" stroke="#7A6250" stroke-width="${f1(18 * s)}" stroke-linecap="round"/>${leaves}`;
      };
      const near = hill(c, 23, 150, [[24, 800], [10, 260]], '#6A8A5D', '#5A7850', 0.12);
      const eggs = (() => {
        const x = 1530, y = near.y(1530);
        return `<ellipse cx="${x}" cy="${f1(y + 8)}" rx="62" ry="16" fill="#8F7A5E"/>
          <ellipse cx="${x - 20}" cy="${f1(y - 14)}" rx="20" ry="26" fill="#EFE3CF"/><ellipse cx="${x + 22}" cy="${f1(y - 10)}" rx="18" ry="23" fill="#E6D6BC"/>
          <circle cx="${x - 26}" cy="${f1(y - 22)}" r="3.4" fill="#C9A98A"/><circle cx="${x - 14}" cy="${f1(y - 6)}" r="2.6" fill="#C9A98A"/><circle cx="${x + 26}" cy="${f1(y - 16)}" r="3" fill="#C2A07E"/>`;
      })();
      return [layer(0.52, farHills.svg + volcano, a, 'far'), layer(0.38, mid.svg + cycad(720, 1) + cycad(1660, 0.8) + cycad(980, 0.6), b, 'mid'), layer(0.2, near.svg + eggs, c, 'near')];
    },
    ambient: [
      { kind: 'cloud', top: 10, left: 6, w: 28, dur: 110, o: 0.55 },
      { kind: 'smoke', anchor: ['far', 1300, 120] },
      { kind: 'ptero', top: 22, dur: 70 },
      { kind: 'fern', corner: 'bl' }, { kind: 'fern', corner: 'br' },
    ],
  },
  cars: {
    name: 'Cars', sky: ['#9DBCD0', '#C3D5DD', '#DEE3DE'], string: 'rgba(40,52,70,.42)', dark: false,
    build() {
      const a = [], b = [], c = [];
      const r = rng(31);
      let city = '';
      let x = 260;
      while (x < 2140) {
        const w = 70 + r() * 90, h = 120 + r() * 220, top = 600 - 170 - h, round = r() > 0.6;
        const col = r() > 0.5 ? '#9FB3C4' : '#A9BCCB';
        city += round
          ? `<path d="M${f1(x)} 600V${f1(top + w / 2)}A${f1(w / 2)} ${f1(w / 2)} 0 0 1 ${f1(x + w)} ${f1(top + w / 2)}V600Z" fill="${col}"/>`
          : `<rect x="${f1(x)}" y="${f1(top)}" width="${f1(w)}" height="${f1(600 - top)}" rx="10" fill="${col}"/>`;
        for (let wy = top + 30; wy < 400; wy += 36)
          for (let wx = x + 16; wx < x + w - 20; wx += 26) if (r() > 0.35) city += `<rect x="${f1(wx)}" y="${f1(wy)}" width="10" height="14" rx="3" fill="#B9CAD6"/>`;
        x += w + 8 + r() * 30;
      }
      const farHills = hill(a, 32, 470, [[20, 900], [10, 300]], '#A7BBAE', '#A2B5A6', 0.12);
      const mid = hill(b, 33, 290, [[44, 1000], [18, 360]], '#A0B78F', '#8EA77E', 0.14);
      const trees = lollipopTrees(r, mid, [520, 600, 880, 1430, 1520, 1840, 1930], '#7F9C71', '#6E8462', 1);
      const roadId = uid('rd');
      c.push(lin(roadId, '#707B88', '#5E6874'));
      const road = `<path d="M-100 600V300Q600 270 1200 280T2500 300V600Z" fill="#86A276"/>
        <path d="M-100 330Q600 304 1200 312T2500 330V600H-100Z" fill="url(#${roadId})"/>
        <path d="M-100 334Q600 308 1200 316T2500 334" fill="none" stroke="#E6E0D0" stroke-width="7" stroke-opacity=".7"/>
        <path d="M-100 470Q600 452 1200 458T2500 470" fill="none" stroke="#EAE3CF" stroke-width="12" stroke-linecap="round" stroke-dasharray="70 70"/>`;
      return [layer(0.55, city + farHills.svg, a, 'far'), layer(0.4, mid.svg + trees, b, 'mid'), layer(0.17, road, c, 'near')];
    },
    ambient: [
      { kind: 'cloud', top: 9, left: 10, w: 30, dur: 100 },
      { kind: 'cloud', top: 24, left: 58, w: 20, dur: 130, o: 0.6 },
      { kind: 'car', anchor: ['near', 0, 400], dur: 26 },
    ],
  },
  ocean: {
    name: 'Ocean', sky: ['#2F7E8A', '#226777', '#1A4F60'], string: 'rgba(214,236,240,.5)', dark: true,
    build() {
      const a = [], b = [], c = [];
      const reef = hill(a, 41, 400, [[50, 900], [26, 300]], '#2B6A79', '#286070', 0);
      const rocks = hill(b, 42, 330, [[60, 800], [30, 260]], '#235A69', '#1F5160', 0);
      const r = rng(9);
      let coral = '';
      for (const x of [540, 700, 1180, 1460, 1700, 1880]) {
        const y = rocks.y(x) + 10, s = 0.7 + r() * 0.6;
        coral += `<g fill="#2F7482"><circle cx="${x}" cy="${f1(y - 40 * s)}" r="${f1(30 * s)}"/><circle cx="${f1(x - 34 * s)}" cy="${f1(y - 16 * s)}" r="${f1(22 * s)}"/><circle cx="${f1(x + 36 * s)}" cy="${f1(y - 12 * s)}" r="${f1(24 * s)}"/></g>`;
      }
      let weed = '';
      for (const x of [380, 860, 1320, 2040]) {
        const y = rocks.y(x) + 20;
        weed += `<path d="M${x} ${f1(y)}C${x - 30} ${f1(y - 70)} ${x + 30} ${f1(y - 120)} ${x - 6} ${f1(y - 190)}" fill="none" stroke="#2C6B5D" stroke-width="16" stroke-linecap="round"/>`;
      }
      const sand = hill(c, 43, 130, [[18, 900], [8, 280]], '#CDB58E', '#B9A07A', 0.18);
      const star = (() => { const x = 1420, y = sand.y(1420) + 34; return `<path d="${starPts(x, y, 30, 14)}" fill="#D98E6A" stroke="#D98E6A" stroke-width="8" stroke-linejoin="round"/>`; })();
      const shells = `<ellipse cx="900" cy="${f1(sand.y(900) + 40)}" rx="18" ry="12" fill="#E8D7BC"/><ellipse cx="1900" cy="${f1(sand.y(1900) + 50)}" rx="14" ry="10" fill="#E2CDAE"/>`;
      return [layer(0.5, reef.svg, a, 'far'), layer(0.4, rocks.svg + coral + weed, b, 'mid'), layer(0.2, sand.svg + star + shells, c, 'near')];
    },
    ambient: [
      { kind: 'rays' },
      { kind: 'fish', top: 40, dur: 48 },
      { kind: 'bubbles' },
      { kind: 'weed', corner: 'bl' }, { kind: 'weed', corner: 'br' },
    ],
  },
  robot: {
    name: 'Robot', sky: ['#C3C8DF', '#D5D6E5', '#E3E0E8'], string: 'rgba(52,56,84,.42)', dark: false,
    build() {
      const a = [], b = [], c = [];
      const r = rng(51);
      // Robot City: the skyline is a row of big, kind robots standing shoulder to shoulder
      // with plain towers and a domed workshop, so the world reads as robots at a glance.
      const haze = hill(a, 50, 360, [[30, 1300], [12, 420]], '#C7CBDF', '#CDD0E2', 0);
      const bot = (x, w, h, tint) => {
        const top = 470 - h, cx = x + w / 2, eyeY = top + w * 0.36;
        let o = `<rect x="${x}" y="${f1(top)}" width="${w}" height="${f1(600 - top)}" rx="${f1(w * 0.24)}" fill="${tint}"/>`;
        o += `<path d="M${f1(cx)} ${f1(top + 2)}V${f1(top - 38)}" stroke="#A1A7C3" stroke-width="7" stroke-linecap="round"/><circle cx="${f1(cx)}" cy="${f1(top - 46)}" r="11" fill="#E39B7F"/>`;
        o += `<circle cx="${x}" cy="${f1(eyeY)}" r="${f1(w * 0.07)}" fill="#A1A7C3"/><circle cx="${x + w}" cy="${f1(eyeY)}" r="${f1(w * 0.07)}" fill="#A1A7C3"/>`;
        o += `<rect x="${f1(x + w * 0.13)}" y="${f1(top + w * 0.2)}" width="${f1(w * 0.74)}" height="${f1(w * 0.32)}" rx="${f1(w * 0.16)}" fill="#8F96B6"/>`;
        o += `<circle cx="${f1(x + w * 0.35)}" cy="${f1(eyeY)}" r="${f1(w * 0.075)}" fill="#DDF0E8"/><circle cx="${f1(x + w * 0.65)}" cy="${f1(eyeY)}" r="${f1(w * 0.075)}" fill="#DDF0E8"/>`;
        o += `<rect x="${f1(x + w * 0.36)}" y="${f1(top + w * 0.62)}" width="${f1(w * 0.28)}" height="${f1(w * 0.06)}" rx="${f1(w * 0.03)}" fill="#C3C8DB"/>`;
        for (let wy = top + w * 0.86; wy < 430; wy += 46) for (const fx of [0.32, 0.68]) o += `<rect x="${f1(x + w * fx - 9)}" y="${f1(wy)}" width="18" height="22" rx="7" fill="#C3C8DB"/>`;
        return o;
      };
      const tower = (x, w, h) => {
        const top = 470 - h;
        let o = `<rect x="${x}" y="${f1(top)}" width="${w}" height="${f1(600 - top)}" rx="${f1(w / 2)}" fill="#B6BBD2"/>`;
        for (let wy = top + w * 0.6; wy < 440; wy += 40) o += `<rect x="${f1(x + w / 2 - 10)}" y="${f1(wy)}" width="20" height="16" rx="7" fill="#C8CCDD"/>`;
        return o;
      };
      const dome = (x, w, h) => {
        const top = 470 - h, R2 = w / 2, cx = x + R2;
        return `<rect x="${f1(x + w * 0.78)}" y="${f1(top - 70)}" width="26" height="${f1(h + 200)}" rx="10" fill="#A9AFC9"/>
          <path d="M${f1(x + w * 0.78)} ${f1(top - 40)}h26M${f1(x + w * 0.78)} ${f1(top - 10)}h26" stroke="#C3C8DB" stroke-width="6"/>
          <path d="M${x} 600V${f1(top + R2)}A${f1(R2)} ${f1(R2)} 0 0 1 ${x + w} ${f1(top + R2)}V600Z" fill="#B0B6CE"/>
          <circle cx="${f1(cx)}" cy="${f1(top + R2 * 0.95)}" r="${f1(R2 * 0.42)}" fill="#8F96B6"/><circle cx="${f1(cx)}" cy="${f1(top + R2 * 0.95)}" r="${f1(R2 * 0.42)}" fill="none" stroke="#C3C8DB" stroke-width="7"/>
          <circle cx="${f1(cx - R2 * 0.12)}" cy="${f1(top + R2 * 0.82)}" r="${f1(R2 * 0.1)}" fill="#DDF0E8" opacity=".75"/>`;
      };
      const city = [
        tower(300, 90, 230), bot(410, 150, 290, '#AEB4CC'), tower(590, 80, 180), dome(690, 170, 200),
        bot(890, 128, 240, '#A9AFC9'), tower(1036, 92, 320), bot(1150, 192, 350, '#ADB3CC'), tower(1366, 98, 262),
        dome(1484, 160, 180), bot(1666, 140, 280, '#A9AFC9'), tower(1826, 88, 220), bot(1936, 150, 250, '#AEB4CC'),
      ].join('');
      const mid = hill(b, 52, 300, [[34, 900], [14, 320]], '#A9CEC0', '#93BBAB', 0.18);
      let traces = '';
      for (const sx of [560, 900, 1260, 1600, 1900]) {
        const y0 = mid.y(sx) + 40, len = 60 + r() * 80, turn = r() > 0.5 ? 1 : -1;
        traces += `<path d="M${sx} 600V${f1(y0 + 60)}L${sx + turn * 50} ${f1(y0 + 10)}H${f1(sx + turn * (50 + len))}" fill="none" stroke="#C7E2D7" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${f1(sx + turn * (50 + len))}" cy="${f1(y0 + 10)}" r="11" fill="#C7E2D7"/>`;
      }
      // two chips sitting on the circuit hill
      const chip = x => {
        const y = mid.y(x) + 34;
        let legs = '';
        for (const dx of [-24, 0, 24]) legs += `<path d="M${x + dx} ${f1(y - 34)}V${f1(y - 44)}M${x + dx} ${f1(y + 34)}V${f1(y + 44)}" stroke="#C7E2D7" stroke-width="6" stroke-linecap="round"/>`;
        return legs + `<rect x="${x - 46}" y="${f1(y - 34)}" width="92" height="68" rx="14" fill="#86B3A1"/><circle cx="${x - 26}" cy="${f1(y - 14)}" r="6" fill="#A9CEC0"/>`;
      };
      const floor = hill(c, 53, 140, [[10, 900]], '#8C93AE', '#7A819D', 0.14);
      let bolts = '';
      for (let bx = 200; bx < 2400; bx += 220) bolts += `<circle cx="${bx}" cy="${f1(floor.y(bx) + 50)}" r="8" fill="#9AA1BB"/>`;
      return [layer(0.55, haze.svg + city, a, 'far'), layer(0.38, mid.svg + traces + chip(760) + chip(1480), b, 'mid'), layer(0.18, floor.svg + bolts, c, 'near')];
    },
    ambient: [
      { kind: 'cloud', top: 10, left: 14, w: 26, dur: 120, o: 0.5 },
      { kind: 'drone', top: 20, left: 70, w: 9 },
      { kind: 'gear', corner: 'bl' }, { kind: 'gear', corner: 'br', small: true },
    ],
  },
  space: {
    name: 'Space', sky: ['#161E3A', '#1E294C', '#2B3762'], string: 'rgba(220,226,242,.5)', dark: true,
    build() {
      const a = [], b = [], c = [];
      // A big planet rises behind a dusty moon, with a little rover and a flag on the near
      // ground: the horizon reads as space, and the sky above stays open for the balloons.
      const pg = uid('p'), pc = uid('pc');
      a.push(lin(pg, '#47548A', '#2F3A66'));
      a.push(`<clipPath id="${pc}"><circle cx="1200" cy="1190" r="880"/></clipPath>`);
      const planet = `<circle cx="1200" cy="1190" r="880" fill="url(#${pg})"/>
        <g clip-path="url(#${pc})" fill="#5A6698" opacity=".45"><ellipse cx="980" cy="390" rx="210" ry="34"/><ellipse cx="1500" cy="350" rx="150" ry="24"/><ellipse cx="1240" cy="470" rx="320" ry="40"/><ellipse cx="640" cy="520" rx="180" ry="30"/></g>
        <circle cx="1200" cy="1190" r="880" fill="none" stroke="#8C98C8" stroke-opacity=".45" stroke-width="4"/>`;
      const mid = hill(b, 62, 300, [[40, 900], [16, 300]], '#4B5484', '#3E4674', 0.12);
      const near = hill(c, 63, 150, [[16, 800]], '#5C6492', '#4D5482', 0.14);
      const crater = (R, x, rx, dark, lit) => { const y = R.y(x) + rx * 0.5 + 24; return `<ellipse cx="${x}" cy="${f1(y)}" rx="${rx}" ry="${f1(rx * 0.3)}" fill="${dark}"/><path d="M${x - rx * 0.9} ${f1(y + rx * 0.08)}A${rx} ${f1(rx * 0.3)} 0 0 0 ${x + rx * 0.9} ${f1(y + rx * 0.08)}" fill="none" stroke="${lit}" stroke-width="5" stroke-linecap="round"/>`; };
      const rover = (() => {
        const x = 1430, y = mid.y(1430) + 10;
        return `<g transform="translate(${x} ${f1(y)}) scale(.62) translate(${-x} ${f1(-y)})"><path d="M${x + 30} ${f1(y - 96)}V${f1(y - 132)}" stroke="#B9C0DA" stroke-width="6" stroke-linecap="round"/><path d="M${x + 10} ${f1(y - 148)}Q${x + 30} ${f1(y - 120)} ${x + 54} ${f1(y - 140)}Z" fill="#D5DAEA"/>
          <rect x="${x - 80}" y="${f1(y - 100)}" width="160" height="58" rx="22" fill="#D5DAEA"/><rect x="${x - 62}" y="${f1(y - 88)}" width="62" height="24" rx="10" fill="#8C98C8"/><circle cx="${x + 46}" cy="${f1(y - 76)}" r="8" fill="#E39B7F"/>
          ${[-52, 0, 52].map(dx => `<circle cx="${x + dx}" cy="${f1(y - 28)}" r="24" fill="#2E365C"/><circle cx="${x + dx}" cy="${f1(y - 28)}" r="9" fill="#9EA6C6"/>`).join('')}</g>`;
      })();
      const flag = (() => {
        const x = 940, y = mid.y(940) + 10;
        return `<g transform="translate(${x} ${f1(y)}) scale(.6) translate(${-x} ${f1(-y)})"><path d="M${x} ${f1(y)}V${f1(y - 170)}" stroke="#C3C9DF" stroke-width="7" stroke-linecap="round"/><path d="M${x + 3} ${f1(y - 168)}H${x + 78}L${x + 64} ${f1(y - 146)}L${x + 78} ${f1(y - 124)}H${x + 3}Z" fill="#E39B7F"/><ellipse cx="${x}" cy="${f1(y + 4)}" rx="26" ry="7" fill="#3A4270"/></g>`;
      })();
      return [layer(0.5, planet, a, 'far'),
        layer(0.36, mid.svg + crater(mid, 700, 70, '#3A4270', '#5E6898') + crater(mid, 1700, 90, '#3A4270', '#5E6898') + crater(mid, 1180, 46, '#3A4270', '#5E6898') + rover + flag, b, 'mid'),
        layer(0.18, near.svg + crater(near, 1150, 100, '#4A5180', '#7079A6') + crater(near, 400, 60, '#4A5180', '#7079A6') + crater(near, 2000, 80, '#4A5180', '#7079A6'), c, 'near')];
    },
    ambient: [
      { kind: 'stars' },
      { kind: 'planet', top: 9, right: 6, w: 34 },
      { kind: 'moon', top: 24, left: 7, w: 12 },
      { kind: 'satellite', top: 34, dur: 80 },
    ],
  },
  fantasy: {
    name: 'Fantasy', sky: ['#C6B2D6', '#DCC8DE', '#ECDBE2'], string: 'rgba(66,50,90,.42)', dark: false,
    build() {
      const a = [], b = [], c = [];
      const castleHill = hill(a, 71, 430, [[36, 1200], [14, 380]], '#BBA8D2', '#C2B0D5', 0.16);
      const cx = 1380, base = castleHill.y(1380) + 8, col = '#A08DC0', roof = '#8E7AB2';
      const tower = (x, w, h, flag) => `<rect x="${x - w / 2}" y="${f1(base - h)}" width="${w}" height="${f1(h + 30)}" rx="6" fill="${col}"/>
        <path d="M${x - w / 2 - 10} ${f1(base - h)}L${x} ${f1(base - h - w * 1.3)}L${x + w / 2 + 10} ${f1(base - h)}Z" fill="${roof}" stroke="${roof}" stroke-width="6" stroke-linejoin="round"/>
        ${flag ? `<path d="M${x} ${f1(base - h - w * 1.3)}V${f1(base - h - w * 1.3 - 40)}" stroke="${roof}" stroke-width="5" stroke-linecap="round"/><path d="M${x + 2} ${f1(base - h - w * 1.3 - 40)}L${x + 38} ${f1(base - h - w * 1.3 - 30)}L${x + 2} ${f1(base - h - w * 1.3 - 20)}Z" fill="#D9A6C2"/>` : ''}
        <rect x="${x - 8}" y="${f1(base - h + 30)}" width="16" height="24" rx="8" fill="#B9A9D2"/>`;
      const castle = `<rect x="${cx - 150}" y="${f1(base - 150)}" width="300" height="190" rx="10" fill="${col}"/>
        ${[-130, -78, -26, 26, 78, 130].map(dx => `<rect x="${cx + dx - 18}" y="${f1(base - 172)}" width="36" height="30" rx="6" fill="${col}"/>`).join('')}
        <path d="M${cx - 40} ${f1(base + 40)}V${f1(base - 40)}A40 40 0 0 1 ${cx + 40} ${f1(base - 40)}V${f1(base + 40)}Z" fill="#8C79AE"/>
        ${tower(cx - 170, 70, 240, true)}${tower(cx + 170, 70, 210, false)}${tower(cx, 80, 300, true)}`;
      const mid = hill(b, 72, 300, [[46, 1000], [18, 360]], '#A493C6', '#9483B9', 0.16);
      const r = rng(13);
      const trees = lollipopTrees(r, mid, [460, 560, 1060, 1820, 1920], '#8B79AF', '#7B6A9E', 1);
      const near = hill(c, 73, 140, [[22, 900], [10, 300]], '#7C6DA3', '#6D5F95', 0.12);
      let flowers = '';
      for (let i = 0; i < 26; i++) {
        const x = 80 + i * 92 + r() * 40, y = near.y(x) + 26 + r() * 60;
        flowers += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(6 + r() * 4)}" fill="${['#E7B9CF', '#F1E1A8', '#CFE3D8'][i % 3]}"/>`;
      }
      return [layer(0.55, castleHill.svg + castle, a, 'far'), layer(0.38, mid.svg + trees, b, 'mid'), layer(0.2, near.svg + flowers, c, 'near')];
    },
    ambient: [
      { kind: 'cloud', top: 9, left: 8, w: 28, dur: 110, o: 0.65 },
      { kind: 'cloud', top: 22, left: 64, w: 20, dur: 140, o: 0.5 },
      { kind: 'butterfly', top: 46, left: 14 }, { kind: 'butterfly', top: 38, left: 78, hue: 1 },
    ],
  },
};

// Living details. Each returns { html } for an absolutely positioned element that the
// stylesheet animates with transform/opacity only (compositor work, no repaint).
export function ambientHTML(a, worldId) {
  const pos = [a.top != null && `top:${a.top}%`, a.left != null && `left:${a.left}%`, a.right != null && `right:${a.right}%`, a.w && `--w:${a.w}`].filter(Boolean).join(';');
  const data = `data-pos="${pos}"${a.anchor ? ` data-anchor="${a.anchor.join(',')}"` : ''}${a.dur ? ` data-dur="${a.dur}"` : ''}`;
  switch (a.kind) {
    case 'cloud': return `<div class="amb amb-cloud" ${data} data-o="${a.o || 0.75}">${cloud('#fff', 1)}</div>`;
    case 'sun': {
      const g = uid('sun');
      return `<div class="amb amb-sun" ${data}>${svg('0 0 100 100', `<defs>${rad(g, [[0, '#FFF3DD', 0.95], [0.42, '#F9E7C8', 0.9], [0.5, '#F6E2C2', 0.35], [1, '#F6E2C2', 0]], 0.5, 0.5, 0.5)}</defs><circle cx="50" cy="50" r="50" fill="url(#${g})"/>`, 'aria-hidden="true"')}</div>`;
    }
    case 'smoke': return `<div class="amb amb-smoke" ${data}>${[0, 1, 2].map(i => `<i class="puff p${i}"></i>`).join('')}</div>`;
    case 'ptero': return `<div class="amb amb-glide" ${data}>${svg('0 0 120 50', '<path d="M60 26Q40 6 6 14Q34 20 46 34Q54 30 60 32Q66 30 74 34Q86 20 114 14Q80 6 60 26Z" fill="#9C6F62"/><path d="M60 26Q66 18 76 20Q70 26 62 30Z" fill="#9C6F62"/>', 'aria-hidden="true"')}</div>`;
    case 'fern': return `<div class="amb amb-fern ${a.corner}" ${data}>${svg('0 0 200 260', (() => {
      let s = '<path d="M30 260C40 180 80 110 150 40" fill="none" stroke="#4E6C47" stroke-width="10" stroke-linecap="round"/>';
      for (let i = 1; i < 9; i++) {
        const t = i / 9, x = 30 + 120 * t + 10 * Math.sin(t * 3), y = 260 - 220 * t;
        s += `<path d="M${f1(x)} ${f1(y)}q${-50 + t * 20} ${-6 - t * 8} ${-66 + t * 30} ${-34 + t * 10}" fill="none" stroke="#4E6C47" stroke-width="${f1(14 - t * 7)}" stroke-linecap="round"/><path d="M${f1(x)} ${f1(y)}q${40 - t * 10} ${10 - t * 4} ${60 - t * 26} ${-10 + t * 2}" fill="none" stroke="#557550" stroke-width="${f1(14 - t * 7)}" stroke-linecap="round"/>`;
      }
      return s;
    })(), 'aria-hidden="true"')}</div>`;
    case 'car': return `<div class="amb amb-drive" ${data}>${svg('0 0 160 140', HERO_ART.car([]).replace(/url\(#[^)]+\)/g, '#D9775E'), 'aria-hidden="true"')}</div>`;
    case 'rays': return `<div class="amb amb-rays">${[0, 1, 2, 3].map(i => `<i class="ray r${i}"></i>`).join('')}</div>`;
    case 'fish': return `<div class="amb amb-swim" ${data}>${svg('0 0 120 70', '<path d="M90 35L118 14V56Z" fill="#D68F63"/><ellipse cx="54" cy="35" rx="44" ry="26" fill="#E7A271"/><path d="M40 12Q56 0 70 12Z" fill="#D68F63"/><circle cx="30" cy="30" r="5" fill="#2B2430"/><circle cx="31.6" cy="28.4" r="1.6" fill="#fff"/><path d="M58 20Q66 35 58 50" fill="none" stroke="#F3C7A4" stroke-width="4" stroke-linecap="round"/>', 'aria-hidden="true"')}</div>`;
    case 'bubbles': return `<div class="amb amb-bubbles">${[0, 1, 2, 3, 4, 5].map(i => `<i class="bub b${i}"></i>`).join('')}</div>`;
    case 'weed': return `<div class="amb amb-weed ${a.corner}">${svg('0 0 120 300', '<path d="M40 300C10 230 70 170 40 100C26 66 44 30 60 8" fill="none" stroke="#2C6B5D" stroke-width="16" stroke-linecap="round"/><path d="M80 300C96 250 64 200 86 150" fill="none" stroke="#327563" stroke-width="13" stroke-linecap="round"/>', 'aria-hidden="true"')}</div>`;
    case 'drone': return `<div class="amb amb-hover" ${data}>${svg('0 0 100 80', '<path d="M22 14H44M56 14H78" stroke="#8C93AE" stroke-width="5" stroke-linecap="round"/><path d="M33 14V26M67 14V26" stroke="#8C93AE" stroke-width="4"/><rect x="18" y="24" width="64" height="40" rx="18" fill="#B9C2D6"/><rect x="28" y="32" width="44" height="22" rx="10" fill="#2F3A55"/><circle cx="41" cy="43" r="4.4" fill="#9EDCC4"/><circle cx="59" cy="43" r="4.4" fill="#9EDCC4"/><path d="M50 64V72" stroke="#8C93AE" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="74" r="4" fill="#E8735A"/>', 'aria-hidden="true"')}</div>`;
    case 'gear': return `<div class="amb amb-gear ${a.corner}${a.small ? ' small' : ''}">${svg('0 0 100 100', (() => {
      let t = '';
      for (let i = 0; i < 10; i++) t += `<rect x="44" y="2" width="12" height="18" rx="4" fill="#737A97" transform="rotate(${i * 36} 50 50)"/>`;
      return `${t}<circle cx="50" cy="50" r="36" fill="#737A97"/><circle cx="50" cy="50" r="13" fill="#8C93AE"/>`;
    })(), 'aria-hidden="true"')}</div>`;
    case 'stars': {
      const r = rng(99);
      let s = '';
      for (let i = 0; i < 46; i++) s += `<i class="star${i % 5 === 0 ? ' tw' : ''}" data-pos="left:${f1(r() * 100)}%;top:${f1(r() * 62)}%;--s:${f1(1.4 + r() * 2.2)}px;--o:${f1(0.35 + r() * 0.45)};--d:${f1(4 + r() * 5)}s"></i>`;
      return `<div class="amb amb-stars">${s}</div>`;
    }
    case 'planet': return `<div class="amb amb-planet" ${data}>${svg('0 0 200 140', `<ellipse cx="100" cy="70" rx="96" ry="22" fill="none" stroke="#C9A99A" stroke-width="7" opacity=".55"/><circle cx="100" cy="70" r="50" fill="#C08B88"/><path d="M54 56Q100 46 146 58M52 76Q100 66 148 80M60 94Q100 88 140 98" fill="none" stroke="#B07B7A" stroke-width="8" stroke-linecap="round"/><path d="M4 70A96 22 0 0 0 196 70" fill="none" stroke="#D8B8A6" stroke-width="7" opacity=".85"/>`, 'aria-hidden="true"')}</div>`;
    case 'moon': return `<div class="amb amb-moon" ${data}>${svg('0 0 100 100', '<circle cx="50" cy="50" r="46" fill="#8C95B4"/><circle cx="36" cy="38" r="9" fill="#7C85A6"/><circle cx="62" cy="62" r="12" fill="#7C85A6"/><circle cx="64" cy="30" r="5" fill="#7C85A6"/>', 'aria-hidden="true"')}</div>`;
    case 'satellite': return `<div class="amb amb-orbit" ${data}>${svg('0 0 120 60', '<rect x="4" y="22" width="38" height="16" rx="3" fill="#7F8DB4"/><rect x="78" y="22" width="38" height="16" rx="3" fill="#7F8DB4"/><path d="M42 30H78" stroke="#A3ADC9" stroke-width="4"/><rect x="48" y="16" width="24" height="28" rx="7" fill="#B9C1D8"/><circle cx="60" cy="30" r="5" fill="#E8A07A"/>', 'aria-hidden="true"')}</div>`;
    case 'butterfly': return `<div class="amb amb-flutter${a.hue ? ' alt' : ''}" ${data}>${svg('0 0 60 50', `<g class="wing wl"><path d="M30 25Q8 0 4 18Q2 30 30 27Z" fill="${a.hue ? '#9ACAB3' : '#E3A0BE'}"/><path d="M30 27Q10 34 14 44Q22 46 30 29Z" fill="${a.hue ? '#82B79E' : '#D489AB'}"/></g><g class="wing wr"><path d="M30 25Q52 0 56 18Q58 30 30 27Z" fill="${a.hue ? '#9ACAB3' : '#E3A0BE'}"/><path d="M30 27Q50 34 46 44Q38 46 30 29Z" fill="${a.hue ? '#82B79E' : '#D489AB'}"/></g><path d="M30 18V36" stroke="#7A6A98" stroke-width="3" stroke-linecap="round"/>`, 'aria-hidden="true"')}</div>`;
  }
  return '';
}

export function sceneHTML(worldId) {
  const w = WORLDS[worldId];
  const layers = w.build();
  return `<div class="sky" data-sky="${w.sky.join(',')}"></div>`
    + layers.map(l => l.svg.replace('class="layer', `data-h="${l.h}" class="layer`)).join('')
    + w.ambient.map(a => ambientHTML(a, worldId)).join('');
}

// Picker tile: the world's own sky and two ridges behind its hero, in a square.
export function tileSVG(worldId) {
  const w = WORLDS[worldId], d = [], sky = uid('ts');
  d.push(`<linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1">${w.sky.map((c, i) => `<stop offset="${i / (w.sky.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`);
  const L = w.build();
  const strip = (l, y, s) => {
    const inner = l.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    return `<g transform="translate(${-1200 * s + 100} ${y}) scale(${s})">${inner}</g>`;
  };
  const hero = HERO_ART[HERO_FOR[worldId]](d);
  let extra = '';
  if (worldId === 'space') {
    const r = rng(4);
    for (let i = 0; i < 22; i++) extra += `<circle cx="${f1(r() * 200)}" cy="${f1(r() * 110)}" r="${f1(0.6 + r() * 1.1)}" fill="#D7DDF0" opacity="${f1(0.4 + r() * 0.5)}"/>`;
    extra += `<g transform="translate(118 10) scale(.36)"><ellipse cx="100" cy="70" rx="96" ry="22" fill="none" stroke="#C9A99A" stroke-width="7" opacity=".6"/><circle cx="100" cy="70" r="50" fill="#C08B88"/></g>`;
  }
  if (worldId === 'ocean') extra += `<g fill="#fff" opacity=".07"><path d="M30 0H60L20 200H-10Z"/><path d="M110 0H130L110 200H80Z"/></g>`;
  return svg('0 0 200 200', `<defs>${d.join('')}</defs><rect width="200" height="200" fill="url(#${sky})"/>${extra}
    ${strip(L[0], 40, 0.27)}${strip(L[1], 96, 0.22)}${strip(L[2], 150, 0.18)}
    <g transform="translate(22 52) scale(.98)">${hero}</g>`,
    'aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice"');
}

/* ------------------------------------------------------------------ canvas: balloons */
// Balloon geometry in units of R (half the width). Top at -1.12R, knot at +1.16R.

export function balloonPath(ctx, R) {
  ctx.beginPath();
  ctx.moveTo(0, -1.12 * R);
  ctx.bezierCurveTo(0.6 * R, -1.12 * R, R, -0.74 * R, R, -0.14 * R);
  ctx.bezierCurveTo(R, 0.44 * R, 0.56 * R, 0.96 * R, 0.07 * R, 1.16 * R);
  ctx.lineTo(-0.07 * R, 1.16 * R);
  ctx.bezierCurveTo(-0.56 * R, 0.96 * R, -R, 0.44 * R, -R, -0.14 * R);
  ctx.bezierCurveTo(-R, -0.74 * R, -0.6 * R, -1.12 * R, 0, -1.12 * R);
  ctx.closePath();
}
export const SPRITE = { w: 2.3, h: 2.75, oy: 1.22 };   // sprite box in R units; origin offset from top

function spriteCanvas(R, k) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(SPRITE.w * R * k);
  c.height = Math.ceil(SPRITE.h * R * k);
  const x = c.getContext('2d');
  x.scale(k, k);
  x.translate((SPRITE.w * R) / 2, SPRITE.oy * R);
  return [c, x];
}

// Latex body: soft top-left light, deeper lower edge, light passing through the lower half,
// and a translucent knot. `k` is the pixel scale (devicePixelRatio x quality).
export function makeBalloonBody(color, R, k) {
  const [c, x] = spriteCanvas(R, k);
  x.fillStyle = rgba(darken(color, 0.22), 0.92);
  x.beginPath();
  x.moveTo(-0.08 * R, 1.14 * R); x.lineTo(0.08 * R, 1.14 * R);
  x.quadraticCurveTo(0.14 * R, 1.29 * R, 0, 1.25 * R);
  x.quadraticCurveTo(-0.14 * R, 1.29 * R, -0.08 * R, 1.14 * R);
  x.fill();
  balloonPath(x, R);
  const g = x.createRadialGradient(-0.4 * R, -0.52 * R, 0.05 * R, 0.05 * R, 0.05 * R, 1.6 * R);
  g.addColorStop(0, lighten(color, 0.3));
  g.addColorStop(0.32, lighten(color, 0.07));
  g.addColorStop(0.72, color);
  g.addColorStop(1, darken(color, 0.32));
  x.fillStyle = g;
  x.fill();
  x.save();
  x.clip();
  const s = x.createRadialGradient(0.18 * R, 0.62 * R, 0, 0.18 * R, 0.62 * R, 0.62 * R);
  s.addColorStop(0, rgba(lighten(color, 0.28), 0.42));
  s.addColorStop(1, rgba(lighten(color, 0.28), 0));
  x.fillStyle = s;
  x.fillRect(-R, -1.2 * R, 2 * R, 2.5 * R);
  x.restore();
  return c;
}

// The satin highlight and rim light sit over the printed item, so the print reads as
// being on the latex. One white sprite serves every colour.
export function makeGloss(R, k) {
  const [c, x] = spriteCanvas(R, k);
  x.save();
  balloonPath(x, R);
  x.clip();
  x.save();
  x.translate(-0.4 * R, -0.5 * R);
  x.rotate(-0.55);
  x.scale(0.32, 0.56);
  let g = x.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,255,.42)');
  g.addColorStop(0.45, 'rgba(255,255,255,.17)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.restore();
  x.save();
  x.translate(-0.55 * R, -0.74 * R);
  x.rotate(-0.5);
  x.scale(0.07, 0.11);
  g = x.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,255,.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.restore();
  // Window light bouncing off the lower right of the latex.
  x.save();
  x.translate(0.52 * R, 0.42 * R);
  x.rotate(0.7);
  x.scale(0.16, 0.42);
  g = x.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,255,.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
  x.restore();
  balloonPath(x, R);
  const rim = x.createLinearGradient(-0.6 * R, -0.8 * R, 0.7 * R, 0.9 * R);
  rim.addColorStop(0, 'rgba(255,255,255,0)');
  rim.addColorStop(0.62, 'rgba(255,255,255,0)');
  rim.addColorStop(1, 'rgba(255,255,255,.3)');
  x.strokeStyle = rim;
  x.lineWidth = 0.1 * R;
  x.stroke();
  x.restore();
  return c;
}

// The item printed on the balloon. kind: letter | number | animal | shape | color | gold.
// `img` is a decoded image for animals and shapes. Returns a sprite in balloon space.
export function makeItemSprite(item, R, k, ink, img) {
  const [c, x] = spriteCanvas(R, k);
  const cy = -0.1 * R;
  if (item.kind === 'letter') {
    drawGlyphs(x, item.value, 0, cy, 0.9 * R * (item.value === 'W' || item.value === 'M' ? 0.86 : 1), ink, 0.17);
  } else if (item.kind === 'number') {
    const n = +item.value, cap = 0.66 * R;
    drawGlyphs(x, String(n), 0, -0.36 * R, n === 10 ? cap * 0.92 : cap, ink, 0.17);
    const P = dots(n), sp = n > 6 ? 0.2 * R : 0.21 * R, r = n > 6 ? 0.075 * R : 0.085 * R;
    x.fillStyle = ink;
    for (const [dx, dy] of P) { x.beginPath(); x.arc(dx * sp, 0.4 * R + dy * sp * (n > 6 ? 0.9 : 0.8), r, 0, Math.PI * 2); x.fill(); }
  } else if ((item.kind === 'animal' || item.kind === 'shape') && img) {
    const s = item.kind === 'animal' ? 1.76 * R : 1.12 * R;
    x.drawImage(img, -s / 2, cy - s / 2 + (item.kind === 'animal' ? 0.02 * R : 0), s, s);
  } else if (item.kind === 'gold') {
    x.fillStyle = rgba(CREAM, 0.92);
    x.strokeStyle = rgba(CREAM, 0.92);
    x.lineWidth = 0.1 * R;
    x.lineJoin = 'round';
    x.fill(starPath(0, cy, 0.56 * R, 0.25 * R));
    x.stroke(starPath(0, cy, 0.56 * R, 0.25 * R));
  }
  return c;
}
function starPath(cx, cy, R, r) {
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R;
    i ? p.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : p.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  p.closePath();
  return p;
}

// Matte latex shards for the pop: irregular curved pieces, a few tones of the body colour.
export function makeShard(r, size) {
  const n = 4 + Math.floor(r() * 2), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.6, d = size * (0.55 + r() * 0.45);
    pts.push([Math.cos(a) * d, Math.sin(a) * d * (0.5 + r() * 0.4)]);
  }
  const p = new Path2D();
  p.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  p.closePath();
  return p;
}

// SVG string to a decoded bitmap at a given pixel size (for animals and shapes on balloons).
export function svgImage(markup) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
