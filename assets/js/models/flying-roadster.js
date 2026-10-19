import { THREE, model, add, grp, box, cyl, mat, glow, glass, tor, sph, bladeRing, rod, S } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const paint = mat(0x1d1d1f, .25, .7), pearl = mat(0xeef0f3, .25, .5), steel = mat(0x8b9097, .35, .85), cyan = 0x64d2ff;
  const bo = part('body'); add(bo, sph(1, 40), pearl, [0, 1.0, 0], [0, 0, .02], [2.15, .4, .6]); add(bo, box(.5, .5, .04), pearl, [-1.8, 1.4, 0], [0, 0, .5]);
  add(bo, box(.04, .04, .9), glow(0xffffff, 2), [2.1, 1.0, 0]);
  const ca = part('canopy'); const c = add(ca, sph(1, 32, ), glass(0x2a3a4a, .55), [.55, 1.28, 0], [0, 0, -.05], [.95, .36, .44]); c.renderOrder = 3;
  const bt = part('battery'); add(bt, box(1.7, .14, .62), mat(0x2b3a55, .45, .5), [-.1, .7, 0]); for (let i = 0; i < 5; i++) add(bt, box(.3, .02, .55), mat(0x4f7cd6, .4, .5), [-.8 + i * .35, .78, 0]);
  const wi = part('wings'); add(wi, box(1.0, .05, 3.0), paint, [-1.25, .98, 0], [0, 0, 0]); add(wi, box(.62, .045, 2.6), paint, [1.3, .92, 0]);
  const fpos = [[1.3, .95, 1.32], [1.3, .95, -1.32], [-1.25, 1.0, 1.55], [-1.25, 1.0, -1.55]];
  const df = part('ducted-fans'), rotors = [];
  fpos.forEach(p => { const g = grp(df, p); add(g, tor(.42, .06, 10, 40), paint, [0, 0, 0], [Math.PI / 2, 0, 0]); add(g, cyl(.42, .42, .16, 40, true), mat(0x2c2c2e, .4, .6)); const r = grp(g); r.rotation.z = Math.PI / 2; const rr = grp(r); add(rr, bladeRing(7, .06, .38, .1, .015, .7), steel); add(g, cyl(.07, .07, .14, 16), steel); rotors.push(rr);
    add(g, box(.04, .04, .8), steel, [0, 0, 0]); });
  const th = part('thrusters'), glows = [];
  [-.32, .32].forEach(z => { add(th, cyl(.17, .2, .55, 28, true), steel, [-2.05, 1.08, z], [0, 0, Math.PI / 2]); const g = add(th, cyl(.15, .15, .02, 24), glow(cyan, 1.2), [-2.3, 1.08, z], [0, 0, Math.PI / 2]); glows.push(g); add(th, tor(.19, .025, 8, 28), paint, [-2.32, 1.08, z], [0, Math.PI / 2, 0]); });
  const lg = part('landing-gear'); [[1.4, 0], [-.9, .5], [-.9, -.5]].forEach(([x, z]) => { rod(lg, [x, .14, z], [x * .95, .66, z * .6], .03, steel, 8); add(lg, cyl(.14, .14, .08, 20), mat(0x18181a, .9), [x, .14, z], [Math.PI / 2, 0, 0]); });
  const P = { fan: 3, glow: .3 }; let a = 0;
  return {
    root, parts, params: P, view: [.7, .45, 1.2], sliceAxis: 'z', shells: ['body'],
    explode: { body: [0, 0, 0], canopy: [.05, .22, 0], battery: [0, -.18, 0], wings: [0, .06, 0], 'ducted-fans': [0, .14, 0], thrusters: [-.22, 0, 0], 'landing-gear': [0, -.15, 0] },
    update(dt, t) { a += P.fan * dt; rotors.forEach((r, i) => r.rotation.x = i % 2 ? a : -a); glows.forEach(g => g.material.emissiveIntensity = P.glow * (1 + Math.sin(t * 30) * .08)); }
  };
}
