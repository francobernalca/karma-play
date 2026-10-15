// Mounts a world scene (sky, three ridges, living details) into a container and keeps
// anchored details glued to their ridge as the screen changes shape.
import { sceneHTML } from './art.js';

function applyPos(el) {
  const pos = el.dataset.pos;
  if (!pos) return;
  for (const decl of pos.split(';')) {
    const i = decl.indexOf(':');
    if (i > 0) el.style.setProperty(decl.slice(0, i).trim(), decl.slice(i + 1).trim());
  }
}

export function mountScene(host, worldId) {
  host.innerHTML = sceneHTML(worldId);
  host.dataset.world = worldId;
  const sky = host.querySelector('.sky');
  const stops = sky.dataset.sky.split(',');
  sky.style.background = `linear-gradient(180deg, ${stops[0]} 0%, ${stops[1]} 55%, ${stops[2]} 100%)`;
  for (const l of host.querySelectorAll('.layer')) l.style.height = `${(+l.dataset.h * 100).toFixed(1)}%`;
  for (const el of host.querySelectorAll('[data-pos]')) applyPos(el);
  for (const el of host.querySelectorAll('[data-dur]')) el.style.setProperty('--dur', `${el.dataset.dur}s`);
  layoutScene(host);
}

// A layer is an SVG with viewBox 2400x600 drawn with xMidYMax slice. Anchored details
// (volcano smoke, the car on the road, tower lights) map a viewBox point to the screen.
export function layoutScene(host) {
  const box = host.getBoundingClientRect();
  if (!box.width) return;
  const layers = {};
  for (const l of host.querySelectorAll('.layer')) {
    const h = box.height * +l.dataset.h;
    const s = Math.max(box.width / 2400, h / 600);
    layers[l.classList[1]] = { s, ox: (box.width - 2400 * s) / 2, oy: box.height - h + (h - 600 * s) };
  }
  for (const el of host.querySelectorAll('[data-anchor]')) {
    const [name, x, y] = el.dataset.anchor.split(',');
    const L = layers[name];
    if (!L) continue;
    el.style.left = `${(L.ox + +x * L.s).toFixed(1)}px`;
    el.style.top = `${(L.oy + +y * L.s).toFixed(1)}px`;
    el.style.setProperty('--s', L.s.toFixed(3));
  }
}
