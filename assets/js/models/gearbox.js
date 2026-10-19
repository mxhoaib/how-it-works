import { THREE, model, add, grp, box, cyl, mat, gear } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const m = .1, pairs = [[12, 30], [18, 24], [24, 18]], gx = [-1.0, 0, 1.0], cd = m * 42 / 2, Y = 1.75, zi = -cd / 2, zo = cd / 2;
  const steel = mat(0xb9bdc3, .3, .9), dark = mat(0x55595f, .45, .7), gold = mat(0xc9a25a, .35, .8), alu = mat(0x9fa4aa, .5, .5, { transparent: true, opacity: .9 });
  const hs = part('housing');
  add(hs, box(3.4, .12, 3.6), alu, [0, .06, 0]); add(hs, box(3.4, 3.4, .12), alu, [0, 1.75, -1.8]);
  add(hs, box(.12, 3.4, 3.6), alu, [-1.7, 1.75, 0]); add(hs, box(.12, .9, 3.6), alu, [1.7, .45, 0]);
  [-1.62, 1.62].forEach(x => [zi, zo].forEach(z => add(hs, cyl(.32, .32, .1, 32), dark, [x, Y, z], [0, 0, Math.PI / 2])));
  const ish = part('input-shaft'), osh = part('output-shaft'), dg = part('drive-gears'), dn = part('driven-gears'), br = part('bearings'), sf = part('selector');
  const iS = grp(ish, [0, Y, zi]); add(iS, cyl(.09, .09, 4.4, 20), steel, [-.3, 0, 0], [0, 0, Math.PI / 2]); add(iS, box(.3, .14, .14), steel, [-2.4, 0, 0]);
  const oS = grp(osh, [0, Y, zo]); add(oS, cyl(.09, .09, 4.4, 20), steel, [.3, 0, 0], [0, 0, Math.PI / 2]); add(oS, cyl(.18, .18, .12, 6), dark, [2.45, 0, 0], [0, 0, Math.PI / 2]);
  const din = [], dout = [];
  pairs.forEach(([a, b], i) => {
    const g1 = grp(dg, [gx[i], Y, zi], [0, Math.PI / 2, 0]); add(g1, gear(a, m, .26, .09), i === 0 ? gold : steel); din.push({ g: g1, z: a });
    const g2 = grp(dn, [gx[i], Y, zo], [0, Math.PI / 2, 0]); add(g2, gear(b, m, .26, .09), i === 0 ? gold : steel); dout.push({ g: g2, z: b, a });
  });
  [-1.55, 1.55].forEach(x => [zi, zo].forEach(z => { add(br, cyl(.22, .22, .1, 24), mat(0x2c2c2e, .4, .8), [x, Y, z], [0, 0, Math.PI / 2]); add(br, cyl(.14, .14, .11, 24), steel, [x, Y, z], [0, 0, Math.PI / 2]); }));
  add(sf, cyl(.05, .05, 3.2, 12), steel, [0, 3.0, zo + .2], [0, 0, Math.PI / 2]);
  const fk = grp(sf, [-.55, 3.0, zo + .2]); add(fk, box(.12, .5, .12), gold, [0, -.25, 0]); add(fk, box(.06, .4, .5), gold, [0, -.55, -.2]);
  add(sf, cyl(.2, .2, .14, 24), gold, [-.55, Y, zo], [0, 0, Math.PI / 2]);
  const P = { rpm: 30 }; let th = 0;
  return {
    root, parts, params: P, view: [.6, .55, 1.25], sliceAxis: 'z', shells: ['housing'],
    explode: { housing: [0, -.06, -.2], 'input-shaft': [0, .02, -.1], 'drive-gears': [0, .14, -.18], 'driven-gears': [0, .14, .18], 'output-shaft': [0, .02, .1], bearings: [0, -.1, 0], selector: [0, .3, .18] },
    update(dt) {
      th += P.rpm / 60 * Math.PI * 2 * dt;
      iS.rotation.x = th; din.forEach(d => d.g.rotation.z = th);
      const ws = -th * pairs[0][0] / pairs[0][1]; oS.rotation.x = ws;
      dout.forEach((d, i) => d.g.rotation.z = -th * d.a / d.z + Math.PI / d.z);
    }
  };
}
