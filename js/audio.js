// Karma Play sound: one AudioContext, created and resumed inside a tap. Three buses (music,
// sound effects, voice) into a master limiter. Music is generative and calm, scheduled on
// the audio clock with a lookahead, and ducks under the voice. The voice plays from one
// queue so nothing is swallowed: a label and the praise after it are one utterance.

import { CLIPS, VOICE_DIR } from './voice-pack.js';

const MUSIC = {
  home:    { root: 55, bpm: 76, wave: 'triangle', cut: 1600, bright: 0.5 },
  dino:    { root: 53, bpm: 84, wave: 'triangle', cut: 1700, bright: 0.55 },
  cars:    { root: 57, bpm: 92, wave: 'triangle', cut: 2000, bright: 0.6 },
  ocean:   { root: 50, bpm: 70, wave: 'sine', cut: 1400, bright: 0.45 },
  robot:   { root: 60, bpm: 96, wave: 'square', cut: 900, bright: 0.5 },
  space:   { root: 52, bpm: 64, wave: 'sine', cut: 1300, bright: 0.4 },
  fantasy: { root: 58, bpm: 80, wave: 'sine', cut: 1800, bright: 0.55 },
};
const PENTA = [0, 2, 4, 7, 9];
const CHORDS = [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]];   // I vi IV V
const hz = m => 440 * Math.pow(2, (m - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.on = { music: true, sfx: true, voice: true };
    this.buffers = new Map();
    this.loading = new Map();
    this.queue = [];
    this.current = null;
    this.log = [];
    this.musicWorld = null;
    this._timer = 0;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend().catch(() => {});
      else this.resume();
    });
  }

  get running() { return !!this.ctx && this.ctx.state === 'running'; }

  // Call synchronously inside pointerup / click. Safe to call on every tap.
  unlock() {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
    } catch (e) { /* not supported */ }
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC({ latencyHint: 'interactive' });
      this._graph();
      this.ctx.onstatechange = () => this._log('state', [this.ctx.state]);
    }
    this.resume();
    // A silent tick inside the gesture fully wakes older WebKit.
    const b = this.ctx.createBuffer(1, 1, this.ctx.sampleRate), s = this.ctx.createBufferSource();
    s.buffer = b; s.connect(this.ctx.destination); s.start();
  }

  resume() {
    if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume().catch(() => {});
  }

  _graph() {
    const c = this.ctx;
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -8; this.limiter.knee.value = 4; this.limiter.ratio.value = 16;
    this.limiter.attack.value = 0.003; this.limiter.release.value = 0.2;
    this.master = c.createGain(); this.master.gain.value = 0.9;
    this.master.connect(this.limiter); this.limiter.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.on.music ? 0.26 : 0;
    this.duck = c.createGain(); this.duck.gain.value = 1;
    this.musicTone = c.createBiquadFilter(); this.musicTone.type = 'lowpass'; this.musicTone.frequency.value = 1600; this.musicTone.Q.value = 0.4;
    this.musicTone.connect(this.musicBus); this.musicBus.connect(this.duck); this.duck.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.on.sfx ? 0.7 : 0; this.sfxBus.connect(this.master);
    this.voiceBus = c.createGain(); this.voiceBus.gain.value = this.on.voice ? 1 : 0; this.voiceBus.connect(this.master);
    const n = c.sampleRate * 0.4, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  }

  set(kind, value) {
    this.on[kind] = value;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (kind === 'music') this.musicBus.gain.setTargetAtTime(value ? 0.26 : 0, t, 0.08);
    if (kind === 'sfx') this.sfxBus.gain.setTargetAtTime(value ? 0.7 : 0, t, 0.03);
    if (kind === 'voice') { this.voiceBus.gain.setTargetAtTime(value ? 1 : 0, t, 0.03); if (!value) this.clearVoice(); }
  }

  /* ---------------------------------------------------------------- voice */

  has(key) { return key in CLIPS; }

  // Fetch and decode clips, a few at a time. Keys first in the list load first.
  preload(keys) {
    const todo = keys.filter(k => this.has(k) && !this.buffers.has(k) && !this.loading.has(k));
    let i = 0;
    const next = () => {
      if (i >= todo.length) return Promise.resolve();
      const k = todo[i++];
      return this.load(k).then(next, next);
    };
    return Promise.all([next(), next(), next(), next()]);
  }

  load(key) {
    if (this.buffers.has(key)) return Promise.resolve(this.buffers.get(key));
    if (this.loading.has(key)) return this.loading.get(key);
    if (!this.ctx || !this.has(key)) return Promise.reject(new Error('no ' + key));
    const p = fetch(VOICE_DIR + key + '.mp3')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(a => new Promise((res, rej) => this.ctx.decodeAudioData(a, res, rej)))
      .then(b => { this.buffers.set(key, b); this.loading.delete(key); return b; },
        e => { this.loading.delete(key); this._log('loadfail', [key]); throw e; });
    this.loading.set(key, p);
    return p;
  }

  // kind: 'label' (a free pop's name, may be replaced by a newer label that has not
  // started yet), 'keep' (a name that must be heard), 'prompt', 'praise'.
  say(keys, kind = 'keep') {
    if (!this.on.voice || !this.ctx) return;
    keys = keys.filter(k => this.has(k));
    if (!keys.length) return;
    // A newer free-pop name replaces one that has not started; a repeated prompt
    // replaces the same prompt still waiting. Names that must be heard and praise stay.
    if (kind === 'label' || kind === 'prompt') this.drop(kind);
    const u = { keys, kind, id: (this._uid = (this._uid || 0) + 1) };
    this.queue.push(u);
    this._log('enqueue', keys, kind);
    for (const k of keys) this.load(k).catch(() => {});
    if (!this.current) this._next();
  }

  drop(kind) {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].kind === kind) { this._log('superseded', this.queue[i].keys, kind); this.queue.splice(i, 1); }
    }
  }

  clearVoice() {
    for (const u of this.queue) this._log('cleared', u.keys);
    this.queue.length = 0;
    const cur = this.current;
    this.current = null;
    if (cur && cur.src) { try { cur.src.stop(); } catch (e) { /* ended */ } }
    this._unduck();
  }

  busy() { return !!this.current || this.queue.length > 0; }

  _next() {
    const u = this.queue.shift();
    if (!u) { this.current = null; this._unduck(); return; }
    this.current = u;
    this._duck();
    this._play(u, 0);
  }

  _play(u, i) {
    if (i >= u.keys.length) { this._log('end', u.keys, u.kind); this.current = null; setTimeout(() => { if (!this.current) this._next(); }, 70); return; }
    const key = u.keys[i];
    const go = buf => {
      if (this.current !== u) return;
      const s = this.ctx.createBufferSource();
      s.buffer = buf; s.connect(this.voiceBus);
      u.src = s;
      s.onended = () => { if (this.current === u) this._play(u, i + 1); };
      this._log('start', [key], u.kind);
      s.start(this.ctx.currentTime + (i ? 0.06 : 0.01));
    };
    const b = this.buffers.get(key);
    if (b) return go(b);
    let done = false;
    const timeout = setTimeout(() => { if (!done) { done = true; this._log('missing', [key]); this._play(u, i + 1); } }, 1500);
    this.load(key).then(buf => { if (done) return; done = true; clearTimeout(timeout); go(buf); },
      () => { if (done) return; done = true; clearTimeout(timeout); this._log('missing', [key]); this._play(u, i + 1); });
  }

  _duck() { if (this.ctx) this.duck.gain.setTargetAtTime(0.32, this.ctx.currentTime, 0.04); }
  _unduck() { if (this.ctx) this.duck.gain.setTargetAtTime(1, this.ctx.currentTime + 0.15, 0.3); }

  _log(ev, keys, kind) {
    this.log.push({ t: Math.round(performance.now()), ev, keys: keys.join('+'), kind });
    if (this.log.length > 400) this.log.splice(0, 100);
  }

  /* ---------------------------------------------------------------- effects */

  // A soft, rounded latex pop: a short breath of filtered noise and a falling sine,
  // varied by up to two semitones and panned to where the balloon was.
  pop(pan = 0, big = false) {
    if (!this.running || !this.on.sfx) return;
    const c = this.ctx, t = c.currentTime + 0.005, semi = Math.random() * 4 - 2, f0 = (big ? 300 : 430) * Math.pow(2, semi / 12);
    const out = c.createGain(); out.gain.value = 1;
    let dest = this.sfxBus;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-0.7, Math.min(0.7, pan)); out.connect(p); p.connect(dest); }
    else out.connect(dest);
    const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 2200;
    o.frequency.setValueAtTime(f0 * 1.7, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.05); o.frequency.exponentialRampToValueAtTime(f0 * 0.7, t + 0.16);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2);
    const n = c.createBufferSource(), bp = c.createBiquadFilter(), ng = c.createGain();
    n.buffer = this.noise; bp.type = 'bandpass'; bp.frequency.value = 1500 * Math.pow(2, semi / 12); bp.Q.value = 0.9;
    ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.32, t + 0.002); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    n.connect(bp); bp.connect(ng); ng.connect(out); n.start(t, Math.random() * 0.3, 0.06);
  }

  // A small rising chime for a found item, a fuller one for a sticker.
  chime(kind = 'found') {
    if (!this.running || !this.on.sfx) return;
    const c = this.ctx, base = kind === 'sticker' ? 72 : 76, steps = kind === 'sticker' ? [0, 4, 7, 12] : [0, 7];
    steps.forEach((s, i) => {
      const t = c.currentTime + 0.02 + i * 0.085, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o2.type = 'sine';
      o.frequency.value = hz(base + s); o2.frequency.value = hz(base + s + 12) * 1.002;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      const g2 = c.createGain(); g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.sfxBus);
      o.start(t); o2.start(t); o.stop(t + 0.75); o2.stop(t + 0.75);
    });
  }

  tap() {
    if (!this.running || !this.on.sfx) return;
    const c = this.ctx, t = c.currentTime + 0.005, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(480, t + 0.06);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + 0.1);
  }

  /* ---------------------------------------------------------------- music */

  music(world) {
    if (!this.ctx) return;
    if (this.musicWorld === world && this._timer) return;
    this.musicWorld = world;
    const m = MUSIC[world] || MUSIC.home;
    this.m = m;
    this.musicTone.frequency.setTargetAtTime(m.cut, this.ctx.currentTime, 0.3);
    this.beat = 0;
    this.nextT = this.ctx.currentTime + 0.12;
    this.mel = 2;
    if (!this._timer) this._timer = setInterval(() => this._schedule(), 50);
  }

  stopMusic() {
    clearInterval(this._timer); this._timer = 0; this.musicWorld = null;
  }

  _schedule() {
    if (!this.running || !this.on.music) { if (this.ctx) this.nextT = this.ctx.currentTime + 0.1; return; }
    const c = this.ctx, m = this.m, spb = 60 / m.bpm;
    if (this.nextT < c.currentTime) this.nextT = c.currentTime + 0.05;
    while (this.nextT < c.currentTime + 0.25) {
      const t = this.nextT, beat = this.beat, bar = Math.floor(beat / 4), chord = CHORDS[Math.floor(bar / 2) % 4];
      if (beat % 4 === 0) this._pad(t, m, chord, spb * 4);
      // arpeggio: a chord tone on each beat, softer off the bar line
      const a = chord[[0, 1, 2, 1][beat % 4]];
      this._note(t, m.root + 12 + a, 0.12 * (beat % 4 === 0 ? 1 : 0.7), m.wave, spb * 1.6);
      // a sparse melody on the pentatonic, walking by small steps
      if (Math.random() < m.bright) {
        this.mel = Math.max(0, Math.min(9, this.mel + [-2, -1, -1, 1, 1, 2, 0][(Math.random() * 7) | 0]));
        const deg = PENTA[this.mel % 5] + 12 * Math.floor(this.mel / 5);
        this._note(t + spb * 0.5, m.root + 24 + deg, 0.07, 'sine', spb * 1.2);
      }
      this.beat++;
      this.nextT += spb;
    }
  }

  _note(t, midi, vol, wave, len) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = wave; o.frequency.value = hz(midi);
    const v = wave === 'square' ? vol * 0.35 : wave === 'triangle' ? vol * 0.8 : vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(this.musicTone); o.start(t); o.stop(t + len + 0.05);
  }

  _pad(t, m, chord, len) {
    const c = this.ctx, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + len * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + len * 1.05);
    g.connect(this.musicTone);
    for (const n of [chord[0], chord[2]]) {
      const o = c.createOscillator();
      o.type = 'sine'; o.frequency.value = hz(m.root + n); o.detune.value = n === chord[0] ? -4 : 4;
      o.connect(g); o.start(t); o.stop(t + len * 1.1);
    }
  }
}
