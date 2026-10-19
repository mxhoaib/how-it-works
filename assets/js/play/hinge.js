// Laptop: open and close the lid on its hinge, then see inside.
export function start(api, { session, util }) {
  const P = api.mdl.params, S = session(api, 'hinge', { ex: 0, onExit: () => { P.lid = 1.25; } }); S.q('.tm').textContent = '110°';
  const w = util.el('div', 'rng glass'); w.innerHTML = `<label>Lid angle <span class="v">110°</span><input type="range" min="0" max="180" value="110" aria-label="Lid angle"></label><div class="acts"><button class="btn ghost" type="button" data-a="close">Close</button><button class="btn ghost" type="button" data-a="open">Open</button><button class="btn accent" type="button" data-a="inside">Look inside</button></div>`;
  S.hud.append(w); const r = w.querySelector('input'); let tgt = 110, ex = 0, exT = 0;
  const set = v => { tgt = v; r.value = v; };
  S.on(r, 'input', () => set(+r.value)); S.on(w.querySelector('[data-a=close]'), 'click', () => set(0)); S.on(w.querySelector('[data-a=open]'), 'click', () => set(110));
  const ib = w.querySelector('[data-a=inside]'); S.on(ib, 'click', () => { exT = exT ? 0 : .7; ib.textContent = exT ? 'Close it up' : 'Look inside'; });
  S.prompt('Drag to open the lid', 'The hinge holds the screen at any angle with friction');
  let ang = 110; const tick = dt => { ang += (tgt - ang) * Math.min(1, dt * 5); P.lid = Math.PI - ang * Math.PI / 180; w.querySelector('.v').textContent = Math.round(ang) + '°'; S.q('.tm').textContent = Math.round(ang) + '°';
    if (Math.abs(ex - exT) > .002) { ex += (exT - ex) * Math.min(1, dt * 4); api.setEx(ex); }
    S.score(ang < 5 ? 'Closed · <b>asleep</b>' : 'Open · <b>awake</b>'); };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  S.hinge = { set, angle: () => ang }; return S;
}
