// Karma Play: screens, rounds, Find moments, stickers and the parent corner.
// No network calls except same-origin files, no analytics. Progress lives in one
// localStorage key, written at the end of a round and when a setting changes.

import * as A from './art.js';
import { mountScene, layoutScene } from './scene.js';
import { Stage, balloonColorFor } from './stage.js';
import { Sound } from './audio.js';
import { CLIPS } from './voice-pack.js';
import { makeItem, GOLD_ITEM, poolFor, stageFor, itemName, findText, allItems } from './content.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const STORE = 'karmaplay.v1';
const HEROES = ['h:dino', 'h:car', 'h:whale', 'h:robot', 'h:rocket', 'h:unicorn'];
const WORLD_HERO = { dino: 'h:dino', cars: 'h:car', ocean: 'h:whale', robot: 'h:robot', space: 'h:rocket', fantasy: 'h:unicorn' };
const PRAISE = ['Pyay', 'Pgreatjob', 'Psuper', 'Pamazing', 'Pwow'];
const rnd = n => (Math.random() * n) | 0;
const now = () => performance.now();
const inFrame = (() => { try { return window.top !== window; } catch (e) { return true; } })();

/* ------------------------------------------------------------------ storage */

const DEFAULTS = { v: 1, settings: { music: true, sfx: true, voice: true, length: 'normal', limit: 0 }, seen: {}, found: {}, stickers: [], rounds: 0, day: '', playedMs: 0 };

// Dates as numbers only: Safari cannot parse "2026-10-9".
function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadState() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { s = null; }
  if (!s || s.v !== 1) { s = JSON.parse(JSON.stringify(DEFAULTS)); migrate(s); }
  s.settings = { ...DEFAULTS.settings, ...(s.settings || {}) };
  s.seen = s.seen || {}; s.found = s.found || {}; s.stickers = Array.isArray(s.stickers) ? s.stickers : [];
  if (s.day !== dayKey()) { s.day = dayKey(); s.playedMs = 0; }
  return s;
}

// Karma Play 2.x kept stars, toggles and letters seen under kvg_os3. Stars become hero
// stickers (one per ten stars, at least one for anyone who earned any), letters and
// numbers seen carry over, so a returning child starts where they were.
function migrate(s) {
  try {
    const old = JSON.parse(localStorage.getItem('kvg_os3') || localStorage.getItem('kvg_os2') || 'null');
    if (!old || typeof old !== 'object') return;
    s.settings.music = old.musicOn !== false;
    s.settings.voice = old.speechOn !== false;
    const stars = Math.max(0, +old.stars || 0);
    s.stickers = HEROES.slice(0, stars > 0 ? Math.min(6, Math.max(1, Math.ceil(stars / 10))) : 0);
    for (const [k, v] of Object.entries(old.lettersSeen || {})) {
      const n = Math.min(9, Math.max(0, v | 0));
      if (/^[A-Z]$/.test(k)) s.seen['L' + k] = n;
      else if (/^([1-9]|10)$/.test(k)) s.seen['N' + k] = n;
    }
    s.migratedFrom = 'kvg_os3';
    writeState(s);
  } catch (e) { /* unreadable old data: start fresh */ }
}

function writeState(s = S) {
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) { /* private mode: play still works */ }
}

const S = loadState();

/* ------------------------------------------------------------------ sound, stage, scenes */

const sound = new Sound();
for (const k of ['music', 'sfx', 'voice']) sound.on[k] = S.settings[k];
let unlocked = false;

function unlock() {
  sound.unlock();
  if (unlocked || !sound.ctx) return;
  unlocked = true;
  const phrases = Object.keys(CLIPS).filter(k => k[0] === 'P');
  const pool = poolFor(stageFor(S.seen)).map(([k, v]) => makeItem(k, v).key);
  sound.preload([...phrases, ...pool, ...Object.keys(CLIPS)]);
}

const stage = new Stage($('stage'), { onPop, onLeave });
let stageReady = false;
const ready = stage.prepare().then(() => { stageReady = true; });
$('stage').addEventListener('pointerup', unlock);

let sceneCur = $('sceneA'), sceneNext = $('sceneB'), sceneWorld = null;
function showScene(world) {
  if (sceneWorld === world) return;
  sceneWorld = world;
  mountScene(sceneNext, world);
  sceneNext.classList.add('on');
  sceneCur.classList.remove('on');
  const old = sceneCur;
  [sceneCur, sceneNext] = [sceneNext, sceneCur];
  setTimeout(() => { if (old !== sceneCur) old.replaceChildren(); }, reduced.matches ? 0 : 700);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = A.WORLDS[world].sky[0];
  document.documentElement.dataset.world = world;
}

