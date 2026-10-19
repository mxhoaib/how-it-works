// Generic "open it layer by layer": each step lifts the next part out and explains it.
export function start(api, { session, util }) {
  const ord = (api.mdl.peel || api.prep.list.map(p => p.id)).filter(id => api.prep.byId[id]), D = api.D;
  const S = session(api, 'peel', { ex: 0 }); S.q('.tm').textContent = '⇣';
  api.skip = new Set(ord); let k = 0; const cur = {}; ord.forEach(id => cur[id] = 0);
  const w = util.el('div', 'rng glass'); w.innerHTML = `<div class="acts" style="margin:0;justify-content:center"><button class="btn ghost" type="button" data-a="prev">Back</button><button class="btn accent" type="button" data-a="next">Remove next layer</button></div>`;
  S.hud.append(w); const nb = w.querySelector('[data-a=next]');
  const show = () => {
    const id = ord[Math.max(0, k - 1)], p = D.parts[id] || {};
    S.score(`<b>${k}</b> / ${ord.length}`); nb.textContent = k >= ord.length ? 'Put it back together' : 'Remove next layer';
    if (k === 0) S.prompt('Closed up', 'Press “Remove next layer” to start'); else S.prompt(p.name || id, k >= ord.length ? 'Fully opened' : (p.desc || '').split('. ')[0]);
    api.state.sel = k ? id : null; api.applyMaterials();
  };
  S.on(nb, 'click', () => { k = k >= ord.length ? 0 : k + 1; show(); });
  S.on(w.querySelector('[data-a=prev]'), 'click', () => { k = Math.max(0, k - 1); show(); });
  S.on(document, 'keydown', e => { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nb.click(); } if (e.key === 'ArrowLeft') { k = Math.max(0, k - 1); show(); } });
  const tick = dt => { ord.forEach((id, i) => { const t = i < k ? 1.5 : 0; cur[id] += (t - cur[id]) * Math.min(1, dt * 6); const p = api.prep.byId[id]; p.obj.position.copy(p.home).addScaledVector(p.dir, cur[id]); }); };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  S.peel = { next: () => nb.click(), step: () => k, total: ord.length }; show();
  return S;
}
