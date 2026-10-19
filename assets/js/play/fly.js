// Flying roadster: lift off, hover, then fly through rings against the clock.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function start(api, { session, input, result, util, challenge }) {
  const { scene, camera, mdl } = api, P = mdl.params, root = mdl.root, TIME = 90000;
  const world = new THREE.Group(); scene.add(world);
  const sx = api.shadow.position.x, sy = api.shadow.position.y, sz = api.shadow.position.z, sc = api.shadow.scale.clone();
  const S = session(api, 'fly', { ex: 0, countdown: TIME, onExit: () => { scene.remove(world); world.traverse(o => o.geometry && o.geometry.dispose()); root.position.set(0, 0, 0); root.rotation.order = 'XYZ'; root.rotation.set(0, 0, 0); api.shadow.position.set(sx, sy, sz); api.shadow.scale.copy(sc); P.fan = 3; P.glow = .3; } });
  S.kbdHint = 'Space climb · Shift descend · W/S thrust · A/D turn';
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.01; world.add(ground);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(4, 40), new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: .8 })); pad.rotation.x = -Math.PI / 2; pad.position.y = .01; world.add(pad);
  const H = new THREE.Mesh(new THREE.RingGeometry(2.6, 3, 40), new THREE.MeshBasicMaterial({ color: 0xffffff })); H.rotation.x = -Math.PI / 2; H.position.y = .02; world.add(H);
  const C = new THREE.Vector3(0, 0, -48), RAD = 48, NR = 12, rings = [], ringR = 3.4;
  for (let i = 0; i < NR; i++) {
    const a = (i + .7) / NR * Math.PI * 2, p = new THREE.Vector3(C.x + RAD * Math.sin(a), 7 + 5 * Math.sin(i * 1.7), C.z + RAD * Math.cos(a));
    const m = new THREE.Mesh(new THREE.TorusGeometry(ringR, .28, 10, 40), new THREE.MeshStandardMaterial({ color: 0x0a84ff, emissive: 0x0a84ff, emissiveIntensity: .35, roughness: .4 }));
    m.position.copy(p); m.rotation.y = a + Math.PI / 2; world.add(m); rings.push({ m, p, n: new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)), done: false, prev: null });
  }
  const towers = []; for (let k = 0; k < 30; k++) { const a = k / 30 * Math.PI * 2, r = 110 + (k % 4) * 14, h = 10 + (k % 5) * 6, g = new THREE.BoxGeometry(6, h, 6); g.translate(Math.cos(a) * r, h / 2, Math.sin(a) * r - 48); towers.push(g); }
  world.add(new THREE.Mesh(mergeGeometries(towers), new THREE.MeshStandardMaterial({ color: 0xc7ccd4, roughness: .8 })));
  const inp = input(S, [['up', 'Up'], ['down', 'Down']]);
  let pos = new THREE.Vector3(0, 0, 0), yaw = 0, v = 0, vy = 0, score = 0, started = false, bank = 0, pitch = 0, over = false;
  root.rotation.order = 'YXZ'; api.freeCam = true; api.controls.enabled = false;
  S.prompt('Hold Up (or Space) to lift off', 'Fly through the blue rings'); S.score(`<b>0</b> / ${NR} rings`);
  const fwd = new THREE.Vector3(), want = new THREE.Vector3(), look = new THREE.Vector3(), rel = new THREE.Vector3();
  camera.position.set(-12, 6, 0); camera.lookAt(0, 1.5, 0); camera.far = 800; camera.updateProjectionMatrix();
  S.cleanups.push(() => { camera.far = api.prep.size * 40; camera.updateProjectionMatrix(); });
  const tick = (dt, t) => {
    if (over) return;
    const a = inp.axis(), up = inp.held.has('up') || inp.k('Space', 'KeyE') ? 1 : 0, dn = inp.held.has('down') || inp.k('ShiftLeft', 'ShiftRight', 'KeyQ', 'KeyC') ? 1 : 0;
    const air = pos.y > .05;
    if (!started && up) { started = true; S.start(); }
    if (S.running && S.elapsed() >= TIME) { end(); return; }
    vy += ((up - dn) * 7 - vy) * Math.min(1, dt * 2.5); if (!air && vy < 0) vy = 0;
    if (air) { const thr = -a.y; v += thr * 10 * dt; v -= v * .35 * dt; v = Math.max(-4, Math.min(24, v)); yaw -= a.x * 1.4 * dt; }
    else { v *= .9; }
    pos.y = Math.max(0, Math.min(40, pos.y + vy * dt)); fwd.set(Math.cos(yaw), 0, -Math.sin(yaw)); pos.addScaledVector(fwd, v * dt);
    const hover = air && !up && !dn ? Math.sin(t * 2.2) * .06 : 0;
    bank += ((air ? a.x * .45 : 0) - bank) * Math.min(1, dt * 4); pitch += ((air ? (-a.y) * -.12 : 0) - pitch) * Math.min(1, dt * 4);
    root.position.set(pos.x, pos.y + hover, pos.z); root.rotation.set(bank, yaw, pitch);
    P.fan = (air || up) ? 26 + up * 14 : 3; P.glow = .3 + Math.max(0, -a.y) * 2.4 * (air ? 1 : 0);
    api.shadow.position.set(pos.x, sy, pos.z); api.shadow.rotation.z = yaw; api.shadow.scale.copy(sc).multiplyScalar(1 / (1 + pos.y * .05));
    let next = null, nd = 1e9;
    rings.forEach(r => { if (r.done) return; rel.copy(pos).sub(r.p); const d = rel.dot(r.n);
      if (r.prev != null && Math.sign(d) !== Math.sign(r.prev) && rel.addScaledVector(r.n, -d).length() < ringR) { r.done = true; score++; r.m.material.color.setHex(0x30d158); r.m.material.emissive.setHex(0x30d158); api.toast(`Ring ${score}!`); S.score(`<b>${score}</b> / ${NR} rings`); if (score === NR) end(); }
      r.prev = d; const dd = pos.distanceTo(r.p); if (!r.done && dd < nd) { nd = dd; next = r; } });
    rings.forEach(r => { if (!r.done) r.m.material.emissiveIntensity = r === next ? .9 + Math.sin(t * 6) * .3 : .25; });
    if (started) S.prompt(air ? `${Math.round(v * 3.6)} km/h · ${Math.round(pos.y)} m` : 'Lifting off…', air ? (S.running ? `${util.fmt(Math.max(0, TIME - S.elapsed()))} left` : '') : '');
    S.q('.tm').textContent = util.fmt(Math.max(0, TIME - (S.running ? S.elapsed() : 0)));
    want.copy(pos).addScaledVector(fwd, -12).add({ x: 0, y: 5, z: 0 }); camera.position.lerp(want, 1 - Math.exp(-dt * 3.5)); look.copy(pos).addScaledVector(fwd, 5).add({ x: 0, y: 1, z: 0 }); camera.lookAt(look);
  };
  function end() { over = true; const t = S.stopTimer(); P.glow = .3; result(api, S, 'fly', { v: score, s: Math.round(t / 100) / 10, unit: 'rings', headline: `I flew the roadster through ${score} of ${NR} rings`, sub: `in ${util.fmt(t)}`, challenge }); }
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  return S;
}
