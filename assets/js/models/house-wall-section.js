import { THREE, model, add, grp, box, mat } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const W = 3.4, concrete = mat(0xb9b6b0, .9), timber = mat(0xd9b27c, .75), osb = mat(0xc89a5b, .85), dry = mat(0xf2f2ee, .9);
  const f = part('foundation'); add(f, box(W, .4, 1.0), concrete, [0, .2, -.05]); add(f, box(W, .55, .3), concrete, [0, .675, 0]);
  const s = part('slab'); add(s, box(W, .15, 2.1), mat(0xcac7c1, .85), [0, .875, -1.0]); add(s, box(W, .02, 2.1), mat(0x2c2c2e, .6), [0, .79, -1.0]);
  const y0 = .95, H = 2.4, st = part('studs');
  add(st, box(W, .045, .09), timber, [0, y0 + .0225, 0]); add(st, box(W, .045, .09), timber, [0, y0 + H - .0225, 0]); add(st, box(W, .045, .09), timber, [0, y0 + H + .0225, 0]);
  const xs = []; for (let x = -W / 2 + .03; x <= W / 2; x += .4) xs.push(x);
  xs.forEach(x => add(st, box(.045, H - .09, .09), timber, [x, y0 + H / 2, 0]));
  const ins = part('insulation'), wool = mat(0xf3c66b, 1);
  for (let i = 0; i < xs.length - 1; i++) add(ins, box(.35, H - .1, .085), wool, [(xs[i] + xs[i + 1]) / 2, y0 + H / 2, 0]);
  const sh = part('sheathing'); add(sh, box(W * .78, H + .12, .012), osb, [-W * .11, y0 + H / 2 + .02, .052]);
  const cl = part('cladding'), board = mat(0x5f6b73, .7), board2 = mat(0x6c7880, .7);
  let k = 0; for (let y = y0 + .02; y < y0 + H; y += .14, k++) add(cl, box(W * .55, .15, .022), k % 2 ? board : board2, [-W * .225, y + .075, .075], [-.06, 0, 0]);
  const ra = part('rafters'), pitch = .61, A = new THREE.Vector3(0, y0 + H + .05, .45), d = new THREE.Vector3(0, Math.sin(pitch), -Math.cos(pitch)), L = 3.0;
  for (let x = -W / 2 + .05; x <= W / 2; x += .6) { const m = add(ra, box(.045, .15, L), timber, [x, 0, 0], [pitch, 0, 0]); m.position.copy(A).addScaledVector(d, L / 2).setX(x); }
  const ti = part('tiles'), n = new THREE.Vector3(0, Math.cos(pitch), Math.sin(pitch)), tile = mat(0xb4553a, .8), tile2 = mat(0xa34a32, .8), batten = mat(0xa07a4a, .8);
  for (let s2 = .1, i = 0; s2 < L - .1; s2 += .26, i++) {
    const p = A.clone().addScaledVector(d, s2).addScaledVector(n, .1);
    add(ti, box(W * .75, .025, .04), batten, [-W * .125, p.y, p.z], [pitch, 0, 0]);
    const q = p.clone().addScaledVector(n, .035).addScaledVector(d, -.04);
    add(ti, box(W * .55, .03, .32), i % 2 ? tile : tile2, [-W * .225, q.y, q.z], [pitch + .05, 0, 0]);
  }
  const dw = part('drywall'); add(dw, box(W, H - .05, .0125), dry, [0, y0 + H / 2, -.052]);
  return {
    root, parts, view: [1.1, .55, 1.25], shells: ['cladding'],
    explode: { foundation: [0, -.12, .05], slab: [0, -.06, -.18], studs: [0, 0, 0], insulation: [-.0, .0, -.12], sheathing: [0, 0, .14], cladding: [0, 0, .3], rafters: [0, .12, -.04], tiles: [0, .26, .1], drywall: [0, 0, -.3] }
  };
}
