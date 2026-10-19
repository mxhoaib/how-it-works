import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export const isMobile = matchMedia('(max-width: 767px)').matches;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function makeRenderer(canvas, alpha = false) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1;
  r.outputColorSpace = THREE.SRGBColorSpace; r.localClippingEnabled = true;
  return r;
}
export function setupScene(renderer, dark = false) {
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
  const key = new THREE.DirectionalLight(0xffffff, dark ? 1.6 : 1.1); key.position.set(4, 8, 6); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x222222 : 0xcfd3da, dark ? .3 : .45));
  const rim = new THREE.DirectionalLight(dark ? 0xbfd8ff : 0xffffff, dark ? 2.2 : 1.0); rim.position.set(-6, 5, -8); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff1e0, .35); fill.position.set(-5, 2, 6); scene.add(fill);
  return scene;
}
let shadowTex;
export function shadowPlane(prep, dark = false) {
  if (!shadowTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(.55, 'rgba(0,0,0,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); shadowTex = new THREE.CanvasTexture(c);
  }
  const s = prep.box.getSize(new THREE.Vector3());
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: dark ? .9 : .75 }));
  m.rotation.x = -Math.PI / 2; m.scale.set(s.x * 1.5, s.z * 1.5 + s.x * .15, 1); m.position.set(prep.center.x, prep.box.min.y + .002, prep.center.z); m.renderOrder = -1;
  if (dark) { // soft floor glow on black
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, 'rgba(120,130,150,.55)'); g.addColorStop(.5, 'rgba(60,66,80,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(2.2, 2.2, 1); glow.position.z = -.001; m.add(glow);
  }
  return m;
}
// Collects parts, clones materials, stores home transforms and explode vectors.
export function prepare(mdl) {
  const V = THREE.Vector3; mdl.root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mdl.root), center = box.getCenter(new V()), size = box.getSize(new V()).length();
  const list = [];
  for (const [id, obj] of Object.entries(mdl.parts)) {
    const b = new THREE.Box3().setFromObject(obj); if (b.isEmpty()) continue;
    const c = b.getCenter(new V());
    let dir = mdl.explode && mdl.explode[id] ? new V(...mdl.explode[id]).multiplyScalar(size * 1.3) : c.clone().sub(center).multiplyScalar(1.3);
    if (dir.length() < size * .02) dir.set(0, size * .25, 0);
    const meshes = [], cache = new Map();
    obj.traverse(o => {
      if (!o.isMesh) return;
      if (!cache.has(o.material)) { const m = o.material.clone(); m.userData.base = { color: m.color.clone(), emissive: m.emissive.clone(), ei: m.emissiveIntensity, opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite }; cache.set(o.material, m); }
      o.material = cache.get(o.material); o.userData.part = id; meshes.push(o);
    });
    const spread = obj.userData.spread ? obj.children.map(ch => {
      const cb = new THREE.Box3().setFromObject(ch), cc = cb.isEmpty() ? ch.getWorldPosition(new V()) : cb.getCenter(new V());
      const d = cc.sub(c).multiply(new V(...(obj.userData.spreadMask || [1, 1, 1]))).multiplyScalar(obj.userData.spread);
      return { o: ch, home: ch.position.clone(), d };
    }) : null;
    list.push({ id, obj, home: obj.position.clone(), dir, local: obj.worldToLocal(c.clone()), meshes, mats: [...cache.values()], spread, shell: !!(mdl.shells && mdl.shells.includes(id)) });
  }
  return { box, center, size, list, byId: Object.fromEntries(list.map(p => [p.id, p])) };
}
export function applyExplode(prep, e, skip) {
  for (const p of prep.list) {
    if (skip && skip.has(p.id)) continue;
    p.obj.position.copy(p.home).addScaledVector(p.dir, e);
    if (p.spread) for (const s of p.spread) s.o.position.copy(s.home).addScaledVector(s.d, e);
  }
}
export function fitCamera(camera, prep, view = [1, .55, 1.2], aspect = 1, k = 1.08) {
  const dir = new THREE.Vector3(...view).normalize();
  let dist = (prep.size / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * k;
  if (aspect < 1) dist /= Math.max(.55, aspect * 1.05);
  camera.position.copy(prep.center).addScaledVector(dir, dist); camera.near = prep.size / 100; camera.far = prep.size * 40; camera.updateProjectionMatrix();
  return prep.center.clone();
}
