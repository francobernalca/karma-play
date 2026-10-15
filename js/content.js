// What the balloons carry, and the order a child meets it in.
// Sequencing is by what this child has seen (stored on the device only): start small
// (A-H, 1-4, five animals) and widen when most of the current set is familiar.

import { COLORS, COLOR_NAMES, ANIMALS, SHAPES } from './art.js';

export const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
export const NUMBER_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function makeItem(kind, value, colorName) {
  const key = { letter: 'L', number: 'N', animal: 'A', color: 'C', shape: 'S' }[kind] + value;
  const it = { kind, value: String(value), key };
  if (kind === 'letter' || kind === 'number') {
    it.colorName = colorName || COLOR_NAMES[(Math.random() * 6) | 0];
    it.ink = COLORS[it.colorName].ink;
  }
  if (kind === 'color') it.colorName = value;
  return it;
}
export const GOLD_ITEM = { kind: 'gold', value: 'gold', key: 'gold' };

// Words a screen reader hears for a pop, and the parent corner lists.
export function itemName(it) {
  if (it.kind === 'number') return NUMBER_WORDS[+it.value];
  if (it.kind === 'color') return `${it.value} balloon`;
  if (it.kind === 'gold') return 'golden balloon';
  return it.value;
}
export function findText(it) {
  if (it.kind === 'letter') return `Find the letter ${it.value}!`;
  if (it.kind === 'number') return `Find number ${NUMBER_WORDS[+it.value]}!`;
  if (it.kind === 'color') return `Find a ${it.value} balloon!`;
  return `Find the ${it.value}!`;
}

// Stages widen the set. Colours arrive far apart first (red, blue, yellow), neighbours later.
const STAGES = [
  { letters: 8, numbers: 4, animals: 5, colors: [], shapes: [] },
  { letters: 14, numbers: 6, animals: 10, colors: ['red', 'blue', 'yellow'], shapes: ['circle', 'square'] },
  { letters: 20, numbers: 8, animals: 15, colors: ['red', 'blue', 'yellow', 'green'], shapes: ['circle', 'square', 'triangle', 'star'] },
  { letters: 26, numbers: 10, animals: 20, colors: COLOR_NAMES, shapes: SHAPES },
];

export function poolFor(stage) {
  const s = STAGES[Math.min(stage, STAGES.length - 1)];
  const out = [];
  for (const l of LETTERS.slice(0, s.letters)) out.push(['letter', l]);
  for (let n = 1; n <= s.numbers; n++) out.push(['number', n]);
  for (const a of ANIMALS.slice(0, s.animals)) out.push(['animal', a]);
  for (const c of s.colors) out.push(['color', c]);
  for (const sh of s.shapes) out.push(['shape', sh]);
  return out;
}
export const STAGE_COUNT = STAGES.length;

// Widen when at least 70% of the current set has been seen twice.
export function stageFor(seen) {
  let st = 0;
  while (st < STAGES.length - 1) {
    const pool = poolFor(st);
    const known = pool.filter(([k, v]) => (seen[makeItem(k, v).key] || 0) >= 2).length;
    if (known / pool.length < 0.7) break;
    st++;
  }
  return st;
}

// Every item there is, for the parent corner.
export function allItems() {
  return {
    letters: LETTERS.map(l => makeItem('letter', l, 'red')),
    numbers: Array.from({ length: 10 }, (_, i) => makeItem('number', i + 1, 'blue')),
    animals: ANIMALS.map(a => makeItem('animal', a)),
    colors: COLOR_NAMES.map(c => makeItem('color', c)),
    shapes: SHAPES.map(s => makeItem('shape', s)),
  };
}