let resizeRaf = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => { layoutScene(sceneCur); setInsets(); });
});

// Safe areas resolve only on real properties, so a hidden probe carries them as padding.
function setInsets() {
  const cs = getComputedStyle($('safe'));
  const px = v => parseFloat(cs[v]) || 0;
  stage.setInsets({ top: px('paddingTop') + 76, side: Math.max(px('paddingLeft'), px('paddingRight')), bottom: px('paddingBottom') });
}

/* ------------------------------------------------------------------ screens */

let screen = 'welcome';
const SCREENS = ['welcome', 'picker', 'hud', 'done', 'rest'];
const VIS = { welcome: ['welcome'], picker: ['picker'], game: ['hud'], done: ['done'], rest: ['rest'] };

function go(name) {
  screen = name;
  $('app').dataset.screen = name;
  const show = VIS[name];
  for (const id of SCREENS) {
    const el = $(id), want = show.includes(id);
    if (want && el.hidden) { el.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on'))); }
    else if (!want && !el.hidden) {
      el.classList.remove('on');
      if (reduced.matches) el.hidden = true;
      else setTimeout(() => { if (!VIS[screen].includes(id)) el.hidden = true; }, 320);
    }
  }
  $('dim').classList.toggle('on', name === 'done' || name === 'rest');
  $('stage').tabIndex = name === 'game' ? 0 : -1;
  if (name === 'welcome') { showScene('home'); stage.clear(); stage.speedScale = 1; stage.start(); lastAmbient = 0; renderBookCount(); }
  if (name === 'picker') { stage.clear(); stage.stop(); }
  if (name === 'game') { stage.start(); }
  if (name === 'welcome' || name === 'picker') { if (unlocked) sound.music('home'); }
  if (name !== 'game' && name !== 'done') releaseWake();
}

/* ------------------------------------------------------------------ boot: art into the DOM */

function boot() {
  document.body.insertAdjacentHTML('afterbegin', A.iconSprite());
  for (const el of document.querySelectorAll('[data-icon]')) {
    const host = el.classList.contains('play') ? el.querySelector('.play-face') : el;
    (host || el).insertAdjacentHTML('afterbegin', A.icon(el.dataset.icon || 'play'));
  }
  for (const el of document.querySelectorAll('[data-ring]')) {
    el.insertAdjacentHTML('beforeend', '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="46" pathLength="100"/></svg>');
  }
  if (!$('wordmark').querySelector('svg')) $('wordmark').insertAdjacentHTML('beforeend', A.wordmarkSVG({ attrs: 'aria-hidden="true" focusable="false"' }));
  $('tiles').innerHTML = A.WORLD_IDS.map(w => `<button class="tile" type="button" data-world="${w}" aria-label="${A.WORLDS[w].name} World">
      <span class="tile-art">${A.tileSVG(w)}</span><span class="tile-name">${A.wordSVG(A.WORLDS[w].name)}</span></button>`).join('');
  $('doneWord').innerHTML = A.wordSVG('All done');
  $('restWord').innerHTML = A.wordSVG('rest time');
  $('bookWord').innerHTML = A.wordSVG('stickers');
  $('restArt').innerHTML = restArt();
  buildProgress(10);
  syncParents();
  setInsets();
  go('welcome');
  document.documentElement.classList.add('ready');
}

function restArt() {
  const defs = [];
  const b = (c, x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">${A.balloonSVGGroup(c, defs, { string: false })}</g>`;
  const body = `<path d="M60 150C80 176 100 186 120 196M120 92C120 140 118 170 120 196M182 106C170 150 140 178 120 196" fill="none" stroke="#5B5670" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    ${b(A.COLORS.blue.fill, 62, 92, -16, 0.42)}${b(A.COLORS.yellow.fill, 182, 96, 14, 0.42)}${b(A.COLORS.red.fill, 122, 66, 0, 0.46)}
    <path d="M100 196H140L134 214H106Z" fill="#B9A58C"/>`;
  return A.svg('0 0 240 220', `<defs>${defs.join('')}</defs>${body}`, 'aria-hidden="true" focusable="false"');
}

/* ------------------------------------------------------------------ welcome */

let lastAmbient = 0, ambientColor = 0;
const AMBIENT = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];

function welcomeTick(t) {
  if (stage.count() >= 3 || t - lastAmbient < 2300) return;
  lastAmbient = t;
  const c = A.COLORS[AMBIENT[ambientColor++ % 6]].fill;
  const w = stage.w, R = stage.R;
  const x = (stage.count() === 0 ? 0.24 : stage.count() === 1 ? 0.76 : 0.5) * w + (Math.random() - 0.5) * R;
  stage.spawn({ color: c, x, speed: Math.max(46, stage.h / 13) });
}

$('play').addEventListener('click', () => {
  unlock();
  sound.say(['Pletsplay'], 'keep');
  go('picker');
  requestAnimationFrame(() => { const t = $('tiles').querySelector('.tile'); if (t && matchMedia('(hover: hover)').matches) t.focus({ preventScroll: true }); });
});
$('pickBack').addEventListener('click', () => { unlock(); sound.tap(); go('welcome'); });
$('tiles').addEventListener('click', e => {
  const tile = e.target.closest('.tile');
  if (!tile || tile.classList.contains('picked')) return;
  unlock();
  const w = tile.dataset.world;
  sound.tap();
  sound.say(['P' + w], 'keep');
  tile.classList.add('picked');
  setTimeout(() => { tile.classList.remove('picked'); startRound(w); }, reduced.matches ? 120 : 560);
});

/* ------------------------------------------------------------------ the round */

let R = null;

function startRound(world) {
  if (limitReached()) { showScene(world); go('rest'); return; }
  const n = S.settings.length === 'short' ? 6 : 10;
  R = {
    world, n, popped: 0, nextFind: 3, findStep: 4, find: null, ending: false,
    // A golden balloon is rare: about one round in three, and always in a child's very first round.
    golden: S.rounds === 0 || Math.random() < 0.35 ? 2 + rnd(n - 3) : -1, goldenDone: false,
    stickers: [], found: [], lastKey: null, recent: [], colors: [],
    stage: stageFor(S.seen), lastSpawn: -1e9, warm: 3, started: now(), visibleMs: 0, visSince: now(),
    hints: 0, hintAt: now() + 5500, hinted: null,
  };
  closeSheet();
  showScene(world);
  stage.clear();
  const W = A.WORLDS[world];
  stage.setWorld({ string: W.string, puff: W.puff || ['#F2D6A2', '#EAB9B3', '#BFD8C9', '#C9C3E6'] });
  buildProgress(n);
  go('game');
  sound.music(world);
  requestWake();
  ready.then(() => { if (R && R.world === world) $('stage').focus({ preventScroll: true }); });
}

function buildProgress(n) {
  const p = $('progress');
  p.setAttribute('aria-valuemax', n);
  p.setAttribute('aria-valuenow', 0);
  p.innerHTML = '<i></i>'.repeat(n);
}

function markProgress(color) {
  const p = $('progress'), dots = p.children, i = Math.min(R.popped, R.n) - 1;
  if (dots[i]) { dots[i].classList.add('on'); dots[i].style.setProperty('--c', color); }
  p.setAttribute('aria-valuenow', Math.min(R.popped, R.n));
}

function pickKind(pool) {
  const kinds = { letter: 0.3, number: 0.25, animal: 0.25, color: 0.1, shape: 0.1 };
  const have = new Set(pool.map(p => p[0]));
  let tot = 0;
  for (const k in kinds) if (have.has(k)) tot += kinds[k];
  let r = Math.random() * tot;
  for (const k in kinds) if (have.has(k)) { r -= kinds[k]; if (r <= 0) return k; }
  return 'letter';
}

function nextColorName() {
  const recent = R.colors.slice(-2);
  const options = A.COLOR_NAMES.filter(c => !recent.includes(c));
  const c = options[rnd(options.length)];
  R.colors.push(c);
  return c;
}

function nextItem() {
  const pool = poolFor(R.stage);
  const kind = pickKind(pool), ofKind = pool.filter(p => p[0] === kind);
  for (let i = 0; i < 12; i++) {
    const [k, v] = ofKind[rnd(ofKind.length)];
    const it = makeItem(k, v, nextColorName());
    if (!R.recent.includes(it.key) || i === 11) {
      R.recent.push(it.key); if (R.recent.length > 5) R.recent.shift();
      return it;
    }
  }
}

function spawnFree(t) {
  // ">=" not "===": pops during a Find moment, or while the sky is full, can step past the
  // exact count, and the golden balloon must still come.
  if (R.golden >= 0 && R.popped >= R.golden && !R.goldenDone) {
    R.goldenDone = true;
    stage.spawn({ item: GOLD_ITEM, color: A.GOLD, golden: true });
  } else {
    const it = nextItem();
    stage.spawn({ item: it, color: balloonColorFor(it, it.colorName, R.world) });
  }
  R.lastSpawn = t;
}

// Before the first pop of a round, a child who only watches hears "Tap me!" and sees the
// lowest balloon wiggle, twice at most (the cue live Karma Play had for a first game).
function tapHint(t) {
  if (R.popped > 0 || R.hints >= 2 || t < R.hintAt || sound.busy()) return;
  const low = stage.balloons.filter(b => b.state === 'rise' && b.y < stage.h - b.R * 1.2 && b.y > stage.insetTop + b.R)
    .sort((a, b) => b.y - a.y)[0];
  if (!low) return;
  R.hints++;
  R.hintAt = t + 8000;
  R.hinted = low;
  stage.setWobble(low, true);
  sound.say(['Ptapme'], 'prompt');
}

function roundTick(t) {
  if (!R || R.ending || paused || !stageReady) return;
  if (R.find) return findTick(t);
  tapHint(t);
  const gap = R.warm > 0 ? 520 : 1150 + rnd(450);
  if (stage.count() < stage.maxBalloons && t - R.lastSpawn > gap) {
    spawnFree(t);
    if (R.warm > 0) R.warm--;
  }
}

function onPop(b) {
  if (screen === 'welcome') { sound.pop((b.x / stage.w) * 2 - 1); return; }
  if (!R || (screen !== 'game' && screen !== 'done') || R.ending) return;
  if (R.hinted) { stage.setWobble(R.hinted, false); R.hinted = null; }
  sound.pop((b.x / stage.w) * 2 - 1, b.golden);
  buzz();
  if (b.golden) {
    earnSticker();
    R.popped++;
    markProgress(A.GOLD);
    afterCount();
    return;
  }
  const it = b.item;
  S.seen[it.key] = (S.seen[it.key] || 0) + 1;
  R.lastKey = it.key;
  announce(itemName(it));
  if (R.find) {
    if (it.key === R.find.item.key) {
      S.found[it.key] = (S.found[it.key] || 0) + 1;
      if (!R.found.some(f => f.key === it.key)) R.found.push(it);
      sound.chime('found');
      sound.drop('prompt');
      sound.say([it.key, CLIPS.Pfoundit ? 'Pfoundit' : PRAISE[rnd(PRAISE.length)]], 'praise');
      endFind();
    } else {
      // Not the one asked for: still a pop. Name it, then ask again kindly.
      sound.say([it.key], 'keep');
      sound.say(promptKeys(R.find.item), 'prompt');
      R.find.idleAt = now();
      R.find.cands = R.find.cands.filter(c => c !== b);
    }
  } else {
    sound.say([it.key], 'label');
  }
  R.popped++;
  markProgress(b.color);
  afterCount();
}

function afterCount() {
  if (R.find) return;
  if (R.popped >= R.n) return endRound();
  if (R.popped >= R.nextFind) { R.nextFind = R.popped + 1 + R.findStep; R.findStep = R.findStep === 4 ? 3 : 4; startFind(); }
}

function onLeave(b) {
  if (screen === 'welcome' || !R || !R.find || R.ending) return;
  if (b.item && b.item.key === R.find.item.key && !R.find.cands.some(c => c.state === 'rise' && c.item.key === b.item.key)) {
    const c = stage.spawn({ item: b.item, color: b.color, hoverY: stage.h * 0.5, target: true });
    c.candidate = true;
    R.find.cands.push(c);
  }
}

/* ------------------------------------------------------------------ Find moments */

function promptKeys(it) {
  const own = 'F' + it.key;
  return CLIPS[own] ? [own] : ['Pfind', it.key];
}

function pickTarget() {
  const pool = poolFor(R.stage);
  const kind = pickKind(pool), ofKind = pool.filter(p => p[0] === kind).map(([k, v]) => makeItem(k, v, nextColorName()));
  // Prefer what this child has seen but not yet found when asked, then anything.
  const fresh = ofKind.filter(i => (S.seen[i.key] || 0) > 0 && !(S.found[i.key] > 0) && !R.found.some(f => f.key === i.key));
  const list = fresh.length ? fresh : ofKind;
  return list[rnd(list.length)];
}

function startFind() {
  // Free balloons still up drift away faster, so the candidates have the sky to themselves.
  for (const b of stage.balloons) if (b.state === 'rise' && !b.candidate) b.speed *= 2.2;
  const target = pickTarget();
  const sameKind = poolFor(3).filter(p => p[0] === target.kind).map(([k, v]) => makeItem(k, v, nextColorName()))
    .filter(i => i.key !== target.key);
  const near = poolFor(R.stage).filter(p => p[0] === target.kind).map(p => makeItem(p[0], p[1]).key);
  // Distractors from what the child already knows where possible; colours start far apart.
  const pref = sameKind.filter(i => near.includes(i.key));
  const src = pref.length >= 3 ? pref : sameKind;
  const want = R.stage === 0 ? 2 : R.stage < 3 ? 3 : 4;
  const side = stage.insetSide + stage.R * 1.15, span = stage.w - side * 2;
  const fit = Math.max(2, Math.min(want, 1 + Math.floor(span / (stage.R * 1.55))));
  const items = [target];
  const shuffled = src.sort(() => Math.random() - 0.5);
  for (const i of shuffled) { if (items.length >= fit) break; if (!items.some(x => x.key === i.key)) items.push(i); }
  items.sort(() => Math.random() - 0.5);
  const top = stage.insetTop + stage.R * 1.6, bottom = stage.h - stage.R * 2.6;
  const rows = [top + (bottom - top) * 0.36, top + (bottom - top) * 0.7];
  const cands = items.map((it, i) => {
    const x = side + (items.length === 1 ? span / 2 : (span * i) / (items.length - 1));
    const b = stage.spawn({ item: it, color: balloonColorFor(it, it.colorName, R.world), x, hoverY: rows[i % 2] + (Math.random() - 0.5) * stage.R * 0.3, target: it.key === target.key, speed: Math.max(90, stage.h / 6) });
    b.candidate = true;
    return b;
  });
  R.find = { item: target, cands, idleAt: now(), wobbling: false, repeats: 0 };
  sound.say(promptKeys(target), 'prompt');
  announce(findText(target));
}

function findTick(t) {
  const F = R.find, idle = t - F.idleAt;
  if (!F.wobbling && idle > 6000) {
    F.wobbling = true;
    for (const c of F.cands) if (c.item.key === F.item.key) stage.setWobble(c, true);
  }
  if (idle > 6000 && F.repeats < 3 && !sound.busy()) {
    F.repeats++;
    F.idleAt = t;
    sound.say(promptKeys(F.item), 'prompt');
  }
}

function endFind() {
  const F = R.find;
  R.find = null;
  for (const c of F.cands) { stage.setWobble(c, false); c.hoverY = null; c.target = false; c.speed = Math.max(c.speed, stage.h / 7); }
  R.lastSpawn = now() + 500;
}

function sayAgain() {
  unlock();
  if (!R) return;
  if (R.find) { R.find.idleAt = now(); sound.say(promptKeys(R.find.item), 'prompt'); }
  else if (R.lastKey) sound.say([R.lastKey], 'keep');
  else sound.say(['Ptapme'], 'prompt');
}
$('againBtn').addEventListener('click', sayAgain);

/* ------------------------------------------------------------------ stickers */

function earnSticker() {
  const owned = new Set(S.stickers);
  let id = WORLD_HERO[R.world];
  if (owned.has(id)) {
    const free = [...HEROES, ...A.ANIMALS.map(a => 'a:' + a)].filter(s => !owned.has(s));
    const foundAnimals = free.filter(s => s.startsWith('a:') && S.seen['A' + s.slice(2)]);
    const list = foundAnimals.length ? foundAnimals : free;
    id = list.length ? list[rnd(list.length)] : A.STICKERS[rnd(A.STICKERS.length)];
  }
  if (!owned.has(id)) S.stickers.push(id);
  R.stickers.push(id);
  sound.chime('sticker');
  // Name what was earned: "Wow! Lion!" for an animal, "Wow! Dino World!" for a hero.
  const [kind, name] = id.split(':');
  const heroWorld = Object.keys(WORLD_HERO).find(w => WORLD_HERO[w] === id);
  sound.say(['Pwow', kind === 'a' ? 'A' + name : heroWorld ? 'P' + heroWorld : 'Pamazing'], 'praise');
  announce(`Sticker: ${A.stickerLabel(id)}`);
  const pop = $('stickerPop');
  pop.innerHTML = A.stickerSVG(id, 'focusable="false"');
  pop.classList.remove('show');
  void pop.offsetWidth;
  pop.classList.add('show');
  clearTimeout(pop._t);
  pop._t = setTimeout(() => pop.classList.remove('show'), 2200);
}

function renderBookCount() {
  const n = S.stickers.length;
  $('bookCount').textContent = n ? String(n) : '';
  $('bookBtn').setAttribute('aria-label', n ? `Sticker book, ${n} sticker${n === 1 ? '' : 's'}` : 'Sticker book');
}

function renderBook() {
  const owned = new Set(S.stickers);
  $('stickers').innerHTML = A.STICKERS.map(id => owned.has(id)
    ? `<button class="sticker" type="button" data-sticker="${id}" aria-label="${A.stickerLabel(id)}">${A.stickerSVG(id, 'focusable="false"')}</button>`
    : `<span class="sticker empty" aria-hidden="true">${A.stickerSVG(id, 'focusable="false"')}</span>`).join('');
}
$('stickers').addEventListener('click', e => {
  const b = e.target.closest('[data-sticker]');
  if (!b) return;
  unlock();
  const [kind, name] = b.dataset.sticker.split(':');
  const world = Object.keys(WORLD_HERO).find(w => WORLD_HERO[w] === b.dataset.sticker);
  sound.say([kind === 'a' ? 'A' + name : 'P' + world], 'keep');
  b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
});
$('bookBtn').addEventListener('click', () => { unlock(); sound.tap(); renderBook(); openSheet('book'); });

/* ------------------------------------------------------------------ round end */

function playedNow() {
  if (!R) return 0;
  return R.visibleMs + (document.hidden ? 0 : now() - R.visSince);
}

function endRound() {
  if (R.ending) return;
  R.ending = true;
  stage.releaseAll();
  releaseWake();
  S.rounds++;
  S.playedMs += playedNow();
  writeState();
  const ended = R;
  setTimeout(() => { if (R === ended) sound.say([CLIPS.Palldone ? 'Palldone' : 'Pgreatjob'], 'praise'); }, 500);
  setTimeout(() => {
    if (!R || !R.ending) return;
    if (limitReached()) { go('rest'); return; }
    renderEarned();
    go('done');
    $('againRound').focus({ preventScroll: true });
  }, reduced.matches ? 400 : 1300);
}

function renderEarned() {
  const parts = [];
  for (const id of R.stickers) parts.push(`<span class="earned-sticker" role="img" aria-label="Sticker: ${A.stickerLabel(id)}">${A.stickerSVG(id, 'focusable="false"')}</span>`);
  for (const it of R.found.slice(0, 4)) parts.push(`<span class="earned-item" role="img" aria-label="Found: ${itemName(it)}">${foundArt(it)}</span>`);
  $('earned').innerHTML = parts.join('');
  $('earned').hidden = !parts.length;
}

function foundArt(it) {
  if (it.kind === 'animal') return A.animalSVG(it.value, 'focusable="false"');
  if (it.kind === 'shape') return A.shapeSVG(it.value, A.SHAPE_INK, 'focusable="false"');
  if (it.kind === 'color') return `<svg viewBox="0 0 100 100" focusable="false"><circle cx="50" cy="50" r="34" fill="${A.COLORS[it.value].fill}"/></svg>`;
  const text = it.kind === 'letter' ? it.value + it.value.toLowerCase() : it.value;
  return A.glyphSVG(text, A.darken(A.COLORS[it.colorName || 'blue'].fill, 0.1), 0.16, 16, 'focusable="false"');
}

function leaveRound() {
  if (R && !R.ending) { S.playedMs += playedNow(); writeState(); }
  R = null;
  sound.clearVoice();
  stage.clear();
  go('welcome');
}

$('againRound').addEventListener('click', () => { unlock(); const w = R ? R.world : 'dino'; R = null; startRound(w); });
$('doneHome').addEventListener('click', () => { unlock(); leaveRound(); });
$('restHome').addEventListener('click', () => { unlock(); leaveRound(); });

function limitReached() {
  if (S.day !== dayKey()) { S.day = dayKey(); S.playedMs = 0; }
  return S.settings.limit > 0 && S.playedMs >= S.settings.limit * 60000;
}

/* ------------------------------------------------------------------ hold buttons */

function holdButton(btn, ms, done) {
  let timer = 0, t0 = 0, hintT = 0;
  btn.style.setProperty('--hold', ms + 'ms');
  const start = () => {
    if (timer) return;
    t0 = now();
    btn.classList.add('holding');
    btn.classList.remove('hint');
    timer = setTimeout(() => { timer = 0; btn.classList.remove('holding'); done(); }, ms);
  };
  const cancel = () => {
    if (!timer) return;
    clearTimeout(timer); timer = 0; btn.classList.remove('holding');
    // A quick tap: show the grown-up the hold hint for a moment.
    if (now() - t0 < ms * 0.6) { btn.classList.add('hint'); clearTimeout(hintT); hintT = setTimeout(() => btn.classList.remove('hint'), 1800); }
  };
  btn.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); start(); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'blur']) btn.addEventListener(ev, cancel);
  btn.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); start(); } });
  btn.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') cancel(); });
  btn.addEventListener('click', e => e.preventDefault());
}
holdButton($('homeBtn'), 900, () => { unlock(); leaveRound(); });
holdButton($('lockBtn'), 2000, () => { unlock(); openGate(); });

