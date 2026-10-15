// Balloon physics and pop prototype (lab only, never published).
// ?world=dino  ?load=1 keeps 7 balloons up and pops one every 350 ms for frame timing.
import { WORLDS } from '../js/art.js';
import { mountScene } from '../js/scene.js';
import { Stage, balloonColorFor } from '../js/stage.js';
import { poolFor, makeItem } from '../js/content.js';

const q = new URLSearchParams(location.search);
const world = q.get('world') || 'dino';
if (!q.has('noscene')) mountScene(document.getElementById('scene'), world);
const stage = new Stage(document.getElementById('stage'), {});
stage.setWorld({ string: WORLDS[world].string });
const pool = poolFor(3);
const pick = () => { const [k, v] = pool[(Math.random() * pool.length) | 0]; return makeItem(k, v); };
const out = document.getElementById('stats');
const load = q.has('load');

(async () => {
  await stage.prepare();
  stage.start();
  let lastSpawn = 0, lastPop = 0;
  const max = load ? 7 : stage.maxBalloons;
  function tick(now) {
    requestAnimationFrame(tick);
    if (stage.count() < max && now - lastSpawn > (load ? 120 : 1200)) {
      const it = pick();
      stage.spawn({ item: it, color: balloonColorFor(it, it.colorName) });
      lastSpawn = now;
    }
    if (load && !q.has('nopop') && now - lastPop > 350) {
      const live = stage.balloons.filter(b => b.state === 'rise' && b.y < stage.h * 0.9);
      if (live.length) stage.hit(live[(Math.random() * live.length) | 0], true);
      lastPop = now;
    }
  }
  requestAnimationFrame(tick);
  setInterval(() => {
    const s = stage.frameStats();
    out.textContent = `work p50 ${s.workP50.toFixed(2)} p95 ${s.workP95.toFixed(2)} ms | gap p95 ${s.gapP95.toFixed(1)} | q${s.quality} k${s.k} | ${stage.balloons.length} balloons ${stage.shards.length} shards`;
    document.body.dataset.stats = JSON.stringify({ ...s, balloons: stage.balloons.length, shards: stage.shards.length, puffs: stage.puffs.length });
  }, 500);
  document.body.dataset.ready = '1';
})().catch(e => { document.body.dataset.ready = 'error'; console.error(e); });
window.__stage = stage;
