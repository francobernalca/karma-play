// Contact sheet for every illustration (lab only, never published).
import * as A from '../js/art.js';
import { mountScene, layoutScene } from '../js/scene.js';

const lab = document.getElementById('lab');
const sec = (id, title) => {
  const s = document.createElement('section');
  s.id = id;
  s.innerHTML = `<h2>${title}</h2><div class="row"></div>`;
  lab.append(s);
  return s.querySelector('.row');
};
document.body.insertAdjacentHTML('afterbegin', A.iconSprite());
const worlds = ['home', ...A.WORLD_IDS];

function scenes(id, title, w, h, k) {
  const row = sec(id, title);
  for (const wid of worlds) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = `<div class="frame"><div class="inner"><div class="scene"></div></div></div><span>${wid} ${w}x${h}</span>`;
    const f = cell.querySelector('.frame'), inner = cell.querySelector('.inner');
    f.style.width = w * k + 'px'; f.style.height = h * k + 'px';
    inner.style.width = w + 'px'; inner.style.height = h + 'px'; inner.style.transform = `scale(${k})`;
    row.append(cell);
    const sc = cell.querySelector('.scene');
    mountScene(sc, wid);
  }
}
scenes('scenes-phone', 'World scenes, phone portrait 390x844 (shown at 50%)', 390, 844, 0.5);
scenes('scenes-desk', 'World scenes, desktop 1440x900 (shown at 26%)', 1440, 900, 0.26);
// getBoundingClientRect sees the scaled box; anchors need the unscaled one.
for (const sc of document.querySelectorAll('.scene')) {
  const inner = sc.parentElement, k = parseFloat(inner.style.transform.slice(6));
  const real = sc.getBoundingClientRect.bind(sc);
  sc.getBoundingClientRect = () => { const r = real(); return { width: r.width / k, height: r.height / k }; };
  layoutScene(sc);
}

{
  const row = sec('tiles', 'World picker tiles');
  for (const w of A.WORLD_IDS) row.insertAdjacentHTML('beforeend', `<div class="tile">${A.tileSVG(w)}<b>${A.wordSVG(A.WORLDS[w].name)}</b></div>`);
}
{
  const row = sec('animals', 'Animals, large');
  for (const a of A.ANIMALS) row.insertAdjacentHTML('beforeend', `<div class="cell">${A.animalSVG(a, 'class="art"')}<span>${a}</span></div>`);
}

// Balloons drawn with the real canvas routines at real CSS size.
const DPR = 2, R = 62;
const gloss = A.makeGloss(R, DPR);
function balloonCanvas(color, item, ink, img, strColor = 'rgba(52,56,80,.42)') {
  const W = A.SPRITE.w * R, H = A.SPRITE.h * R + 1.4 * R;
  const c = document.createElement('canvas');
  c.className = 'bal'; c.width = W * DPR; c.height = H * DPR; c.style.width = W + 'px'; c.style.height = H + 'px';
  const x = c.getContext('2d');
  x.scale(DPR, DPR);
  const ox = W / 2, oy = A.SPRITE.oy * R;
  x.strokeStyle = strColor; x.lineWidth = 1.6; x.lineCap = 'round';
  x.beginPath(); x.moveTo(ox, oy + 1.26 * R); x.bezierCurveTo(ox - 10, oy + 1.7 * R, ox + 12, oy + 2.1 * R, ox - 4, oy + 2.5 * R); x.stroke();
  const sw = A.SPRITE.w * R, sh = A.SPRITE.h * R;
  x.drawImage(A.makeBalloonBody(color, R, DPR), ox - sw / 2, 0, sw, sh);
  if (item) x.drawImage(A.makeItemSprite(item, R, DPR, ink, img), ox - sw / 2, 0, sw, sh);
  x.drawImage(gloss, ox - sw / 2, 0, sw, sh);
  return c;
}
const cell = (row, el, label) => { const d = document.createElement('div'); d.className = 'cell'; d.append(el); d.insertAdjacentHTML('beforeend', `<span>${label}</span>`); row.append(d); };