/* ------------------------------------------------------------------ sheets */

let openEl = null, lastFocus = null, paused = false;

function openSheet(id) {
  closeSheet(true);
  const el = $(id);
  lastFocus = document.activeElement;
  el.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  openEl = el;
  if (screen === 'game' && R && !R.ending) { paused = true; stage.stop(); }
  const f = el.querySelector('[data-autofocus]') || el.querySelector('.sheet button, .sheet a');
  if (f) f.focus({ preventScroll: true });
}

function closeSheet(quiet) {
  if (!openEl) return;
  const el = openEl;
  openEl = null;
  el.classList.remove('on');
  if (reduced.matches) el.hidden = true; else setTimeout(() => { if (openEl !== el) el.hidden = true; }, 240);
  if (paused) { paused = false; if (R) { if (R.find) R.find.idleAt = now(); } stage.start(); }
  if (!quiet && lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { closeSheet(); return; }
  if (openEl && e.target === openEl) closeSheet();
});
document.addEventListener('keydown', e => {
  if (!openEl) return;
  if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
  if (e.key === 'Tab') {
    const f = [...openEl.querySelectorAll('button:not([disabled]), a[href]')].filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }
});

/* ------------------------------------------------------------------ parent gate */

const GATE = [[13, 'thirteen'], [14, 'fourteen'], [15, 'fifteen'], [16, 'sixteen'], [17, 'seventeen'], [18, 'eighteen'], [19, 'nineteen'], [24, 'twenty-four'], [36, 'thirty-six'], [42, 'forty-two']];

