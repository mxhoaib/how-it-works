// Car engine run mode: RPM slider, pistons and sparks stay in sync through the model's crank angle.
export function start(api, { session, util }) {
  const P = api.mdl.params, old = P.rpm, S = session(api, 'run', { ex: 0, onExit: () => { P.rpm = old; } });
  S.q('.tm').textContent = '—'; P.rpm = 240;
  const w = util.el('div', 'rng glass'); w.innerHTML = `<label>Crank speed <span class="v">240</span> rpm (slowed for viewing)<input type="range" min="30" max="900" step="10" value="240" aria-label="Engine RPM"></label><div class="acts"><button class="btn" type="button" data-r="60">Crawl</button><button class="btn" type="button" data-r="240">Slow</button><button class="btn" type="button" data-r="800">Idle speed</button></div>`;
  S.hud.append(w); const r = w.querySelector('input'), v = w.querySelector('.v');
  const set = x => { P.rpm = +x; r.value = x; v.textContent = x; };
  S.on(r, 'input', () => set(r.value)); w.querySelectorAll('[data-r]').forEach(b => S.on(b, 'click', () => set(b.dataset.r)));
  S.score('Firing order <b>1-3-4-2</b>');
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  function tick() { S.prompt(`Cylinder 1: ${api.mdl.stroke()}`, 'Power → exhaust → intake → compression'); }
  return S;
}
