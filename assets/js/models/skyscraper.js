import { THREE, model, add, grp, box, cyl, mat, glass, S } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const F = 16, fh = .42, W = 2.6, base = .35, H = F * fh, conc = mat(0xc4c1bb, .85), steel = mat(0x8e949b, .35, .8);
  const pl = part('piles'); add(pl, box(W + .6, .35, W + .6), mat(0xa9a6a0, .9), [0, base - .175, 0]);
  for (let i = -1.5; i <= 1.5; i++) for (let j = -1.5; j <= 1.5; j++) add(pl, cyl(.09, .09, 2.2, 12), mat(0x9f9c96, .9), [i * .85, base - .35 - 1.1, j * .85]);
  const co = part('core'), c = .5, t = .09;
  [[0, c], [0, -c], [c, 0], [-c, 0]].forEach(([x, z]) => add(co, box(x ? t : c * 2 + t, H + .5, z ? t : c * 2 + t), conc, [x, base + (H + .5) / 2, z]));
  add(co, box(t, H + .5, c * 2), conc, [0, base + (H + .5) / 2, 0]);
  const cols = part('columns'); const pos = []; for (let i = 0; i < 4; i++) { const a = -W / 2 + .12 + i * (W - .24) / 3; pos.push([a, -W / 2 + .12], [a, W / 2 - .12]); if (i > 0 && i < 3) pos.push([-W / 2 + .12, a], [W / 2 - .12, a]); }
  pos.forEach(([x, z]) => add(cols, box(.11, H, .11), steel, [x, base + H / 2, z]));
  cols.userData.spread = .5; cols.userData.spreadMask = [1, 0, 1];
  const fp = part('floor-plates'), slab = mat(0xdedbd5, .85), o = W / 2, hole = c + t / 2;
  for (let f = 0; f <= F; f++) {
    const y = base + f * fh, g = grp(fp, [0, y, 0]);
    add(g, box(W, .06, o - hole), slab, [0, 0, (o + hole) / 2]); add(g, box(W, .06, o - hole), slab, [0, 0, -(o + hole) / 2]);
    add(g, box(o - hole, .06, hole * 2), slab, [(o + hole) / 2, 0, 0]); add(g, box(o - hole, .06, hole * 2), slab, [-(o + hole) / 2, 0, 0]);
  }
  fp.userData.spread = .9; fp.userData.spreadMask = [0, 1, 0];
  const cw = part('curtain-wall'), gl = glass(0x7fb4e6, .32), mul = mat(0x3a3d42, .4, .7);
  [[[0, 0, o + .05], 0], [[0, 0, -o - .05], 0], [[o + .05, 0, 0], 1], [[-o - .05, 0, 0], 1]].forEach(([p, r]) => {
    const face = grp(cw, p);
    const g = add(face, box(W + .1, H, .02), gl, [0, base + H / 2, 0], [0, r ? Math.PI / 2 : 0, 0]); g.renderOrder = 2;
    for (let k = 0; k <= 6; k++) add(face, box(.025, H, .04), mul, r ? [0, base + H / 2, -W / 2 - .05 + k * (W + .1) / 6] : [-W / 2 - .05 + k * (W + .1) / 6, base + H / 2, 0]);
    for (let f = 0; f <= F; f += 2) add(face, r ? box(.04, .03, W + .1) : box(W + .1, .03, .04), mul, [0, base + f * fh, 0]);
  });
  cw.userData.spread = .8; cw.userData.spreadMask = [1, 0, 1];
  const el = part('elevators'), car = mat(0xe8c26a, .4, .6), rope = mat(0x333333, .6, .5), cars = [];
  [-.25, .25].forEach((x, i) => { const g = grp(el, [x, base + 1, i ? .25 : -.25]); add(g, box(.32, .38, .32), car); add(g, cyl(.01, .01, H, 6), rope, [0, H / 2, 0]); cars.push(g); });
  return {
    root, parts, view: [1, .5, 1.25], shells: ['curtain-wall'], params: { speed: 1 },
    explode: { piles: [0, -.1, 0], core: [0, 0, 0], columns: [0, 0, 0], 'floor-plates': [0, 0, 0], 'curtain-wall': [0, 0, 0], elevators: [0, .05, .25] },
    update(dt, t) { cars.forEach((g, i) => { const k = (Math.sin(t * .35 + i * 2.1) + 1) / 2; g.position.y = base + .25 + k * (H - .9); const len = Math.max(.05, base + H + .3 - g.position.y - .19), r = g.children[1]; r.scale.y = len / H; r.position.y = .19 + len / 2; }); }
  };
}