function openGate() {
  const [n, word] = GATE[rnd(GATE.length)];
  const rev = +String(n).split('').reverse().join('');
  const opts = new Set([n, rev === n ? n + 10 : rev, n + 1, n - 2]);
  while (opts.size < 4) opts.add(n + 3 + rnd(9));
  const keys = [...opts].sort(() => Math.random() - 0.5);
  $('gateQ').textContent = `Tap the number ${word}.`;
  $('gateKeys').innerHTML = keys.map(k => `<button type="button" class="gate-key" data-n="${k}">${k}</button>`).join('');
  $('gateKeys').dataset.answer = n;
  if (CLIPS.Paskgrownup) sound.say(['Paskgrownup'], 'keep');
  openSheet('gate');
}
$('gateKeys').addEventListener('click', e => {
  const k = e.target.closest('.gate-key');
  if (!k) return;
  if (k.dataset.n === $('gateKeys').dataset.answer) { syncParents(); openSheet('parents'); }
  else closeSheet();
});

/* ------------------------------------------------------------------ parent corner */

function syncParents() {
  for (const b of document.querySelectorAll('[data-set]')) b.setAttribute('aria-pressed', String(!!S.settings[b.dataset.set]));
  for (const b of document.querySelectorAll('[data-len]')) b.setAttribute('aria-checked', String(S.settings.length === b.dataset.len));
  for (const b of document.querySelectorAll('[data-limit]')) b.setAttribute('aria-checked', String(+b.dataset.limit === S.settings.limit));
  renderMet();
}

