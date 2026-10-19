import { THREE, model, add, grp, box, cyl, mat, glass, glow, tor, rbox, band, screenTex, pcbTex, smd, bladeRing, tube, merge, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const W = 3.2, D = 2.2, alu = mat(0xb8bdc4, .35, .9), dark = mat(0x1c1d20, .45, .3), chip = mat(0x2a2b2f, .35, .4), cu = mat(0xc77b43, .3, .95);
  const HZ = -D / 2 + .05, HY = .18; // hinge line
  const bc = part('bottom-case'); add(bc, rbox(W, .03, D, .08), alu, [0, .015, 0]); band(bc, W, D, .1, .1, .03, alu, .075); [[-1.2, -.8], [1.2, -.8], [-1.2, .8], [1.2, .8]].forEach(([x, z]) => add(bc, cyl(.07, .07, .02, 16), dark, [x, -.005, z]));
  const bt = part('battery'); for (let i = 0; i < 6; i++) add(bt, rbox(.44, .05, .75, .03), mat(0x2b2d33, .5, .3), [-1.15 + i * .46, .06, .55]); add(bt, box(2.8, .005, .1), cu, [0, .09, .12]);
  const lb = part('logic-board'), pt = pcbTex('#123b2c'); add(lb, box(1.5, .02, .7), mat(0xffffff, .5, .2, { map: pt }), [-.3, .06, -.5]); smd(lb, MOBILE ? 40 : 110, -1.0, .4, -.82, -.18, .07, mat(0x6b6e74, .4, .6), .025);
  [[-.75, -.35], [-.75, -.65], [.15, -.7]].forEach(([x, z]) => add(lb, box(.22, .03, .16), chip, [x, .085, z]));
  const pr = part('processor'); add(pr, box(.42, .03, .42), mat(0x2f6d3f, .5, .2), [-.25, .085, -.5]); add(pr, box(.28, .03, .3), mat(0x3a3e47, .2, .7), [-.25, .11, -.5]);
  const co = part('cooling'); add(co, tube([[-.25, .115, -.5], [.2, .115, -.55], [.7, .115, -.6], [1.05, .11, -.75]], .028, 30, 8), cu); add(co, box(.45, .02, .45), cu, [-.25, .132, -.5]);
  const fan = grp(co, [1.15, .095, -.55]); add(fan, cyl(.38, .38, .08, 40, true), dark); const rot = grp(fan); add(rot, bladeRing(17, .1, .34, .12, .012, .8), mat(0x3a3c40, .5, .2), [0, 0, 0], [0, 0, Math.PI / 2]); add(rot, cyl(.1, .1, .08, 24), dark);
  const fins = []; for (let i = 0; i < 22; i++) { const g = new THREE.BoxGeometry(.012, .08, .3); g.translate(.9 + i * .02, .1, -.98); fins.push(g); } add(co, merge(fins), cu);
  const spk = part('speakers'); [-1.4, 1.4].forEach(x => { add(spk, rbox(.28, .07, 1.0, .03), dark, [x, .065, -.05]); add(spk, cyl(.08, .08, .072, 20), mat(0x6d7178, .4, .7), [x, .065, -.05]); });
  const tc = part('top-case'); add(tc, box(W - .02, .02, D - .02), alu, [0, .15, 0]);
  const kb = part('keyboard'), keys = [], cols = 14, kw = .17, gap = .025;
  for (let r = 0; r < 6; r++) { const n = r === 5 ? 9 : cols; for (let c = 0; c < n; c++) { let w = kw; if (r === 5 && c === 4) w = kw * 5.2; const x = -1.4 + (r === 5 && c > 4 ? c + 4.2 : c) * (kw + gap) + w / 2; if (x + w / 2 > 1.42) continue; const g = new THREE.BoxGeometry(w, .025, r === 0 ? .1 : kw); g.translate(x, .175, -.85 + r * (kw + gap) + (r === 0 ? -.03 : 0)); keys.push(g); } }
  add(kb, merge(keys), mat(0x202124, .6, .1)); add(kb, box(2.9, .004, 1.2), mat(0x3a3c40, .6), [0, .162, -.33]);
  const tp = part('trackpad'); add(tp, rbox(1.3, .02, .72, .04), mat(0xc8ccd2, .15, .5), [0, .166, .62]);
  const hg = part('hinge'); add(hg, cyl(.07, .07, 2.4, 24), dark, [0, HY, HZ], [0, 0, Math.PI / 2]);
  const ports = part('ports'); [[-W / 2 + .05, -.1], [-W / 2 + .05, -.4], [W / 2 - .05, -.25]].forEach(([x, z]) => add(ports, rbox(.08, .05, .16, .02), mat(0x55585e, .3, .8), [x, .08, z]));
  // lid (pivot at the hinge)
  const lidP = grp(part('lid'), [0, HY, HZ]), dspP = grp(part('display'), [0, HY, HZ]);
  add(lidP, rbox(W, .035, D - .05, .08), alu, [0, -.02, -(D - .05) / 2 + .05], [0, 0, 0]);
  add(dspP, box(W - .12, .02, D - .2), mat(0x050506, .3, .2, { emissive: 0xffffff, emissiveMap: screenTex('laptop'), emissiveIntensity: .9 }), [0, .01, -(D - .05) / 2 + .08]);
  add(dspP, cyl(.02, .02, .01, 12), mat(0x050510, .1, .3), [0, .02, -D + .12]);
  const P = { lid: 1.25, fan: 4 }; let a = 0;
  function pose() { lidP.rotation.x = P.lid; dspP.rotation.x = P.lid; } // 0 = lid flat behind, PI = closed
  pose();
  return {
    root, parts, params: P, view: [.35, .7, 1.25], sliceAxis: 'x', shells: ['bottom-case', 'top-case', 'lid'],
    peel: ['keyboard', 'trackpad', 'top-case', 'cooling', 'processor', 'logic-board', 'speakers', 'battery', 'ports', 'hinge', 'display', 'lid', 'bottom-case'],
    explode: { keyboard: [0, .3, .05], trackpad: [0, .24, .14], 'top-case': [0, .18, 0], cooling: [.06, .12, -.06], processor: [-.04, .09, -.04], 'logic-board': [-.08, .06, -.08], speakers: [0, .06, 0], battery: [0, .03, .12], ports: [0, .02, 0], hinge: [0, .05, -.12], display: [0, .12, -.14], lid: [0, .14, -.22], 'bottom-case': [0, -.12, 0] },
    update(dt) { a += P.fan * dt; rot.rotation.y = a; pose(); }
  };
}
