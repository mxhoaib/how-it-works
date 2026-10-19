// SSD: write files and watch the controller spread writes evenly across flash cells (wear levelling).
export function start(api, { session, util }) {
  const M = api.mdl, P = M.params, S = session(api, 'write', { ex: .25, onExit: () => { P.write = null; P.writes.fill(0); } });
  P.writes.fill(0); let n = 0, queue = 0;
  const w = util.el('div', 'rng glass'); w.innerHTML = `<div class="acts" style="margin:0;justify-content:center"><button class="btn accent" type="button" data-a="photo">Save a photo</button><button class="btn ghost" type="button" data-a="movie">Copy a movie</button></div>`;
  S.hud.append(w); S.q('.tm').textContent = '0 MB';
  S.on(w.querySelector('[data-a=photo]'), 'click', () => queue += 4); S.on(w.querySelector('[data-a=movie]'), 'click', () => queue += 160);
  S.prompt('Write some data', 'Each block lights up as it is written; the least-worn block is always chosen next');
  let acc = 0; const tick = dt => { P.write = queue > 0; acc += dt; while (queue > 0 && acc > .012) { acc -= .012; M.write(); queue--; n++; } if (!queue) acc = 0;
    const mx = Math.max(...P.writes), mn = Math.min(...P.writes);
    S.q('.tm').textContent = n * 4 + ' MB'; S.score(`Block wear <b>${mn}–${mx}</b> writes`); };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  S.write = { add: q => queue += q, count: () => n }; return S;
}
