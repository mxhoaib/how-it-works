// Cat play mode: tap to pet (purr + hearts) and a walk button.
export function start(api, { session, util }) {
  const P = api.mdl.params, S = session(api, 'pet', { ex: 0, onExit: () => { P.walk = false; P.purr = 0; } });
  S.q('.tm').textContent = '♥'; let pets = 0, down = null;
  S.prompt('Tap the cat to pet it', 'Then try the walk button'); S.score('<b>0</b> pets');
  const w = util.el('div', 'rng glass'); w.style.width = 'auto'; w.innerHTML = `<div class="acts" style="margin:0;justify-content:center"><button class="btn accent" type="button" data-a="walk">Walk</button><button class="btn ghost" type="button" data-a="pet">Pet</button></div>`;
  S.hud.append(w);
  const heart = (x, y) => { for (let i = 0; i < 3; i++) { const h = util.el('div', 'heart', '❤️'); h.style.left = (x - 13 + (Math.random() - .5) * 40) + 'px'; h.style.top = (y - 20 - i * 10) + 'px'; h.style.animationDelay = i * .12 + 's'; S.hud.append(h); setTimeout(() => h.remove(), 1700); } };
  const pet = (x, y) => { api.mdl.pet(); pets++; S.score(`<b>${pets}</b> pets`); S.prompt(pets > 5 ? 'Maximum purr' : 'Purrrr…', 'Cats purr by twitching the muscles of the voice box'); heart(x, y); };
  S.on(api.canvas, 'pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  S.on(api.canvas, 'pointerup', e => { if (!down) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (d > 8) return; if (api.pick(e)) { const r = api.stage.getBoundingClientRect(); pet(e.clientX - r.left, e.clientY - r.top); } });
  const wb = w.querySelector('[data-a=walk]');
  S.on(wb, 'click', () => { P.walk = !P.walk; wb.textContent = P.walk ? 'Stop' : 'Walk'; S.prompt(P.walk ? 'Out for a stroll' : 'Sit…', P.walk ? 'Diagonal legs move together in a walk' : ''); });
  S.on(w.querySelector('[data-a=pet]'), 'click', () => pet(api.stage.clientWidth / 2, api.stage.clientHeight / 2));
  return S;
}
