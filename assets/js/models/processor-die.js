import { THREE, model, add, grp, box, cyl, mat, glow, ctex, merge, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const W = 4, D = 3, Y = .3;
  const si = part('silicon-substrate'); add(si, box(W, .3, D), mat(0x3b4150, .25, .55), [0, .15, 0]);
  const blocks = (p, list, color, h = .08) => { const gs = []; list.forEach(([x, z, w, d]) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, Y + h / 2, z); gs.push(g); }); return add(p, merge(gs), mat(color, .35, .4)); };
  const cores = [], det = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = -1.75 + .45 + i * .62, z = j ? .75 : -.75; cores.push([x, z, .56, 1.1]);
    for (let k = 0; k < 6; k++) { const g = new THREE.BoxGeometry(.22, .03, .14); g.translate(x - .12 + (k % 2) * .25, Y + .095, z - .38 + Math.floor(k / 2) * .36); det.push(g); } }
  const co = part('cores'); blocks(co, cores, 0x6a55a8); add(co, merge(det), mat(0x8e7ad0, .3, .5));
  const ca = part('cache'), cells = []; blocks(ca, [[-.5, 0, 2.4, .32]], 0x2f7a77, .07); for (let i = 0; i < 40; i++) for (let j = 0; j < 4; j++) { const g = new THREE.BoxGeometry(.05, .02, .06); g.translate(-1.68 + i * .06, Y + .08, -.11 + j * .075); cells.push(g); } add(ca, merge(cells), mat(0x48a8a3, .3, .5));
  const gp = part('graphics'), eus = []; blocks(gp, [[1.38, -.35, 1.1, 2.0]], 0x8a3f50); for (let i = 0; i < 4; i++) for (let j = 0; j < 7; j++) { const g = new THREE.BoxGeometry(.2, .04, .2); g.translate(.98 + i * .26, Y + .1, -1.2 + j * .25); eus.push(g); } add(gp, merge(eus), mat(0xc0566c, .3, .4));
  const mc = part('memory-controller'), phy = []; blocks(mc, [[1.38, 1.05, 1.1, .6]], 0x7a6a2f); for (let i = 0; i < 10; i++) { const g = new THREE.BoxGeometry(.06, .03, .5); g.translate(.9 + i * .1, Y + .095, 1.05); phy.push(g); } add(mc, merge(phy), mat(0xc2a548, .3, .7));
  const io = part('io'), pads = []; blocks(io, [[-.5, -1.38, 2.9, .2], [-.5, 1.38, 2.9, .2]], 0x3d5578, .06); for (let i = 0; i < 30; i++) [-1.38, 1.38].forEach(z => { const g = new THREE.BoxGeometry(.05, .03, .1); g.translate(-1.9 + i * .095, Y + .075, z); pads.push(g); }); add(io, merge(pads), mat(0xd9b45a, .3, .95));
  const ic = part('interconnect'), ring = []; [[-.5, -.2, 2.5, .025], [-.5, .2, 2.5, .025], [-1.75, 0, .025, .4], [.75, 0, .025, .4]].forEach(([x, z, w, d]) => { const g = new THREE.BoxGeometry(w, .03, d); g.translate(x, Y + .12, z); ring.push(g); }); add(ic, merge(ring), mat(0x64d2ff, .3, .2, { emissive: 0x64d2ff, emissiveIntensity: 1.2 }));
  const ml = part('metal-layers'), N = MOBILE ? 4 : 7;
  for (let l = 0; l < N; l++) { const t = ctex(256, 192, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = `rgba(${200 - l * 10},${150 + l * 8},${90 + l * 15},.85)`; const step = 4 + l * 3; for (let p = 0; p < (l % 2 ? w : h); p += step) { if (l % 2) x.fillRect(p, 0, Math.max(1, step / 3), h); else x.fillRect(0, p, w, Math.max(1, step / 3)); } });
    const m = add(ml, box(W - .1, .012, D - .1), mat(0xffffff, .3, .8, { map: t, transparent: true, opacity: .4, depthWrite: false, alphaTest: .05 }), [0, Y + .2 + l * .07, 0]); }
  ml.userData.spread = 2.2; ml.userData.spreadMask = [0, 1, 0];
  const bumps = part('bumps'), b = []; for (let i = 0; i < 18; i++) for (let j = 0; j < 13; j++) { const g = new THREE.SphereGeometry(.035, 6, 4); g.translate(-1.8 + i * .212, Y + .25 + N * .07, -1.3 + j * .216); b.push(g); } add(bumps, merge(b), mat(0xc9ccd1, .3, .9));
  return {
    root, parts, view: [.5, 1.1, .9], sliceAxis: 'x', shells: ['metal-layers'],
    zoom: [
      { label: 'The whole die', sub: 'Cores, cache, graphics and I/O laid out like a city', bar: '≈ 3 mm', mag: '1×' },
      { label: 'Under the wiring', sub: 'Metal layers and bumps lifted away', bar: '≈ 2 mm', mag: '2×', focus: [0, .3, 0], k: .62, hide: ['metal-layers', 'bumps'] },
      { label: 'One CPU core', sub: 'Execution units, registers and private cache', bar: '≈ 0.5 mm', mag: '6×', focus: [-1.3, .38, -.75], k: .28, hide: ['metal-layers', 'bumps'] },
      { label: 'A single FinFET transistor', sub: 'The gate switches current through the fins on and off', bar: '≈ 50 nm', mag: '100,000×', nano: true, k: 1.1 }
    ],
    explode: { 'silicon-substrate': [0, -.12, 0], cores: [0, 0, 0], cache: [0, .02, 0], graphics: [.05, .02, 0], 'memory-controller': [.05, .03, .05], io: [0, .02, 0], interconnect: [0, .06, 0], 'metal-layers': [0, .16, 0], bumps: [0, .34, 0] }
  };
}
