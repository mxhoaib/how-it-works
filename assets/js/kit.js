// Procedural modelling helpers. Everything is built from three.js primitives (no external models).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export { THREE };
export const MOBILE = matchMedia('(max-width: 767px)').matches;
export const Q = MOBILE ? 0.55 : 1;
export const S = n => Math.max(5, Math.round(n * Q));
// Brushed-metal roughness map (generated, no image files) shared by every metallic material.
let brushed;
function brushedTex() {
  if (brushed) return brushed; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++) { const v = 100 + Math.random() * 70 | 0; x.fillStyle = `rgba(${v},${v},${v},.35)`; x.fillRect(Math.random() * 256, Math.random() * 256, 30 + Math.random() * 120, 1); }
  brushed = new THREE.CanvasTexture(c); brushed.wrapS = brushed.wrapT = THREE.RepeatWrapping; brushed.repeat.set(2, 2); return brushed;
}
export const mat = (color, r = .55, m = .1, extra = {}) => {
  const metal = m >= .5;
  return new THREE.MeshStandardMaterial({ color, roughness: metal ? Math.min(r + .1, .5) : r, metalness: metal ? Math.max(m, .9) : m, envMapIntensity: metal ? 1.25 : 1, roughnessMap: metal ? brushedTex() : null, side: THREE.DoubleSide, ...extra });
};
export const glass = (color = 0x9ec9ff, o = .35) => mat(color, .05, .2, { transparent: true, opacity: o, depthWrite: false });
export const glow = (color, i = 1.5) => mat(color, .4, 0, { emissive: color, emissiveIntensity: i });
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt, rb, h, s = 24, open = false, ts = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, S(s), 1, open, ts, tl);
export const sph = (r, s = 24) => new THREE.SphereGeometry(r, S(s), Math.max(4, Math.round(S(s) * .66)));
export const tor = (r, t, rs = 12, ts = 32, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, S(rs), S(ts), arc);
export const cone = (r, h, s = 24) => new THREE.ConeGeometry(r, h, S(s));
export function add(parent, geo, material, p = [0, 0, 0], r = [0, 0, 0], s) {
  const m = new THREE.Mesh(geo, material); m.position.set(...p); m.rotation.set(...r);
  if (s) Array.isArray(s) ? m.scale.set(...s) : m.scale.setScalar(s);
  parent.add(m); return m;
}
export function grp(parent, p = [0, 0, 0], r = [0, 0, 0]) { const g = new THREE.Group(); g.position.set(...p); g.rotation.set(...r); parent.add(g); return g; }
// a beam between two points (box), for frames, rods, struts
export function beam(parent, a, b, w, d, material) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const m = new THREE.Mesh(box(w, L, d), material); m.position.copy(A).add(B).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); parent.add(m); return m;
}
export function rod(parent, a, b, r, material, s = 12) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const m = new THREE.Mesh(cyl(r, r, L, s), material); m.position.copy(A).add(B).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); parent.add(m); return m;
}
export const tube = (pts, r, seg = 64, rs = 10) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), S(seg), r, S(rs), false);
export const lathe = (pts, seg = 48, ps = 0, pl = Math.PI * 2) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), S(seg), ps, pl);
// spur gear in the XY plane, axis = Z, centred
export function gear(teeth, module, width, bore = 0) {
  const r = module * teeth / 2, ra = r + module, rf = r - 1.25 * module, sh = new THREE.Shape();
  const step = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step, pts = [[rf, a - step * .5], [rf, a - step * .25], [ra, a - step * .12], [ra, a + step * .12], [rf, a + step * .25]];
    pts.forEach(([rr, aa], j) => { const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr; (i === 0 && j === 0) ? sh.moveTo(x, y) : sh.lineTo(x, y); });
  }
  sh.closePath();
  if (bore) { const h = new THREE.Path(); h.absarc(0, 0, bore, 0, Math.PI * 2, true); sh.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: width, bevelEnabled: false, curveSegments: S(16) }); g.translate(0, 0, -width / 2); return g;
}
// ring of blades around the X axis, merged into one geometry
export function bladeRing(n, rIn, rOut, chord, thick, twist = .5) {
  n = Math.max(6, Math.round(n * (MOBILE ? .7 : 1)));
  const gs = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.BoxGeometry(chord, rOut - rIn, thick);
    g.translate(0, (rIn + rOut) / 2, 0); g.rotateY(twist); g.rotateX(i / n * Math.PI * 2); gs.push(g);
  }
  return mergeGeometries(gs);
}
export function merge(gs) { return mergeGeometries(gs); }
export function model() {
  const root = new THREE.Group(), parts = {};
  const part = (id, p = [0, 0, 0]) => { const g = new THREE.Group(); g.name = id; g.position.set(...p); root.add(g); parts[id] = g; return g; };
  return { root, parts, part };
}
