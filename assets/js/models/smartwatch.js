import { THREE, model, add, grp, box, cyl, mat, glass, glow, tor, rbox, band, screenTex, pcbTex, smd, sph, merge, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const W = 1.1, L = 1.3, R = .28, Y = .5;
  const steel = mat(0xc4c9cf, .25, .95), dark = mat(0x1c1d20, .45, .3), chip = mat(0x2a2b2f, .35, .4);
  const bd = part('band'), rub = mat(0x2d6a8a, .75, 0), clasp = mat(0xb9bec4, .3, .9);
  [-1, 1].forEach(s => { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([Y - .02 - Math.pow(u, 2) * .55, s * (L / 2 + .1 + u * 1.6 - Math.pow(u, 3) * .25)]); }
    const segs = []; for (let i = 0; i < 16; i++) { const [y0, z0] = pts[i], [y1, z1] = pts[i + 1], len = Math.hypot(y1 - y0, z1 - z0) + .012, g = new THREE.BoxGeometry(.86, .05, len); g.rotateX(-Math.atan2(y1 - y0, z1 - z0)); g.translate(0, (y0 + y1) / 2, (z0 + z1) / 2); segs.push(g); }
    add(bd, merge(segs), rub); if (s > 0) for (let i = 6; i < 15; i += 2) { const [y, z] = pts[i]; add(bd, cyl(.035, .035, .056, 12), dark, [0, y, z], [-Math.atan2(pts[i + 1][0] - y, pts[i + 1][1] - z), 0, 0]); }
    add(bd, box(.88, .07, .06), clasp, [0, Y - .02, s * (L / 2 + .04)]); });
  const cs = part('case'); band(cs, W, L, .3, R, .05, steel, Y); add(cs, box(W - .1, .02, L - .1), mat(0xa8adb3, .35, .9), [0, Y - .11, 0]);
  const cr = part('crown'); add(cr, cyl(.09, .09, .1, 32), steel, [W / 2 + .05, Y + .03, .25], [0, 0, Math.PI / 2]); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; add(cr, box(.1, .012, .012), steel, [W / 2 + .05, Y + .03 + Math.cos(a) * .09, .25 + Math.sin(a) * .09]); }
  add(cr, cyl(.03, .03, .1, 12), dark, [W / 2 - .02, Y + .03, .25], [0, 0, Math.PI / 2]); add(cr, rbox(.04, .07, .3, .02), steel, [W / 2 + .015, Y, -.15]);
  const bt = part('battery'); add(bt, rbox(.8, .07, .55, .1), mat(0x2b2d33, .5, .3), [0, Y - .04, -.18]); add(bt, box(.6, .002, .4), mat(0xe8e8ea, .7), [0, Y - .004, -.18]);
  const lg = part('logic-module'), pt = pcbTex('#1a2f4a'); add(lg, rbox(.7, .05, .4, .03), mat(0x3a3d44, .4, .5), [0, Y + .03, .2]); add(lg, box(.68, .01, .38), mat(0xffffff, .5, .2, { map: pt }), [0, Y + .06, .2]); smd(lg, MOBILE ? 20 : 50, -.3, .3, .05, .35, Y + .065, chip, .02);
  const hp = part('haptic'); add(hp, rbox(.3, .06, .12, .03), mat(0x9aa0a8, .35, .85), [.25, Y - .04, .26]);
  const sk = part('speaker-mic'); add(sk, rbox(.12, .05, .3, .02), dark, [-.42, Y - .02, .1]); for (let i = 0; i < 4; i++) add(sk, cyl(.012, .012, .04, 8), dark, [-W / 2, Y - .02, -.02 + i * .07], [0, 0, Math.PI / 2]);
  const sn = part('sensors'); const back = add(sn, sph(.5, 40), mat(0x15171a, .15, .4), [0, Y - .15, 0], [0, 0, 0], [1, .22, 1.1]); back.geometry = new THREE.SphereGeometry(.5, 40, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  add(sn, tor(.2, .015, 6, 40), mat(0x6d7178, .3, .9), [0, Y - .24, 0], [Math.PI / 2, 0, 0]);
  [[.08, 0], [-.08, 0], [0, .08], [0, -.08]].forEach(([x, z]) => add(sn, sph(.025, 10), glow(0x30d158, 1.2), [x, Y - .255, z]));
  [[.12, .12], [-.12, -.12]].forEach(([x, z]) => add(sn, sph(.02, 8), mat(0x332222, .3, 0, { emissive: 0x551111, emissiveIntensity: .6 }), [x, Y - .255, z]));
  const dp = part('display'); add(dp, rbox(W - .1, .02, L - .1, R - .05), mat(0x050506, .3, .2, { emissive: 0xffffff, emissiveMap: screenTex('watch'), emissiveIntensity: .9 }), [0, Y + .14, 0]);
  const cy = part('crystal'); const c = add(cy, rbox(W, .06, L, R, 4), glass(0xe6eef8, .2), [0, Y + .17, 0]); c.renderOrder = 3;
  return {
    root, parts, view: [.6, .9, 1.0], sliceAxis: 'x', shells: ['case', 'crystal'],
    peel: ['crystal', 'display', 'logic-module', 'battery', 'haptic', 'speaker-mic', 'crown', 'sensors', 'case', 'band'],
    explode: { crystal: [0, .45, 0], display: [0, .33, 0], 'logic-module': [0, .2, .1], battery: [0, .08, -.12], haptic: [.15, .1, .1], 'speaker-mic': [-.18, .06, 0], crown: [.25, .05, 0], sensors: [0, -.25, 0], case: [0, 0, 0], band: [0, -.1, 0] }
  };
}