(async () => {
  await document.fonts.ready;
  const imgs = {};
  await Promise.all(A.ANIMALS.map(async a => { imgs[a] = await A.svgImage(A.animalSVG(a, 'width="240" height="240"')); }));
  await Promise.all(A.SHAPES.map(async s => { imgs['s:' + s] = await A.svgImage(A.shapeSVG(s, A.SHAPE_INK, 'width="200" height="200"')); }));
  let row = sec('animal-balloons', 'Animals on balloons (R=62 CSS px, 124 px wide)');
  for (const a of A.ANIMALS) cell(row, balloonCanvas(A.PASTELS[A.ANIMAL_BALLOON[a]], { kind: 'animal', value: a }, null, imgs[a]), a);
  row = sec('letters', 'Letters on balloons, every colour');
  A.COLOR_NAMES.forEach(cn => {
    const C = A.COLORS[cn];
    cell(row, balloonCanvas(C.fill, { kind: 'letter', value: 'B' }, C.ink), `${cn} ${A.contrast(C.fill, C.ink).toFixed(2)}:1`);
  });
  [...'ACDEFGHIJKLMNOPQRSTUVWXYZ'].forEach((ch, i) => {
    const C = A.COLORS[A.COLOR_NAMES[i % 6]];
    cell(row, balloonCanvas(C.fill, { kind: 'letter', value: ch }, C.ink), ch);
  });
  row = sec('numbers', 'Numbers with subitizing dots, shapes, colour balloons, golden sticker balloon');
  for (let n = 1; n <= 10; n++) { const C = A.COLORS[A.COLOR_NAMES[(n + 2) % 6]]; cell(row, balloonCanvas(C.fill, { kind: 'number', value: n }, C.ink), String(n)); }
  A.SHAPES.forEach((s, i) => cell(row, balloonCanvas(A.PASTELS[Object.keys(A.PASTELS)[i]], { kind: 'shape', value: s }, null, imgs['s:' + s]), s));
  A.COLOR_NAMES.forEach(cn => cell(row, balloonCanvas(A.COLORS[cn].fill, null), cn));
  cell(row, balloonCanvas(A.GOLD, { kind: 'gold' }), 'golden');

  row = sec('glyphs', 'The Karma Play hand: ball-and-stick capitals and numerals');
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.glyphSVG('ABCDEFGHIJKLM').replace('<svg', '<svg width="1100"')}</div>`);
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.glyphSVG('NOPQRSTUVWXYZ').replace('<svg', '<svg width="1150"')}</div>`);
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.glyphSVG('0123456789').replace('<svg', '<svg width="760"')}</div>`);
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.glyphSVG('abcdefghijklm').replace('<svg', '<svg width="900"')}</div>`);
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.glyphSVG('nopqrstuvwxyz').replace('<svg', '<svg width="900"')}</div>`);
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.glyphSVG('lion zebra purple giraffe').replace('<svg', '<svg width="1100"')}</div>`);

  row = sec('ui', 'Wordmark, icons, app icon, stickers');
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.wordmarkSVG().replace('<svg', '<svg class="wm"')}<span>wordmark on paper</span></div>`);
  row.insertAdjacentHTML('beforeend', `<div class="cell"><div class="skyframe">${A.wordmarkSVG().replace('<svg', '<svg class="wm"')}</div><span>wordmark on home sky</span></div>`);
  const icons = document.createElement('div'); icons.className = 'row';
  for (const k of Object.keys(A.ICONS)) icons.insertAdjacentHTML('beforeend', `<div class="cell"><div class="btn">${A.icon(k)}</div><span>${k}</span></div>`);
  cell(row, icons, 'UI icons in 56 px buttons');
  row.insertAdjacentHTML('beforeend', `<div class="cell">${A.appIconSVG({ size: 180 })}<span>app icon 180</span></div>`);
  row.insertAdjacentHTML('beforeend', `<div class="cell"><div class="mask">${A.appIconSVG({ maskable: true, size: 192 })}</div><span>maskable 192 (circle mask)</span></div>`);
  const st = document.createElement('div'); st.className = 'row';
  for (const id of A.STICKERS) st.insertAdjacentHTML('beforeend', `<div class="cell">${A.stickerSVG(id, 'width="96" height="96"')}<span>${A.stickerLabel(id)}</span></div>`);
  cell(row, st, 'stickers');
  document.body.dataset.ready = '1';
})().catch(e => { document.body.dataset.ready = 'error'; console.error(e); });
