import { THREE, model, add, grp, box, cyl, mat, glass, glow, rbox, helix, pcbTex } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const travel = .4, Y0 = .9; // scaled: 4 mm total travel -> .4 units
  const smoke = mat(0x2e2f33, .25, .1, { transparent: true, opacity: .45, depthWrite: false }), clear = mat(0xdde6f0, .1, .1, { transparent: true, opacity: .32, depthWrite: false }), gold = mat(0xd9b45a, .3, .95), steel = mat(0x9aa0a6, .35, .9);
  const pcb = part('pcb'); add(pcb, box(2.6, .08, 2.6), mat(0xffffff, .5, .2, { map: pcbTex('#1d2b52') }), [0, .04, 0]); const led = add(pcb, rbox(.14, .06, .08, .02), glow(0xffffff, .2), [0, .11, -.42]);
  [[-.3, .25], [.25, .45]].forEach(([x, z]) => add(pcb, cyl(.07, .07, .09, 16), gold, [x, .05, z]));
  const pl = part('plate'); [[-.9, 0, .8, 2.4], [.9, 0, .8, 2.4], [0, -.9, 1, .8], [0, .9, 1, .8]].forEach(([x, z, w, d]) => add(pl, box(w, .06, d), steel, [x, .5, z]));
  const bh = part('bottom-housing'); add(bh, box(1.4, .45, 1.4), smoke, [0, .7, 0]); add(bh, cyl(.12, .12, .3, 24), smoke, [0, .35, 0]); [-1, 1].forEach(s => add(bh, cyl(.06, .06, .2, 12), smoke, [s * .5, .42, 0]));
  const pn = part('pins'); [[-.3, .25], [.25, .45]].forEach(([x, z]) => add(pn, box(.05, .55, .05), gold, [x, .35, z]));
  const ct = part('contacts'), leafA = grp(ct, [-.15, .95, .42]), leafB = grp(ct, [.15, .95, .48]);
  add(leafA, box(.06, .5, .2), gold, [0, 0, 0]); add(leafB, box(.04, .44, .16), gold, [0, 0, 0]);
  const sp = part('spring'), spring = add(sp, helix(.17, .7, 7, .018), steel, [0, Y0 + .1, 0]);
  const st = part('stem'), stem = grp(st), red = mat(0xd4382c, .35, .05);
  add(stem, box(.5, .3, .5), red, [0, 1.3, 0]); add(stem, box(.08, .38, .3), red, [0, 1.62, 0]); add(stem, box(.3, .38, .08), red, [0, 1.62, 0]); add(stem, cyl(.08, .08, .5, 16), red, [0, 1.0, 0]); add(stem, box(.12, .25, .1), red, [0, 1.15, .3]);
  const th = part('top-housing'); add(th, box(1.4, .35, 1.4), clear, [0, 1.12, 0]); add(th, box(.62, .08, .62), clear, [0, 1.33, 0]);
  const kc = part('keycap'), cap = grp(kc), cg = new THREE.CylinderGeometry(.86, 1.16, .7, 4, 1); cg.rotateY(Math.PI / 4);
  add(cap, cg, mat(0xf2f2f4, .55, .05), [0, 2.05, 0]); add(cap, cyl(.55, .55, .02, 32), mat(0xe2e2e6, .6), [0, 2.4, 0]); add(cap, box(.1, .4, .1), mat(0xe9e9ec, .6), [0, 1.75, 0]);
  const P = { press: 0 };
  function pose() {
    const d = P.press * travel; stem.position.y = -d; cap.position.y = -d;
    const k = (.7 - d) / .7; spring.scale.y = k; spring.position.y = Y0 + .1 - d / 2;
    const on = P.press >= .5; leafB.rotation.z = on ? -.12 : 0; leafB.position.x = on ? .1 : .15; led.material.emissiveIntensity = on ? 3 : .15;
  }
  pose();
  return {
    root, parts, ogK: 1.6, params: P, view: [.8, .55, 1.1], sliceAxis: 'z', shells: ['top-housing', 'bottom-housing', 'keycap'],
    explode: { keycap: [0, .36, 0], stem: [0, .26, 0], 'top-housing': [0, .17, .12], spring: [0, .12, -.14], contacts: [.12, .02, .2], 'bottom-housing': [0, 0, 0], pins: [0, -.1, .1], plate: [0, -.12, 0], pcb: [0, -.22, 0] },
    actuated: () => P.press >= .5,
    update() { pose(); }
  };
}
