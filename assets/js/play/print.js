// 3D printer play mode: animated layer-by-layer print.
export function start(api, { session, util, result }) {
  const P = api.mdl.params, N = api.mdl.layerCount, S = session(api, 'print', { ex: 0, onExit: () => { P.print = null; } });
  let speed = 1, running = true; P.print = 0; S.start();
  const w = util.el('div', 'rng glass'); w.innerHTML = `<label>Print speed <span class="v">1×</span><input type="range" min="1" max="8" value="1" aria-label="Print speed"></label><div class="acts"><button class="btn" type="button" data-a="pause">Pause</button><button class="btn ghost" type="button" data-a="restart">Restart</button></div>`;
  S.hud.append(w); const r = w.querySelector('input');
  S.on(r, 'input', () => { speed = +r.value; w.querySelector('.v').textContent = speed + '×'; });
  const pb = w.querySelector('[data-a=pause]'); S.on(pb, 'click', () => { running = !running; pb.textContent = running ? 'Pause' : 'Resume'; });
  S.on(w.querySelector('[data-a=restart]'), 'click', () => { P.print = 0; S.start(); running = true; pb.textContent = 'Pause'; });
  const tick = dt => {
    if (!running || P.print >= 1) return; P.print = Math.min(1, P.print + dt * speed / 40);
    const k = Math.min(N, Math.floor(P.print * N) + 1); S.score(`Layer <b>${k}</b> / ${N}`); S.prompt(`${Math.round(P.print * 100)}% printed`, 'Nozzle traces each layer, then the gantry steps up');
    if (P.print >= 1) { S.prompt('Print complete', 'Lift it off the bed'); S.stopTimer(); }
  };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  return S;
}
