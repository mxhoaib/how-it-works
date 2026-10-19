import { THREE, model, add, grp, box, cyl, mat, glow, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const alu = mat(0x2b2d31, .5, .6), steel = mat(0xc9ccd1, .25, .9), blk = mat(0x1c1c1e, .5, .3), brass = mat(0xd4a73c, .3, .9), red = mat(0xd23b2f, .5, .3);
  const G = 1.6; // default gantry height (rail height)
  const fr = part('frame');
  [[-1.45, -1.3], [1.45, -1.3], [-1.45, 1.3], [1.45, 1.3]].forEach(([x, z]) => add(fr, box(.12, .2, .12), alu, [x, .1, z]));
  [-1.3, 1.3].forEach(z => add(fr, box(3.0, .12, .12), alu, [0, .16, z])); [-1.45, 1.45].forEach(x => add(fr, box(.12, .12, 2.7), alu, [x, .16, 0]));
  [-1.45, 1.45].forEach(x => { add(fr, box(.12, 3.2, .12), alu, [x, 1.76, 0]); }); add(fr, box(3.02, .12, .12), alu, [0, 3.36, 0]);
  [-1.45, 1.45].forEach(x => add(fr, box(.08, .08, 1.0), alu, [x, .55, 0], [0, 0, 0]));
  const ls = part('lead-screws');
  [-1.25, 1.25].forEach(x => { add(ls, cyl(.03, .03, 2.9, 10), brass, [x, 1.85, .08]); add(ls, cyl(.02, .02, 2.9, 8), steel, [x, 1.85, -.08]); });
  const st = part('steppers'), mot = (p, x, y, z, r = [0, 0, 0]) => { const g = grp(p, [x, y, z], r); add(g, box(.32, .32, .32), blk); add(g, box(.33, .05, .33), steel, [0, .16, 0]); add(g, box(.33, .05, .33), steel, [0, -.16, 0]); add(g, cyl(.04, .04, .14, 8), steel, [0, .23, 0]); return g; };
  [-1.25, 1.25].forEach(x => mot(st, x, .38, .08)); mot(st, 0, .38, -1.18, [Math.PI / 2, 0, 0]);
  const xMot = mot(st, -1.25, G + .02, .25, [Math.PI / 2, 0, 0]);
  const ga = part('gantry'), gA = grp(ga);
  [-.06, .1].forEach(dy => add(gA, cyl(.025, .025, 2.5, 10), steel, [0, G + dy, 0], [0, 0, Math.PI / 2]));
  [-1.25, 1.25].forEach(x => add(gA, box(.26, .34, .3), blk, [x, G + .02, 0]));
  const be = part('belts'), xBelt = grp(be), bm = mat(0x111111, .8);
  add(xBelt, box(2.4, .012, .02), bm, [0, G + .1, .2]); add(xBelt, box(2.4, .012, .02), bm, [0, G - .06, .2]);
  add(be, box(.02, .012, 2.3), bm, [0, .3, 0]); add(be, box(.02, .012, 2.3), bm, [0, .22, 0]);
  const he = part('hotend'), hA = grp(he);
  add(hA, box(.36, .36, .14), mat(0xf2f2f4, .5, .2), [0, G + .02, .12]);
  for (let i = 0; i < 6; i++) add(hA, cyl(.11, .11, .02, 20), steel, [0, G - .2 - i * .04, .2]);
  add(hA, box(.18, .1, .16), mat(0xbfc3c8, .4, .8), [0, G - .45, .2]); const tip = add(hA, cyl(.012, .05, .09, 12), brass, [0, G - .54, .2]);
  const heat = add(hA, box(.185, .03, .165), glow(0xff3b30, .0), [0, G - .43, .2]);
  add(hA, box(.04, .2, .2), mat(0x3a7bd5, .6), [.13, G - .26, .2]);
  const ex = part('extruder'), eA = grp(ex);
  add(eA, box(.26, .2, .26), blk, [0, G + .32, .2]); add(eA, cyl(.06, .06, .1, 16), red, [0, G + .3, .36], [Math.PI / 2, 0, 0]);
  add(eA, cyl(.012, .012, 1.1, 6), mat(0x30d158, .5), [0, G + .95, .2]);
  const bd = part('bed'), bA = grp(bd), N = MOBILE ? 24 : 40, h = .9 / N, layers = [], fil = mat(0x30d158, .55, .05);
  add(bA, box(1.2, .05, 2.4), alu, [0, .45, 0]); add(bA, box(2.2, .06, 2.2), mat(0x8c939b, .35, .8), [0, .55, 0]); add(bA, box(2.1, .006, 2.1), mat(0x222428, .6, .3), [0, .583, 0]);
  const pr = grp(bA, [0, .586, 0]), rr = k => .42 + .1 * Math.sin(k / N * Math.PI * 1.6);
  for (let k = 0; k < N; k++) { const m = add(pr, cyl(rr(k), rr(k + 1), h * .96, 6), fil, [0, h * (k + .5), 0], [0, k / N * .9, 0]); layers.push(m); }
  const P = { print: null, speed: 1 };
  function pose(gz, hx, bz) { gA.position.y = gz - G; xBelt.position.y = gz - G; xMot.position.y = gz + .02; hA.position.set(hx, gz - G, 0); eA.position.set(hx, gz - G, 0); bA.position.z = bz; }
  pose(2.2, 0, 0);
  let idle = 0;
  return {
    root, parts, params: P, view: [.9, .55, 1.25], sliceAxis: 'z', layerCount: N,
    explode: { frame: [0, 0, -.18], 'lead-screws': [0, 0, -.1], steppers: [0, -.1, -.2], gantry: [0, .12, .08], belts: [0, .04, .22], hotend: [0, .16, .3], extruder: [0, .3, .3], bed: [0, -.12, .3] },
    update(dt, t) {
      if (P.print == null) { layers.forEach(l => l.visible = true); heat.material.emissiveIntensity = 0; idle += dt; pose(2.2, Math.sin(idle * .6) * .7, Math.cos(idle * .4) * .3); return; }
      const f = Math.min(N, P.print * N), k = Math.floor(f), u = f - k;
      layers.forEach((l, i) => l.visible = i < k);
      if (k >= N) { pose(2.2, 0, 0); heat.material.emissiveIntensity = 0; return; }
      const a = u * Math.PI * 2 + k / N * .9, r = (rr(k) + rr(k + 1)) / 2;
      const gz = .586 + h * (k + 1) + .585; pose(gz, Math.cos(a) * r, .2 - Math.sin(a) * r);
      heat.material.emissiveIntensity = 1.4 + Math.sin(t * 9) * .3;
      if (u > .02) { layers[k].visible = true; layers[k].scale.set(1, 1, 1); }
    }
  };
}
