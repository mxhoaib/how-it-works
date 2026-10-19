// Phone water test: drops fall on the phone; the glass slides up a little to reveal the gaskets that stop them.
export function start(api, { session, util, result }) {
  const { THREE } = api, M = api.mdl, P = M.params, root = M.root;
  const S = session(api, 'water', { ex: 0, onExit: () => { P.water = false; drops.forEach(d => root.remove(d.m)); } }); S.q('.tm').textContent = '💧';
  const drops = [], geo = new THREE.SphereGeometry(.06, 14, 10), m = new THREE.MeshStandardMaterial({ color: 0x7cc4ff, roughness: .05, metalness: .1, transparent: true, opacity: .8, emissive: 0x0a3a66, emissiveIntensity: .4 });
  let n = 0, reveal = 0; P.water = true;
  const sealIds = ['seals'], lift = ['cover-glass', 'display'];
  api.skip = new Set(lift);
  const w = util.el('div', 'rng glass'); w.innerHTML = `<div class="acts" style="margin:0;justify-content:center"><button class="btn accent" type="button" data-a="drop">Drop water</button><button class="btn ghost" type="button" data-a="rain">Rain</button></div>`;
  S.hud.append(w); let rain = 0;
  const drop = () => { const [W, L] = M.footprint || [1.4, 3], d = new THREE.Mesh(geo, m); d.position.set((Math.random() - .5) * W * .8, M.topY + 2.5, (Math.random() - .5) * L * .8); d.userData.v = 0; root.add(d); drops.push({ m: d, life: 0, hit: false }); };
  S.on(w.querySelector('[data-a=drop]'), 'click', () => { for (let i = 0; i < 4; i++) setTimeout(drop, i * 90); });
  const rb = w.querySelector('[data-a=rain]'); S.on(rb, 'click', () => { rain = rain ? 0 : 1; rb.textContent = rain ? 'Stop rain' : 'Rain'; });
  S.prompt('Drop some water on it', 'Seals and gaskets are what earn an IP rating'); S.score('<b>0</b> drops blocked');
  let acc = 0;
  const tick = dt => {
    acc += dt; if (rain && acc > .08) { acc = 0; drop(); }
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i], o = d.m; if (!d.hit) { o.userData.v += 9.8 * dt * .6; o.position.y -= o.userData.v * dt; if (o.position.y <= M.topY + .05) { d.hit = true; n++; reveal = 1; o.scale.set(1.8, .35, 1.8); S.score(`<b>${n}</b> drops blocked`); if (n === 1) S.prompt('Blocked at the seal', 'The glass is bonded to the frame with an adhesive gasket'); } }
      else { d.life += dt; o.position.x += (o.position.x > 0 ? 1 : -1) * dt * .4; o.material.opacity = .8; if (d.life > 1.2) { root.remove(o); drops.splice(i, 1); } } }
    reveal = Math.max(0, reveal - dt * .25);
    lift.forEach(id => { const p = api.prep.byId[id]; if (p) p.obj.position.copy(p.home).addScaledVector(p.dir, reveal * .55); });
    const sel = reveal > .05 ? sealIds[0] : null; if (sel !== api.state.sel) { api.state.sel = sel; api.applyMaterials(); }
  };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  S.water = { drop, count: () => n };
  return S;
}