function renderMet() {
  const groups = allItems(), names = { letters: 'Letters', numbers: 'Numbers', animals: 'Animals', colors: 'Colours', shapes: 'Shapes' };
  $('met').innerHTML = Object.entries(groups).map(([g, items]) => {
    const seen = items.filter(i => S.seen[i.key]).length, found = items.filter(i => S.found[i.key]).length;
    const chips = items.map(i => {
      const st = S.found[i.key] ? 'found' : S.seen[i.key] ? 'seen' : '';
      const label = i.kind === 'letter' ? i.value : i.kind === 'number' ? i.value : i.value;
      return `<li class="chip ${st}" title="${itemName(i)}">${label}<span class="vh">${st ? `, ${st}` : ', not yet'}</span></li>`;
    }).join('');
    return `<div class="met-group"><h4>${names[g]} <span>${seen} of ${items.length} seen, ${found} found</span></h4><ul class="chips ${g}">${chips}</ul></div>`;
  }).join('');
}

document.querySelector('.parents').addEventListener('click', e => {
  const t = e.target.closest('[data-set],[data-len],[data-limit]');
  if (!t) return;
  if (t.dataset.set) { const k = t.dataset.set; S.settings[k] = !S.settings[k]; sound.set(k, S.settings[k]); }
  if (t.dataset.len) S.settings.length = t.dataset.len;
  if (t.dataset.limit != null) S.settings.limit = +t.dataset.limit;
  writeState();
  syncParents();
});
// Arrow keys move within a radio group.
for (const g of document.querySelectorAll('.seg')) {
  g.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const bs = [...g.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
    const n = bs[(i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? bs.length - 1 : 1)) % bs.length];
    e.preventDefault(); n.focus(); n.click();
  });
}

