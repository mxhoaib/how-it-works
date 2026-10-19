import { THREE, model, add, grp, box, cyl, mat, glass, glow, tor, rbox, band, screenTex, pcbTex, smd, sph, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const W = 1.5, L = 3.1, R = .2, Y = .08;
  const alu = mat(0x9fa6ae, .35, .9), dark = mat(0x1c1d20, .45, .3), chip = mat(0x2a2b2f, .35, .4), shield = mat(0xb9bec4, .3, .9), cu = mat(0xc77b43, .35, .9), gasket = mat(0x2e3138, .8, 0);
  const bg = part('back-glass'); add(bg, rbox(W, .03, L, R), mat(0x3a3f47, .12, .3), [0, Y, 0]);
  const cc = part('charging-coil'); for (let i = 0; i < 9; i++) add(cc, tor(.16 + i * .025, .008, 4, 40), cu, [0, Y + .035, -.15], [Math.PI / 2, 0, 0]); add(cc, box(.7, .006, .7), dark, [0, Y + .028, -.15]);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; add(cc, box(.04, .005, .04), mat(0x8a8f96, .4, .8), [Math.cos(a) * .48, Y + .036, -.15 + Math.sin(a) * .48]); }
  const fr = part('frame'); band(fr, W, L, .12, R, .05, alu, Y + .075); add(fr, box(W - .1, .02, L - .1), mat(0x8e959c, .4, .85), [0, Y + .07, 0]);
  [[W / 2 + .01, .6, .25], [W / 2 + .01, -.05, .4], [-W / 2 - .01, .8, .12], [-W / 2 - .01, .45, .2], [-W / 2 - .01, .15, .2]].forEach(([x, z, l]) => add(fr, rbox(.03, .05, l, .012), alu, [x, Y + .075, z]));
  const bt = part('battery'); add(bt, rbox(1.12, .05, 1.65, .03), mat(0x2b2d33, .5, .3), [-.08, Y + .105, -.42]); add(bt, box(.9, .002, 1.2), mat(0xe8e8ea, .7), [-.08, Y + .131, -.42]); add(bt, box(.2, .01, .25), cu, [.35, Y + .13, .45]);
  const lb = part('logic-board'), pt = pcbTex('#123b2c'); add(lb, box(.5, .02, 1.15), mat(0xffffff, .5, .2, { map: pt }), [.42, Y + .1, .82]); add(lb, box(.6, .02, .3), mat(0xffffff, .5, .2, { map: pt }), [-.05, Y + .1, 1.25]);
  add(lb, box(.3, .03, .3), chip, [.42, Y + .125, .75]); add(lb, box(.22, .015, .22), mat(0x55585e, .3, .6), [.42, Y + .147, .75]); add(lb, box(.16, .025, .2), chip, [.42, Y + .12, 1.08]); add(lb, box(.36, .03, .3), shield, [.42, Y + .125, .42]);
  smd(lb, MOBILE ? 30 : 80, .2, .64, .3, 1.36, Y + .11, mat(0x6b6e74, .4, .6), .018);
  const cam = part('camera'); add(cam, rbox(.62, .04, .62, .12), mat(0x30343b, .2, .4), [-.38, Y - .005, 1.1]);
  [[-.52, .96], [-.24, .96], [-.52, 1.24]].forEach(([x, z]) => { add(cam, cyl(.12, .12, .07, 32), mat(0x1a1b1e, .3, .7), [x, Y - .02, z]); add(cam, cyl(.09, .09, .072, 32), mat(0x0b1020, .05, .3), [x, Y - .02, z]); add(cam, tor(.11, .012, 6, 32), alu, [x, Y - .055, z], [Math.PI / 2, 0, 0]); add(cam, cyl(.07, .07, .12, 24), dark, [x, Y + .06, z]); });
  add(cam, sph(.03, 12), glow(0xfff2c4, .3), [-.24, Y - .03, 1.24]);
  const sp = part('speaker'); add(sp, rbox(.5, .05, .22, .02), dark, [-.35, Y + .1, -1.38]); add(sp, cyl(.07, .07, .052, 24), mat(0x6d7178, .4, .7), [-.35, Y + .1, -1.38]);
  for (let i = 0; i < 6; i++) add(sp, cyl(.012, .012, .03, 8), dark, [-.5 + i * .06, Y + .075, -L / 2], [Math.PI / 2, 0, 0]);
  const hm = part('haptic-motor'); add(hm, rbox(.42, .05, .16, .02), mat(0x9aa0a8, .35, .85), [.42, Y + .1, -1.2]); add(hm, box(.36, .052, .02), dark, [.42, Y + .1, -1.2]);
  const up = part('usb-port'); add(up, rbox(.3, .06, .14, .025), mat(0xb8bcc2, .3, .9), [0, Y + .075, -L / 2 + .06]); add(up, box(.22, .025, .1), dark, [0, Y + .075, -L / 2 + .02]);
  const se = part('seals'); band(se, W - .04, L - .04, .012, R - .02, .03, gasket, Y + .142); [[-.35, -1.5], [0, -1.5]].forEach(([x, z]) => add(se, tor(.05, .012, 6, 18), gasket, [x, Y + .075, z]));
  [[W / 2 - .01, .6], [-W / 2 + .01, .15]].forEach(([x, z]) => add(se, box(.02, .07, .3), gasket, [x, Y + .075, z]));
  const dp = part('display'); add(dp, box(W - .08, .02, L - .08), mat(0x050506, .3, .2, { emissive: 0xffffff, emissiveMap: screenTex(), emissiveIntensity: .9 }), [0, Y + .157, 0]); add(dp, box(.3, .022, .5), cu, [0, Y + .146, -1.0]);
  const cg = part('cover-glass'); const g = add(cg, rbox(W, .025, L, R), glass(0xdfe8f5, .18), [0, Y + .18, 0]); g.renderOrder = 3; add(cg, rbox(.32, .026, .09, .045), mat(0x050506, .2), [0, Y + .181, 1.38]);
  const P = { water: false };
  return {
    root, parts, ogK: 1.6, quizEx: .7, params: P, view: [.55, 1.1, .8], sliceAxis: 'z', shells: ['cover-glass', 'frame', 'back-glass'],
    peel: ['cover-glass', 'display', 'seals', 'logic-board', 'battery', 'haptic-motor', 'speaker', 'usb-port', 'camera', 'frame', 'charging-coil', 'back-glass'],
    explode: { 'cover-glass': [0, .5, 0], display: [0, .38, 0], seals: [0, .27, 0], 'logic-board': [.12, .18, .06], battery: [-.05, .14, -.04], 'haptic-motor': [.12, .1, -.08], speaker: [-.1, .1, -.1], 'usb-port': [0, .04, -.16], camera: [-.08, -.24, .1], frame: [0, 0, 0], 'charging-coil': [0, -.14, 0], 'back-glass': [0, -.3, 0] },
    topY: Y + .2, footprint: [W, L]
  };
}
