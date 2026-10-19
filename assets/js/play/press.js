// Keyboard switch: hold to press, see actuation; then a 10-second tapping challenge.
export function start(api, { session, util, result, challenge }) {
  const P = api.mdl.params, S = session(api, 'press', { ex: 0, onExit: () => { P.press = 0; } });
  let held = false, count = 0, was = false, game = false, tEnd = 0;
  const w = util.el('div', 'rng glass'); w.innerHTML = `<div class="acts" style="margin:0;justify-content:center"><button class="btn accent" type="button" data-a="key" style="min-width:140px">Hold to press</button><button class="btn ghost" type="button" data-a="go">10-second challenge</button></div>`;
  S.hud.append(w); const kb = w.querySelector('[data-a=key]');
  const dn = e => { e.preventDefault(); held = true; }, up = () => { held = false; };
  S.on(kb, 'pointerdown', dn); S.on(window, 'pointerup', up); S.on(window, 'pointercancel', up);
  S.on(api.canvas, 'pointerdown', e => { if (api.pick(e)) { api.controls.enabled = false; held = true; } }); S.on(window, 'pointerup', () => { api.controls.enabled = true; });
  S.on(document, 'keydown', e => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); held = true; } }); S.on(document, 'keyup', e => { if (e.code === 'Space') held = false; });
  S.prompt('Hold the key (or Space)', 'It actuates halfway down, about 2 mm of 4 mm travel');
  S.on(w.querySelector('[data-a=go]'), 'click', () => { game = true; count = 0; tEnd = performance.now() + 10000; S.start(); S.score('<b>0</b> presses'); S.prompt('Tap as fast as you can!', 'Each full actuation counts'); });
  const tick = dt => {
    const tgt = held ? 1 : 0; P.press += (tgt - P.press) * Math.min(1, dt * (held ? 26 : 18));
    const on = api.mdl.actuated(); if (on && !was) { count++; if (!game) S.score(`<b>${count}</b> actuations`); else S.score(`<b>${count}</b> presses`); }
    was = on; kb.textContent = on ? 'Actuated ●' : 'Hold to press';
    if (game) { const left = tEnd - performance.now(); S.q('.tm').textContent = (Math.max(0, left) / 1000).toFixed(1) + ' s';
      if (left <= 0) { game = false; S.stopTimer(); held = false; result(api, S, 'press', { v: count, s: 10, unit: 'presses', headline: `I actuated a key switch ${count} times in 10 seconds`, sub: 'Mechanical switch challenge', challenge }); } }
  };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  S.press = { count: () => count, hold: v => held = v };
  return S;
}
