import { THREE, model, add, grp, box, cyl, mat, glow, rbox, pcbTex, smd, bladeRing, tube, tor, merge, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const L = 4.6, Wd = 1.6, Y = .3, dark = mat(0x1c1d20, .45, .3), chip = mat(0x2a2b2f, .35, .4), gold = mat(0xd9b45a, .3, .95), cu = mat(0xc77b43, .3, .95), alu = mat(0xb8bdc4, .35, .9);
  const bp = part('backplate'); add(bp, box(L - .1, .03, Wd - .05), mat(0x2a2c30, .35, .85), [0, Y - .05, 0]);
  const pc = part('pcb'); add(pc, box(L - .2, .05, Wd - .1), mat(0xffffff, .5, .2, { map: pcbTex('#151a17') }), [-.05, Y, 0]); smd(pc, MOBILE ? 50 : 140, -2.0, 1.9, -.65, .65, Y + .025, mat(0x6b6e74, .4, .6), .03);
  const pf = part('pcie-connector'), fing = []; for (let i = 0; i < 40; i++) { if (i === 8) continue; const g = new THREE.BoxGeometry(.035, .052, .12); g.translate(-1.6 + i * .06, Y, Wd / 2 - .02); fing.push(g); } add(pf, merge(fing), gold);
  const gd = part('gpu-chip'); add(gd, box(.8, .04, .8), mat(0x2f6d3f, .5, .2), [-.3, Y + .045, 0]); const die = add(gd, box(.48, .04, .44), mat(0x3a3e47, .2, .7, { emissive: 0xff5a00, emissiveIntensity: 0 }), [-.3, Y + .085, 0]);
  const vr = part('vram'); [[-1.0, -.45], [-1.0, 0], [-1.0, .45], [.4, -.45], [.4, 0], [.4, .45], [-.3, -.6], [-.3, .6]].forEach(([x, z]) => add(vr, box(.26, .03, .2), chip, [x, Y + .04, z]));
  const vm = part('power-stages'); for (let i = 0; i < 10; i++) { add(vm, box(.14, .12, .14), mat(0x3a3c40, .5, .5), [.9 + (i % 5) * .2, Y + .085, -.3 + Math.floor(i / 5) * .55]); add(vm, box(.1, .03, .08), chip, [.9 + (i % 5) * .2, Y + .04, -.08 + Math.floor(i / 5) * .55]); }
  const pw = part('power-connector'); add(pw, box(.5, .2, .22), dark, [1.6, Y + .13, -Wd / 2 + .2]); for (let i = 0; i < 6; i++) add(pw, box(.05, .15, .05), mat(0x111, .5), [1.42 + i * .07, Y + .15, -Wd / 2 + .12]);
  const io = part('io-bracket'); add(io, box(.04, 1.0, Wd + .1), mat(0xb4b8be, .3, .9), [-L / 2 - .02, Y + .45, 0]); [[-.45], [-.1], [.25], [.55]].forEach(([z]) => add(io, rbox(.05, .14, .24, .03), dark, [-L / 2 - .02, Y + .3, z]));
  const hs = part('heatsink'), fins = []; for (let i = 0; i < (MOBILE ? 45 : 90); i++) { const g = new THREE.BoxGeometry(.012, .42, Wd - .2); g.translate(-2.05 + i * (4.1 / (MOBILE ? 45 : 90)), Y + .38, 0); fins.push(g); } add(hs, merge(fins), alu); add(hs, box(1.0, .06, .9), cu, [-.3, Y + .135, 0]);
  const hp = part('heat-pipes'); [-.3, -.1, .1, .3].forEach((z, i) => add(hp, tube([[-1.9, Y + .5, z], [-1.0, Y + .2, z], [-.3, Y + .15, z], [.5, Y + .2, z], [1.9, Y + .5 - i * .02, z]], .035, 40, 8), cu));
  const fn = part('fans'), rotors = []; [-1.35, 0, 1.35].forEach(x => { const g = grp(fn, [x, Y + .68, 0]); add(g, tor(.6, .025, 6, 48), dark, [0, 0, 0], [Math.PI / 2, 0, 0]); const r = grp(g); add(r, bladeRing(11, .14, .58, .22, .016, .7), mat(0x2c2d31, .45, .2), [0, 0, 0], [0, 0, Math.PI / 2]); add(r, cyl(.15, .15, .06, 24), mat(0x3a3c40, .4, .4)); rotors.push(r); });
  const sh = part('shroud'); add(sh, box(L - .1, .04, .12), mat(0x2f3136, .35, .6), [0, Y + .7, Wd / 2 - .05]); add(sh, box(L - .1, .04, .12), mat(0x2f3136, .35, .6), [0, Y + .7, -Wd / 2 + .05]);
  [-2.05, -.68, .68, 2.05].forEach(x => add(sh, box(.12, .04, Wd - .1), mat(0x2f3136, .35, .6), [x, Y + .7, 0])); add(sh, box(L - .1, .5, .03), mat(0x2f3136, .35, .6), [0, Y + .45, -Wd / 2]); add(sh, box(2.2, .03, .04), glow(0x0a84ff, 1), [0, Y + .55, -Wd / 2 - .02]);
  const P = { load: .3 }; let a = 0;
  return {
    root, parts, params: P, view: [.55, .95, 1.0], sliceAxis: 'z', shells: ['shroud', 'heatsink'],
    explode: { shroud: [0, .42, 0], fans: [0, .33, 0], heatsink: [0, .22, 0], 'heat-pipes': [0, .14, 0], 'gpu-chip': [0, .06, 0], vram: [0, .05, 0], 'power-stages': [0, .05, 0], 'power-connector': [.05, .08, -.06], pcb: [0, 0, 0], 'pcie-connector': [0, -.04, .1], 'io-bracket': [-.16, 0, 0], backplate: [0, -.16, 0] },
    update(dt) { a += (1 + P.load * 14) * dt; rotors.forEach((r, i) => r.rotation.y = i % 2 ? -a : a); die.material.emissiveIntensity = P.load * P.load * 1.4; }
  };
}