let resetArmed = 0;
$('resetBtn').addEventListener('click', () => {
  const b = $('resetBtn');
  if (!resetArmed) {
    resetArmed = setTimeout(() => { resetArmed = 0; b.textContent = 'Reset progress'; }, 4000);
    b.textContent = 'Tap again to erase stickers and progress';
    return;
  }
  clearTimeout(resetArmed); resetArmed = 0;
  S.seen = {}; S.found = {}; S.stickers = []; S.rounds = 0;
  writeState();
  b.textContent = 'Progress erased';
  renderMet(); renderBookCount();
});

/* ------------------------------------------------------------------ small things */

let liveT = 0;
function announce(text) {
  const el = $('live');
  el.textContent = '';
  clearTimeout(liveT);
  liveT = setTimeout(() => { el.textContent = text; }, 30);
}

function buzz() {
  if (inFrame || !navigator.vibrate) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try { navigator.vibrate(8); } catch (e) { /* not allowed */ }
}

let wake = null;
async function requestWake() {
  if (inFrame || !('wakeLock' in navigator) || wake || document.visibilityState !== 'visible') return;
  try {
    wake = await navigator.wakeLock.request('screen');
    wake.addEventListener('release', () => { wake = null; });
  } catch (e) { wake = null; }
}
function releaseWake() { if (wake) { wake.release().catch(() => {}); wake = null; } }

