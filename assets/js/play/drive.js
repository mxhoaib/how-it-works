// Electric pickup: drive a small test track with keyboard or touch joystick, with lap timing.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const L = 20, R = 20, HW = 4.5, LEN = 4 * L + 2 * Math.PI * R;
function centre(u) { // u in [0, LEN) -> point + heading on a stadium-shaped loop
  u = ((u % LEN) + LEN) % LEN; const a = 2 * L, c = Math.PI * R;
  if (u < a) return { x: -L + u, z: R };
  if ((u -= a) < c) { const t = u / R; return { x: L + R * Math.sin(t), z: R * Math.cos(t) }; }
  if ((u -= c) < a) return { x: L - u, z: -R };
  u -= a; const t = u / R; return { x: -L - R * Math.sin(t), z: -R * Math.cos(t) };
}
function dist(x, z) { if (Math.abs(x) <= L) return Math.abs(Math.abs(z) - R); const cx = x > 0 ? L : -L; return Math.abs(Math.hypot(x - cx, z) - R); }
export function start(api, { session, input, result, util, challenge }) {
  const { scene, camera, mdl } = api, P = mdl.params, root = mdl.root;
  const world = new THREE.Group(); scene.add(world);
  const S = session(api, 'drive', { ex: 0, onExit: () => { scene.remove(world); world.traverse(o => { o.geometry && o.geometry.dispose(); }); root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); api.shadow.position.set(sx, sy, sz); api.shadow.rotation.z = 0; P.speed = 0; P.steer = 0; } });
  const sx = api.shadow.position.x, sy = api.shadow.position.y, sz = api.shadow.position.z;
  S.kbdHint = 'W / ↑ drive · S / ↓ brake · A D / ← → steer';
  // track
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.01; world.add(ground);
  const N = api.isMobile ? 120 : 220, pos = [], idx = [];
  for (let i = 0; i <= N; i++) { const u = i / N * LEN, p = centre(u), q = centre(u + .5), dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l; pos.push(p.x + nx * HW, .005, p.z + nz * HW, p.x - nx * HW, .005, p.z - nz * HW); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setIndex(idx); rg.computeVertexNormals();
  world.add(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: .9, side: THREE.DoubleSide })));
  const dash = [], cones = [];
  for (let u = 0; u < LEN; u += 4) { const p = centre(u), q = centre(u + .5), g = new THREE.BoxGeometry(1.4, .02, .18); g.rotateY(-Math.atan2(q.z - p.z, q.x - p.x)); g.translate(p.x, .02, p.z); dash.push(g); }
  for (let u = 0; u < LEN; u += 7) { const p = centre(u), q = centre(u + .5), dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz); [1, -1].forEach(s => { const g = new THREE.ConeGeometry(.3, .8, 8); g.translate(p.x - dz / l * (HW + .8) * s, .4, p.z + dx / l * (HW + .8) * s); cones.push(g); }); }
  world.add(new THREE.Mesh(mergeGeometries(dash), new THREE.MeshBasicMaterial({ color: 0xffffff })));
  world.add(new THREE.Mesh(mergeGeometries(cones), new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: .6 })));
  const chk = []; for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { const g = new THREE.BoxGeometry(.45, .03, HW * 2 / 10); g.translate(j * .45 - .2, .015, R - HW + (i + .5) * HW * 2 / 10); if ((i + j) % 2) chk.push(g); }
  world.add(new THREE.Mesh(mergeGeometries(chk), new THREE.MeshBasicMaterial({ color: 0x111111 })));
  const startBar = new THREE.Mesh(new THREE.BoxGeometry(.9, .02, HW * 2), new THREE.MeshBasicMaterial({ color: 0xffffff })); startBar.position.set(0, .01, R); world.add(startBar);
  const trees = []; for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2, rr = 58 + (k % 3) * 9, g = new THREE.ConeGeometry(2.2, 6, 7); g.translate(Math.cos(a) * rr * 1.25, 3, Math.sin(a) * rr); trees.push(g); }
  world.add(new THREE.Mesh(mergeGeometries(trees), new THREE.MeshStandardMaterial({ color: 0x8fb996, roughness: .9 })));
  // car state
  let x = -8, z = R, yaw = 0, v = 0, lap = 0, half = false, lapStart = 0, laps = [], best = null, prevX = x;
  const inp = input(S); const LAPS = 3;
  S.prompt('Cross the line to start', `${LAPS} laps · best lap counts`); S.score('Lap <b>–</b>');
  api.freeCam = true; api.controls.enabled = false;
  const fwd = new THREE.Vector3(), look = new THREE.Vector3(), want = new THREE.Vector3();
  camera.position.set(x - 12, 5, z); camera.lookAt(x, 1, z);
  const tick = (dt) => {
    const a = inp.axis(), thr = Math.max(0, -a.y), brk = Math.max(0, a.y), off = dist(x, z) > HW + .4;
    const vmax = off ? 9 : 30;
    if (thr) v += thr * 13 * dt; if (brk) v -= brk * (v > 0 ? 24 : 8) * dt;
    v -= v * (off ? 1.4 : .25) * dt; if (!thr && !brk) v -= Math.sign(v) * Math.min(Math.abs(v), 2 * dt);
    v = Math.max(-7, Math.min(vmax, v));
    const steer = -a.x * .55 * (1 - Math.min(.65, Math.abs(v) / 45)); P.steer += (steer - P.steer) * Math.min(1, dt * 10);
    yaw += v / 3.5 * Math.tan(P.steer) * dt; x += Math.cos(yaw) * v * dt; z -= Math.sin(yaw) * v * dt; P.speed = v;
    const rr = Math.hypot(x, z); if (rr > 150) { x *= 150 / rr; z *= 150 / rr; v *= .5; }
    root.position.set(x, 0, z); root.rotation.set(0, yaw, 0); api.shadow.position.set(x, sy, z); api.shadow.rotation.z = yaw;
    // laps
    if (z > 0 && prevX < 0 && x >= 0) { const now = performance.now();
      if (lap === 0) { lap = 1; lapStart = now; S.start(); half = false; }
      else if (half) { const t = now - lapStart; laps.push(t); best = best == null ? t : Math.min(best, t); lap++; lapStart = now; half = false;
        if (laps.length >= LAPS) { S.stopTimer(); P.speed = 0; v = 0; inp.keys.clear(); S.prompt('Finished!'); result(api, S, 'drive', { v: best, s: LAPS, headline: `My best lap in the electric pickup: ${util.fmt(best)}`, sub: laps.map((l, i) => `Lap ${i + 1}: ${util.fmt(l)}`).join(' · '), challenge }); api.hooks.delete(tick); return; } } }
    if (z < 0 && prevX > 0 && x <= 0) half = true; prevX = x;
    if (lap > 0) { S.score(`Lap <b>${lap}</b>/${LAPS}${best ? ` · best ${util.fmt(best)}` : ''}`); S.prompt(`${Math.round(Math.abs(v) * 3.6)} km/h`, off ? 'Off track: get back on the tarmac' : `Lap time ${util.fmt(performance.now() - lapStart)}`); }
    // chase camera
    fwd.set(Math.cos(yaw), 0, -Math.sin(yaw)); want.set(x, 0, z).addScaledVector(fwd, -11).add({ x: 0, y: 4.6, z: 0 });
    camera.position.lerp(want, 1 - Math.exp(-dt * 4)); look.set(x, 1.1, z).addScaledVector(fwd, 4); camera.lookAt(look);
  };
  api.hooks.add(tick); S.cleanups.push(() => api.hooks.delete(tick));
  camera.far = 600; camera.updateProjectionMatrix(); S.cleanups.push(() => { camera.far = api.prep.size * 40; camera.updateProjectionMatrix(); });
  return S;
}
