// Graphics card: drag the workload; fans spin up and the chip glows. Numbers are illustrative.
export function start(api, { session, util }) {
  const P = api.mdl.params, S = session(api, 'load', { ex: .12, onExit: () => { P.load = .3; } });
  const w = util.el('div', 'rng glass'); w.innerHTML = `<label>Workload <span class="v">Idle</span><input type="range" min="0" max="100" value="5" aria-label="Workload"></label><div class="acts"><button class="btn ghost" type="button" data-a="idle">Desktop</button><button class="btn ghost" type="button" data-a="game">Game</button><button class="btn ghost" type="button" data-a="ai">AI training</button></div>`;
  S.hud.append(w); const r = w.querySelector('input'); let tgt = .05, temp = 35; S.q('.tm').textContent = '35 °C';
  const set = v => { tgt = v / 100; r.value = v; const n = v < 15 ? 'Idle' : v < 60 ? 'Gaming' : 'Full load'; w.querySelector('.v').textContent = `${n} · ${v}%`; };
  S.on(r, 'input', () => set(+r.value)); [['idle', 5], ['game', 55], ['ai', 100]].forEach(([a, v]) => S.on(w.querySelector(`[data-a=${a}]`), 'click', () => set(v)));
  S.prompt('Raise the workload', 'Thousands of small cores work on pixels or numbers in parallel'); set(5);
  const tick = dt => { P.load += (tgt - P.load) * Math.min(1, dt * 1.5); temp += ((35 + P.load * 45) - temp) * Math.min(1, dt * .8);
    S.q('.tm').textContent = `${Math.round(temp)} °C`; S.score(`Fans <b>${Math.round(600 + P.load * 2400)}</b> rpm · <b>${Math.round(20 + P.load * 330)}</b> W`); };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  S.load = { set }; return S;
}
