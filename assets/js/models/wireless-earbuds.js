import { THREE, model, add, grp, box, cyl, mat, glass, glow, tor, rbox, sph, cone, tube, smd, pcbTex, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  // one earbud, enlarged, lying at an angle, with its charging case behind it
  const white = mat(0xf4f4f6, .35, .05, { transparent: true, opacity: .42, depthWrite: false }), dark = mat(0x1c1d20, .45, .3), steel = mat(0xb9bec4, .3, .9), gold = mat(0xd9b45a, .3, .95);
  const H = [0, 1.15, .4], tilt = .35; // head centre
  const tip = part('ear-tip'); add(tip, cyl(.34, .42, .32, 40, true), mat(0xe9eaee, .85, 0), [H[0] + .55, H[1] + .1, H[2]], [0, 0, Math.PI / 2 + tilt]); add(tip, tor(.33, .05, 10, 40), mat(0xe9eaee, .85), [H[0] + .7, H[1] + .15, H[2]], [0, Math.PI / 2, -tilt]);
  add(tip, cyl(.2, .2, .1, 32, true), mat(0x9a9ca2, .6), [H[0] + .78, H[1] + .17, H[2]], [0, 0, Math.PI / 2 + tilt]);
  const sh = part('shell'); add(sh, sph(.62, 48), white, H, [0, 0, tilt], [1.05, .9, .9]); add(sh, cyl(.17, .2, 2.3, 40), white, [-.35, 0, H[2]], [0, 0, .16]); add(sh, sph(.17, 24), white, [-.53, -1.1, H[2]], [0, 0, 0], [1.15, .6, 1.15]);
  const dr = part('driver'); const d = grp(dr, [H[0] + .28, H[1] + .05, H[2]], [0, 0, -Math.PI / 2 + tilt]);
  add(d, cyl(.36, .36, .12, 40), mat(0x34363b, .5, .4)); add(d, cone(.33, .1, 40), mat(0xd7d9de, .5, .1), [0, .1, 0]); add(d, cyl(.18, .18, .14, 32), steel, [0, -.1, 0]); add(d, tor(.34, .02, 6, 40), mat(0x8a8f96, .4, .7), [0, .07, 0], [Math.PI / 2, 0, 0]);
  const lb = part('logic-board'), pt = pcbTex('#2b1f4a'); add(lb, box(.5, .03, .55), mat(0xffffff, .5, .2, { map: pt }), [-.18, H[1] - .05, H[2]], [0, 0, tilt + 1.2]); add(lb, box(.22, .05, .22), mat(0x2a2b2f, .35, .4), [-.15, H[1] - .02, H[2]], [0, 0, tilt + 1.2]); smd(lb, MOBILE ? 10 : 24, -.35, .05, H[2] - .2, H[2] + .2, H[1] - .05, mat(0x6b6e74, .4, .6), .02);
  add(lb, tube([[-.2, H[1] - .2, H[2]], [-.3, .4, H[2] + .05], [-.42, -.6, H[2]]], .02, 30, 6), mat(0xd08a3a, .4, .6));
  const bt = part('battery'); add(bt, cyl(.11, .11, .75, 32), mat(0x3a3d44, .4, .6), [-.33, -.05, H[2]], [0, 0, .16]); add(bt, cyl(.112, .112, .5, 32), mat(0x2d6cdf, .5, .2), [-.33, -.05, H[2]], [0, 0, .16]);
  const mc = part('microphones'); [[-.2, .88], [-.5, -1.15]].forEach(([x, y], i) => { add(mc, cyl(.07, .07, .04, 24), dark, [x, y, H[2] + (i ? 0 : .17)], i ? [0, 0, 0] : [Math.PI / 2, 0, 0]); add(mc, cyl(.05, .05, .045, 24), mat(0x6d7178, .7, .5), [x, y + (i ? -.012 : 0), H[2] + (i ? 0 : .175)], i ? [0, 0, 0] : [Math.PI / 2, 0, 0]); });
  add(mc, rbox(.1, .14, .05, .02), mat(0x4a4d55, .4, .5), [-.42, -.4, H[2] + .16]);
  const an = part('antenna'); add(an, tube([[-.25, .6, H[2] - .13], [-.33, 0, H[2] - .16], [-.44, -.7, H[2] - .13]], .018, 30, 6), gold);
  const sn = part('sensors'); add(sn, cyl(.07, .07, .05, 24), mat(0x101012, .1, .3), [H[0] + .1, H[1] - .45, H[2] + .1], [0, 0, .5]); add(sn, sph(.025, 10), glow(0xff3b30, .5), [H[0] + .1, H[1] - .48, H[2] + .1]); add(sn, rbox(.16, .4, .03, .015), mat(0x8a8f96, .4, .7), [-.36, -.25, H[2] - .17], [0, 0, .16]);
  const ct = part('charging-contacts'); [0, 1].forEach(i => add(ct, tor(.18, .015, 8, 32), gold, [-.5, -.9 - i * .12, H[2]], [Math.PI / 2, 0, 0]));
  const cs = part('case'), cw = mat(0xf7f7f9, .3, .05);
  add(cs, rbox(2.4, 1.0, 1.1, .45, 4), cw, [.3, .5, -1.25]); const lid = grp(cs, [.3, 1.0, -1.8]); add(lid, rbox(2.4, .5, 1.1, .3, 4), cw, [0, .2, .55]);
  lid.rotation.x = -1.15; add(cs, cyl(.05, .05, .5, 12), steel, [.3, 1.0, -1.8], [0, 0, Math.PI / 2]); add(cs, box(.4, .05, .06), glow(0x30d158, .8), [.3, .6, -.69]);
  add(cs, rbox(1.6, .12, .8, .05), mat(0x2b2d33, .5, .3), [.3, .2, -1.25]); [-.35, .95].forEach(x => add(cs, cyl(.2, .18, .6, 24, true), mat(0xdcdde2, .5), [x, .7, -1.25]));
  Object.keys(parts).forEach(k => { if (k !== 'case') parts[k].position.y += 1.35; });
  return {
    root, parts, quizEx: .7, view: [.9, .55, 1.15], sliceAxis: 'z', shells: ['shell', 'case'],
    peel: ['ear-tip', 'shell', 'driver', 'logic-board', 'sensors', 'microphones', 'antenna', 'battery', 'charging-contacts', 'case'],
    explode: { 'ear-tip': [.32, .12, 0], shell: [0, 0, .28], driver: [.2, .1, .12], 'logic-board': [-.05, .2, .16], battery: [-.2, -.05, .14], microphones: [-.16, .12, .22], antenna: [-.12, 0, -.06], sensors: [.12, -.12, .16], 'charging-contacts': [-.06, -.22, .12], case: [0, 0, -.2] }
  };
}
