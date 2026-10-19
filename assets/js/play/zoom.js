// Zoom: step from the whole part down to a single FinFET transistor, with a scale bar at each level.
function finfet(THREE) {
  const g = new THREE.Group(), M = (c, r = .45, m = .2, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...x });
  const add = (geo, mt, p) => { const o = new THREE.Mesh(geo, mt); o.position.set(...p); g.add(o); return o; };
  add(new THREE.BoxGeometry(2.4, .3, 1.6), M(0x4a5266), [0, -.15, 0]); // silicon
  add(new THREE.BoxGeometry(2.4, .12, 1.6), M(0x8fb3d9, .2, 0, { transparent: true, opacity: .5 }), [0, .06, 0]); // shallow trench oxide
  const fins = [-.4, 0, .4].map(z => add(new THREE.BoxGeometry(2.2, .5, .12), M(0x7d8aa8, .35, .3), [0, .25, z]));
  const gate = add(new THREE.BoxGeometry(.36, .75, 1.4), M(0xd8a24a, .3, .85), [0, .38, 0]); // gate wraps three sides of each fin
  add(new THREE.BoxGeometry(.4, .78, 1.42), M(0xff6b6b, .4, 0, { transparent: true, opacity: .35 }), [0, .37, 0]); // high-k dielectric
  [-.75, .75].forEach(x => { add(new THREE.BoxGeometry(.5, .56, 1.2), M(x < 0 ? 0x5fb37a : 0x5f8ab3, .4, .1, { transparent: true, opacity: .5, depthWrite: false }), [x, .28, 0]); add(new THREE.BoxGeometry(.2, .6, .2), M(0xb0b6bf, .3, .9), [x, .85, 0]); });
  add(new THREE.BoxGeometry(.18, .5, .18), M(0xb0b6bf, .3, .9), [0, 1.0, 0]);
  const e = [], eg = new THREE.SphereGeometry(.035, 8, 6), em = new THREE.MeshStandardMaterial({ color: 0x64d2ff, emissive: 0x64d2ff, emissiveIntensity: 2 });
  for (let i = 0; i < 24; i++) { const o = new THREE.Mesh(eg, em); o.userData.z = [-.4, 0, .4][i % 3]; o.userData.u = Math.random(); g.add(o); e.push(o); }
  g.userData.tick = (t, on) => e.forEach(o => { o.visible = on; o.userData.u = (o.userData.u + .006) % 1; o.position.set(-1.0 + o.userData.u * 2.0, .54, o.userData.z); });
  return g;
}
export function start(api, { session, util }) {
  const { THREE, camera, controls, prep } = api, Z = api.mdl.zoom, root = api.mdl.root;
  let k = 0, nano = null, t = 0, gateOn = true;
  const S = session(api, 'zoom', { ex: 0, onExit: () => { if (nano) api.scene.remove(nano); } }); S.q('.tm').textContent = '1×';
  const homeDir = camera.position.clone().sub(controls.target).normalize(), homeDist = camera.position.distanceTo(controls.target);
  const w = util.el('div', 'rng glass'); w.innerHTML = `<div class="sbar" style="display:flex;align-items:center;gap:10px;font-size:13px;margin-bottom:8px"><span style="flex:0 0 80px;height:3px;background:currentColor;border-radius:2px"></span><span class="sl"></span></div><div class="acts" style="margin:0;justify-content:center"><button class="btn ghost" type="button" data-a="out">Zoom out</button><button class="btn accent" type="button" data-a="in">Zoom in</button></div>`;
  S.hud.append(w); const inb = w.querySelector('[data-a=in]'), outb = w.querySelector('[data-a=out]');
  const tgtPos = new THREE.Vector3(), tgtLook = new THREE.Vector3(); let moving = 0;
  const go = i => {
    k = Math.max(0, Math.min(Z.length - 1, i)); const z = Z[k];
    if (z.nano && !nano) { nano = finfet(THREE); nano.scale.setScalar(prep.size * .32); nano.position.copy(prep.center); api.scene.add(nano); }
    if (nano) nano.visible = !!z.nano;
    const f = z.nano ? prep.center.clone().add(new THREE.Vector3(0, prep.size * .1, 0)) : (z.focus ? root.localToWorld(new THREE.Vector3(...z.focus)) : prep.center.clone());
    tgtLook.copy(f); tgtPos.copy(f).addScaledVector(homeDir, homeDist * (z.k || 1)); moving = 1;
    if (z.nano) camera.position.copy(f).addScaledVector(homeDir, homeDist * .12); // punch in from very close
    S.prompt(z.label, z.sub); w.querySelector('.sl').textContent = z.bar; S.score(`Level <b>${k + 1}</b> / ${Z.length}`); S.q('.tm').textContent = z.mag;
    inb.disabled = k === Z.length - 1; outb.disabled = k === 0; inb.textContent = k === Z.length - 1 ? 'Deepest level' : 'Zoom in';
  };
  S.on(inb, 'click', () => go(k + 1)); S.on(outb, 'click', () => go(k - 1));
  S.on(api.canvas, 'dblclick', () => go(k + 1));
  const tick = dt => {
    t += dt; const z = Z[k];
    if (moving) { const a = Math.min(1, dt * 3.2); camera.position.lerp(tgtPos, a); controls.target.lerp(tgtLook, a); if (camera.position.distanceTo(tgtPos) < prep.size * .002) moving = 0; }
    prep.list.forEach(p => { if (z.nano || (z.hide && z.hide.includes(p.id))) p.obj.visible = false; });
    if (nano) nano.userData.tick(t, gateOn && Math.sin(t * 2) > -.3);
  };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  S.zoom = { go, level: () => k, total: Z.length }; go(0);
  return S;
}
