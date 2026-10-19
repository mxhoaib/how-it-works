import { THREE, model, add, grp, box, cyl, mat, glow, rbox, pcbTex, smd, merge, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const L = 8, W = 2.2, Y = .1, chip = mat(0x1f2023, .4, .3), gold = mat(0xd9b45a, .3, .95);
  const pc = part('pcb'); add(pc, box(L - .3, .08, W), mat(0xffffff, .5, .2, { map: pcbTex('#0e2b22') }), [-.15, Y, 0]); add(pc, cyl(.2, .2, .081, 24, false, 0, Math.PI), mat(0xd9b45a, .4, .8), [-L / 2 + .1, Y, 0], [0, -Math.PI / 2, 0]);
  smd(pc, MOBILE ? 30 : 80, -3.6, 3.2, -1.0, 1.0, Y + .04, mat(0x8a6a4a, .5, .3), .05);
  const ec = part('edge-connector'), f = []; for (let i = 0; i < 67; i++) { if (i >= 57 && i <= 61) continue; const g = new THREE.BoxGeometry(.18, .084, .022); g.translate(L / 2 - .25, Y, -1.0 + i * .03); f.push(g); } add(ec, merge(f), gold);
  const co = part('controller'); add(co, box(1.0, .1, 1.0), chip, [2.6, Y + .09, 0]); const led = add(co, sph2(), glow(0x30d158, .2), [2.6, Y + .15, .55]);
  function sph2() { return new THREE.SphereGeometry(.05, 10, 6); }
  const dr = part('dram'); add(dr, box(.7, .08, .9), chip, [1.5, Y + .08, 0]);
  const pm = part('power-ic'); add(pm, box(.35, .06, .35), chip, [3.4, Y + .07, -.7]); add(pm, box(.25, .12, .25), mat(0x3a3c40, .5, .5), [3.4, Y + .1, .7]);
  const nd = part('nand-flash'), pkgs = [-2.4, -.6]; pkgs.forEach(x => add(nd, box(1.5, .1, 1.6), chip, [x, Y + .09, 0]));
  const per = 8 * 6, cells = new THREE.InstancedMesh(new THREE.BoxGeometry(.13, .02, .2), mat(0xffffff, .4, .1, { emissive: 0xffffff, emissiveIntensity: .25 }), per * pkgs.length);
  const dm = new THREE.Object3D(); let k = 0; pkgs.forEach(x => { for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { dm.position.set(x - .63 + i * .18, Y + .15, -.63 + j * .25); dm.updateMatrix(); cells.setMatrixAt(k, dm.matrix); cells.setColorAt(k, new THREE.Color(0x3a3d46)); k++; } }); nd.add(cells);
  const hsp = part('heat-spreader'); add(hsp, box(6.4, .02, 2.1), mat(0xc77b43, .35, .9, { transparent: true, opacity: .55, depthWrite: false }), [-.6, Y + .26, 0]); add(hsp, box(3, .021, 1.2), mat(0x1c1d20, .6), [-.6, Y + .27, 0]);
  const P = { write: null, writes: new Uint16Array(per * pkgs.length) };
  const cool = new THREE.Color(0x3a3d46), hot = new THREE.Color(0x30d158), c = new THREE.Color();
  return {
    root, parts, quizEx: .7, params: P, view: [.35, 1.1, .9], sliceAxis: 'z', shells: ['heat-spreader'], cellCount: per * pkgs.length,
    peel: ['heat-spreader', 'nand-flash', 'controller', 'dram', 'power-ic', 'edge-connector', 'pcb'],
    explode: { 'heat-spreader': [0, .35, 0], 'nand-flash': [-.02, .18, 0], controller: [.03, .2, 0], dram: [.02, .16, 0], 'power-ic': [.04, .14, 0], 'edge-connector': [.12, 0, 0], pcb: [0, 0, 0] },
    write() { // wear-levelled: pick the least-written cell
      let m = 0; for (let i = 1; i < P.writes.length; i++) if (P.writes[i] < P.writes[m]) m = i; P.writes[m]++; return m; },
    update(dt, t) {
      const max = Math.max(1, ...P.writes);
      for (let i = 0; i < P.writes.length; i++) { c.copy(cool).lerp(hot, P.writes[i] / max); cells.setColorAt(i, c); } cells.instanceColor.needsUpdate = true;
      led.material.emissiveIntensity = P.write ? (Math.sin(t * 40) > 0 ? 3 : .2) : .2;
    }
  };
}
