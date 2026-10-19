import { THREE, model, add, grp, box, cyl, mat, glow, glass, tor, rod, tube, rbox, gear, merge, MOBILE } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const paint = mat(0x2f6fd6, .3, .55), dark = mat(0x1f2023, .6, .3), rub = mat(0x18181a, .9, 0), rim = mat(0xbfc4ca, .25, .9), steel = mat(0x7c828a, .4, .8), alu = mat(0xb8bdc4, .35, .9), hv = mat(0xff7a1a, .5, .1);
  const WX = 1.62, WZ = .88, WR = .36;
  // battery pack: tray, modules made of cylindrical cells (merged), busbars
  const bp = part('battery-pack'); add(bp, rbox(2.9, .1, 1.5, .04), alu, [0, .27, 0]); add(bp, box(2.9, .02, 1.5), mat(0x2b2d33, .5, .4), [0, .33, 0]);
  const cells = [], NM = 8; for (let mi = 0; mi < NM; mi++) { const mx = -1.27 + mi * .363; for (let i = 0; i < (MOBILE ? 4 : 6); i++) for (let j = 0; j < (MOBILE ? 10 : 16); j++) { const g = new THREE.CylinderGeometry(.022, .022, .1, 8); g.translate(mx - .12 + i * (.26 / (MOBILE ? 3 : 5)), .38, -.62 + j * (1.24 / (MOBILE ? 9 : 15))); cells.push(g); } }
  add(bp, merge(cells), mat(0x3d6fd1, .4, .4));
  const mods = part('modules'); for (let mi = 0; mi < NM; mi++) { const mx = -1.27 + mi * .363; add(mods, box(.31, .015, 1.32), mat(0xc9a14a, .3, .9), [mx, .438, 0]); add(mods, box(.33, .12, .02), dark, [mx, .38, .67]); add(mods, box(.33, .12, .02), dark, [mx, .38, -.67]); }
  const bms = part('bms'); add(bms, box(.4, .05, .28), mat(0x1c5a3a, .5, .2), [1.2, .47, 0]); add(bms, box(.12, .03, .1), dark, [1.2, .505, 0]);
  // drive units (motor + inverter + reduction gear) front and rear
  const du = part('drive-units'), inv = part('inverters');
  [WX, -WX].forEach(x => { const s = Math.sign(x); add(du, cyl(.2, .2, .42, 28), mat(0x9aa3ad, .3, .85), [x - s * .05, WR, -.12], [Math.PI / 2, 0, 0]); add(du, cyl(.16, .16, .3, 24), alu, [x - s * .05, WR, .2], [Math.PI / 2, 0, 0]);
    const gr = grp(du, [x - s * .05, WR, .37]); add(gr, gear(18, .02, .06), steel); rod(du, [x, WR, -.3], [x, WR, -WZ + .14], .03, steel, 10); rod(du, [x, WR, .4], [x, WR, WZ - .14], .03, steel, 10);
    add(inv, rbox(.34, .14, .44, .03), mat(0x5f6670, .35, .7), [x - s * .05, WR + .27, 0]); for (let k = 0; k < 5; k++) add(inv, box(.3, .012, .02), alu, [x - s * .05, WR + .35, -.16 + k * .08]); });
  const hvc = part('hv-cables'); [[1.45, .55, .1], [-1.45, .55, .1]].forEach(([x]) => { add(hvc, tube([[x * .8, .45, .15], [x * .9, .58, .12], [x * 1.05, WR + .3, .05]], .025, 24, 8), hv); add(hvc, tube([[x * .8, .45, -.15], [x * .9, .58, -.12], [x * 1.05, WR + .3, -.05]], .025, 24, 8), hv); });
  add(hvc, tube([[-1.0, .45, -.6], [-1.6, .7, -.7], [-2.0, .78, -.78]], .022, 24, 8), hv);
  const ch = part('charging'); add(ch, rbox(.36, .12, .28, .03), mat(0x6c727b, .35, .7), [-1.0, .52, -.48]); add(ch, cyl(.07, .07, .05, 20), dark, [-2.02, .8, -.8], [Math.PI / 2, 0, 0]); add(ch, cyl(.04, .04, .052, 16), glow(0x30d158, 1.4), [-2.02, .8, -.8], [Math.PI / 2, 0, 0]);
  const th = part('thermal'); add(th, box(.08, .34, 1.1), mat(0x9aa0a6, .4, .8), [2.25, .45, 0]); for (let k = 0; k < 14; k++) add(th, box(.085, .3, .01), alu, [2.25, .45, -.5 + k * .077]);
  const cool = mat(0x64d2ff, .3, .2, { emissive: 0x0a84ff, emissiveIntensity: .25 }); add(th, tube([[2.2, .4, .45], [1.7, .3, .6], [0, .24, .72], [-1.4, .24, .7], [-1.55, .4, .5]], .022, 48, 8), cool); add(th, tube([[2.2, .5, -.45], [1.7, .28, -.6], [0, .22, -.72], [-1.4, .22, -.7], [-1.55, .4, -.5]], .022, 48, 8), cool);
  const lv = part('12v-battery'); add(lv, rbox(.26, .16, .18, .02), mat(0x2b2d33, .5, .3), [1.85, .7, .5]); add(lv, cyl(.02, .02, .03, 10), mat(0xd84a3a, .4, .5), [1.8, .795, .45]);
  // heat pump: compressor, valve block and refrigerant lines feeding the cabin and pack
  const hp = part('heat-pump'); add(hp, cyl(.08, .08, .2, 20), mat(0x4a5058, .35, .8), [1.95, .62, -.35]); add(hp, rbox(.16, .1, .14, .02), mat(0x2f8f6f, .4, .5), [1.95, .62, -.12]);
  add(hp, tube([[1.95, .62, -.05], [1.6, .68, 0], [1.2, .75, .1]], .016, 24, 8), mat(0x64d2ff, .3, .4)); add(hp, tube([[1.95, .55, -.45], [2.15, .5, -.5], [2.2, .45, -.4]], .016, 24, 8), mat(0x64d2ff, .3, .4));
  // crash structure: bumper beams, crush rails and side sills
  const cs = part('crash-structure'), cm = mat(0xc7ccd2, .35, .85); add(cs, rbox(.08, .1, 1.6, .02), cm, [2.42, .48, 0]); add(cs, rbox(.08, .1, 1.6, .02), cm, [-2.3, .5, 0]);
  [-.5, .5].forEach(z => { add(cs, box(.5, .08, .08), cm, [2.15, .48, z]); add(cs, box(.4, .08, .08), cm, [-2.05, .5, z]); add(cs, box(3.0, .1, .06), cm, [0, .3, z * 1.62]); });
  // suspension, brakes, wheels
  const su = part('suspension'), spring = mat(0xd84a3a, .4, .5);
  [WX, -WX].forEach(x => [-1, 1].forEach(s => { rod(su, [x - .22, .42, s * .45], [x, WR - .05, s * (WZ - .18)], .025, steel, 8); for (let k = 0; k < 6; k++) add(su, tor(.06, .011, 6, 16), spring, [x + .1, .5 + k * .045, s * .62], [Math.PI / 2, 0, 0]); add(su, cyl(.025, .025, .38, 8), steel, [x + .1, .62, s * .62]); }));
  const br = part('brakes'); [[WX, WZ], [WX, -WZ], [-WX, WZ], [-WX, -WZ]].forEach(([x, z]) => { add(br, cyl(.22, .22, .025, 32), mat(0x8a8f96, .45, .85), [x, WR, z - Math.sign(z) * .1], [Math.PI / 2, 0, 0]); add(br, box(.12, .14, .07), mat(0xd84a3a, .4, .4), [x + .12, WR + .1, z - Math.sign(z) * .1]); });
  const wh = part('wheels'), spins = [];
  [[WX, WZ], [WX, -WZ], [-WX, WZ], [-WX, -WZ]].forEach(([x, z]) => { const sp = grp(wh, [x, WR, z]); add(sp, cyl(WR, WR, .24, 36), rub, [0, 0, 0], [Math.PI / 2, 0, 0]); add(sp, cyl(.25, .25, .25, 30), rim, [0, 0, 0], [Math.PI / 2, 0, 0]); for (let k = 0; k < 5; k++) add(sp, box(.04, .44, .02), dark, [0, 0, Math.sign(z) * .13], [0, 0, k / 5 * Math.PI]); spins.push(sp); });
  wh.userData.spread = .6; wh.userData.spreadMask = [0, 0, 1];
  // interior + body shell (translucent so the skateboard shows)
  const it = part('interior'); [[.15, .45], [.15, -.45], [-.75, .45], [-.75, -.45]].forEach(([x, z]) => { add(it, rbox(.5, .1, .42, .04), mat(0x2b2d33, .8), [x, .58, z]); add(it, rbox(.1, .55, .42, .04), mat(0x2b2d33, .8), [x - .24, .85, z], [0, 0, .18]); });
  add(it, cyl(.16, .16, .03, 28), dark, [.75, .95, .38], [0, 0, 1.2]); add(it, box(.04, .22, .36), mat(0x050506, .3, .2, { emissive: 0x7aa7ff, emissiveIntensity: .6 }), [.85, .98, 0], [0, 0, .5]);
  const bo = part('body'), sh = new THREE.Shape(); [[2.45, .42], [2.5, .72], [1.3, .86], [.55, 1.32], [-.75, 1.32], [-1.9, .95], [-2.3, .85], [-2.32, .42]].forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
  const eg = new THREE.ExtrudeGeometry(sh, { depth: 1.76, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 2, curveSegments: 4 }); eg.translate(0, 0, -.88);
  const b = add(bo, eg, mat(0x2f6fd6, .25, .5, { transparent: true, opacity: .22, depthWrite: false })); b.renderOrder = 2; add(bo, box(.03, .04, 1.5), glow(0xffffff, 2), [2.5, .68, 0]); add(bo, box(.03, .04, 1.5), glow(0xff3b30, 1.6), [-2.33, .82, 0]);
  const P = { speed: .6 }; let a = 0;
  return {
    root, parts, params: P, view: [.75, .6, 1.1], sliceAxis: 'z', shells: ['body'], quizEx: .5,
    peel: ['body', 'interior', 'crash-structure', 'wheels', 'brakes', 'suspension', '12v-battery', 'heat-pump', 'thermal', 'charging', 'hv-cables', 'inverters', 'drive-units', 'bms', 'modules', 'battery-pack'],
    explode: { body: [0, .55, 0], interior: [0, .38, 0], wheels: [0, 0, 0], brakes: [0, .02, 0], suspension: [0, .12, 0], '12v-battery': [.1, .3, .1], thermal: [.15, .12, 0], 'heat-pump': [.15, .35, -.1], 'crash-structure': [0, -.05, 0], charging: [-.1, .22, -.1], 'hv-cables': [0, .2, 0], inverters: [0, .28, 0], 'drive-units': [0, .14, 0], bms: [0, .3, 0], modules: [0, .2, 0], 'battery-pack': [0, -.12, 0] },
    update(dt) { a += P.speed * dt * 3; spins.forEach(s => s.rotation.z = -a); }
  };
}