// One timer drives spawning and Find timing; motion lives in the stage's rAF loop.
let tickTimer = 0;
function tick() {
  const t = now();
  if (screen === 'welcome') welcomeTick(t);
  else if (screen === 'game') roundTick(t);
}
function startTick() { if (!tickTimer) tickTimer = setInterval(tick, 120); }
function stopTick() { clearInterval(tickTimer); tickTimer = 0; }

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopTick();
    if (R) { R.visibleMs += now() - R.visSince; }
    releaseWake();
  } else {
    startTick();
    if (R) { R.visSince = now(); if (R.find) R.find.idleAt = now(); }
    if (screen === 'game' && R && !R.ending) requestWake();
  }
});

// Any tap wakes audio that iOS interrupted (a call, Siri) or suspended.
document.addEventListener('pointerup', () => { if (sound.ctx && sound.ctx.state !== 'running') sound.resume(); }, true);
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => { if (screen === 'game') e.preventDefault(); });
document.addEventListener('dblclick', e => { if (screen === 'game') e.preventDefault(); });

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

// Test hooks for the verification scripts (read-only views and the voice log).
window.__kp = { stage, sound, state: () => ({ screen, round: R && { popped: R.popped, n: R.n, find: R.find && R.find.item.key, ending: R.ending } }), S };

boot();
startTick();
