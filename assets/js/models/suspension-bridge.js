import { THREE, model, add, grp, box, cyl, mat, tube, rod } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const span = 8, side = 3, deckY = 1.0, top = 4.3, sag = 1.45, zc = .62, conc = mat(0xbdb9b2, .85), red = mat(0xc0392b, .55, .3), steel = mat(0x7d838a, .35, .8);
  const cableY = x => { const a = Math.abs(x); if (a <= span / 2) { const u = x / (span / 2); return sag + (top - sag) * u * u; } const u = (a - span / 2) / side; return top - (top - .75) * u + -.35 * Math.sin(u * Math.PI); };
  const tw = part('towers');
  [-span / 2, span / 2].forEach(x => { [-zc, zc].forEach(z => add(tw, box(.22, top + .2, .22), red, [x, (top + .2) / 2, z])); [1.5, 2.8, top + .05].forEach(y => add(tw, box(.18, .2, zc * 2), red, [x, y, 0])); add(tw, box(.6, .3, 1.6), conc, [x, .15, 0]); });
  const mc = part('main-cables'), cm = mat(0x9a3328, .45, .4), xEnd = span / 2 + side;
  [-zc, zc].forEach(z => { const pts = []; for (let i = 0; i <= 80; i++) { const x = -xEnd + i / 80 * xEnd * 2; pts.push([x, cableY(x), z]); } add(mc, tube(pts, .05, 160, 8), cm); });
  const hg = part('hangers');
  for (let x = -xEnd + .5; x < xEnd - .3; x += .45) { if (Math.abs(Math.abs(x) - span / 2) < .2) continue; const y = cableY(x); if (y - deckY < .15) continue; [-zc, zc].forEach(z => rod(hg, [x, deckY + .1, z], [x, y, z], .012, steel, 5)); }
  const dk = part('deck'), road = mat(0x3a3a3c, .8), truss = mat(0x8a8f96, .4, .7);
  add(dk, box(xEnd * 2, .08, zc * 2 + .2), road, [0, deckY + .1, 0]); add(dk, box(xEnd * 2, .06, zc * 2), mat(0xf5f5f7, .9), [0, deckY + .15, 0], [0, 0, 0], [1, .2, .05]);
  [-zc, zc].forEach(z => { add(dk, box(xEnd * 2, .2, .05), truss, [0, deckY - .02, z]); for (let x = -xEnd + .25; x < xEnd; x += .5) add(dk, box(.03, .24, .03), truss, [x, deckY - .02, z], [0, 0, .6]); });
  const an = part('anchorages');
  [-1, 1].forEach(s => { add(an, box(1.2, .9, 1.9), conc, [s * (xEnd + .45), .45, 0]); add(an, box(.9, .3, 1.6), conc, [s * (xEnd + .3), 1.0, 0]); });
  return { root, parts, view: [.55, .38, 1.15], sliceAxis: 'x', explode: { towers: [0, .1, -.06], 'main-cables': [0, .24, .04], hangers: [0, .13, .1], deck: [0, -.05, .22], anchorages: [0, -.06, -.2] } };
}
