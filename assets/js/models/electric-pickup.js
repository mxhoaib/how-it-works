import { THREE, model, add, grp, box, cyl, mat, glow, glass, tor, rod, S } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const paint = mat(0xd9dde2, .28, .65), dark = mat(0x1f2023, .6, .3), rub = mat(0x18181a, .9, 0), rim = mat(0xbfc4ca, .25, .9), steel = mat(0x7c828a, .4, .8);
  const WX = 1.75, WZ = .92, WR = .42;
  // frame
  const fr = part('frame'); [-.52, .52].forEach(z => add(fr, box(5.0, .12, .1), steel, [0, .52, z])); [-2.2, -1.75, 0, 1.75, 2.2].forEach(x => add(fr, box(.1, .1, 1.04), steel, [x, .52, 0]));
  // battery
  const bt = part('battery'); add(bt, box(2.9, .16, 1.5), mat(0x2b3a55, .45, .5), [0, .36, 0]);
  for (let i = 0; i < 6; i++) add(bt, box(.42, .02, 1.36), mat(0x4f7cd6, .4, .5), [-1.2 + i * .48, .45, 0]);
  // motors
  const mo = part('motors'); [-WX, WX].forEach(x => { add(mo, cyl(.2, .2, .55, 24), mat(0x9aa3ad, .3, .85), [x + (x > 0 ? -.3 : .3), .42, 0], [Math.PI / 2, 0, 0]); add(mo, box(.36, .3, .32), steel, [x, .42, 0]); [-1, 1].forEach(s => rod(mo, [x, .42, s * .16], [x, WR, s * (WZ - .15)], .035, steel, 8)); });
  // suspension
  const su = part('suspension'), spring = mat(0xd84a3a, .4, .5);
  [-WX, WX].forEach(x => [-1, 1].forEach(s => { rod(su, [x - .2, .5, s * .5], [x, WR + .02, s * (WZ - .18)], .03, steel, 8); rod(su, [x + .2, .62, s * .5], [x, WR + .18, s * (WZ - .2)], .03, steel, 8);
    for (let k = 0; k < 6; k++) add(su, tor(.07, .012, 6, 16), spring, [x + .12, .58 + k * .05, s * .62], [Math.PI / 2, 0, 0]); add(su, cyl(.03, .03, .4, 8), steel, [x + .12, .72, s * .62]); }));
  // wheels
  const wh = part('wheels'), wheels = [];
  [[WX, WZ], [WX, -WZ], [-WX, WZ], [-WX, -WZ]].forEach(([x, z]) => { const st = grp(wh, [x, WR, z]), sp = grp(st); add(sp, cyl(WR, WR, .3, 32), rub, [0, 0, 0], [Math.PI / 2, 0, 0]); add(sp, cyl(.27, .27, .31, 28), rim, [0, 0, 0], [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 5; k++) add(sp, box(.05, .5, .02), dark, [0, 0, Math.sign(z) * .16], [0, 0, k / 5 * Math.PI]); wheels.push({ st, sp, front: x > 0 }); });
  // body + cab (side profile extruded across the width)
  const bo = part('body'), sh = new THREE.Shape(), prof = [[2.75, .8], [2.78, 1.16], [1.25, 1.3], [.5, 1.93], [-.72, 1.96], [-.85, 1.32], [-.85, .8]];
  prof.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
  const eg = new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 2, curveSegments: 4 }); eg.translate(0, 0, -.9); add(bo, eg, paint);
  const win = new THREE.Shape(); [[1.12, 1.36], [.52, 1.86], [-.66, 1.88], [-.74, 1.36]].forEach(([x, y], i) => i ? win.lineTo(x, y) : win.moveTo(x, y));
  const tint = mat(0x111418, .1, .6); [-1, 1].forEach(s => add(bo, new THREE.ShapeGeometry(win), tint, [0, 0, s * .955]));
  const ws = add(bo, box(1.02, .02, 1.7), tint, [.88, 1.62, 0], [0, 0, -.71]); ws.scale.set(1, 1, 1);
  add(bo, box(.03, .05, 1.7), glow(0xffffff, 2), [2.8, 1.1, 0]); add(bo, box(.04, .14, 1.84), dark, [2.79, .9, 0]);
  // cargo bed
  const bd = part('cargo-bed'); add(bd, box(1.9, .06, 1.72), dark, [-1.8, 1.0, 0]); [-1, 1].forEach(s => add(bd, box(1.9, .58, .07), paint, [-1.8, 1.07, s * .9])); add(bd, box(.07, .58, 1.86), paint, [-2.75, 1.07, 0]);
  add(bd, box(.03, .05, 1.7), glow(0xff2d2d, 2), [-2.8, 1.28, 0]); add(bd, box(1.9, .1, 1.86), dark, [-1.8, .82, 0]);
  const P = { spin: 0, steer: 0, speed: 0 };
  return {
    root, parts, params: P, view: [.8, .35, 1.1], sliceAxis: 'z', shells: ['body'],
    explode: { body: [0, .25, 0], 'cargo-bed': [-.12, .2, 0], battery: [0, -.08, 0], motors: [0, -.02, .25], wheels: [0, 0, 0], suspension: [0, .04, .14], frame: [0, .08, -.2] },
    wheelsInfo: { WX, WZ, WR },
    update(dt) { if (P.speed) P.spin += P.speed * dt / WR; wheels.forEach(w => { w.sp.rotation.z = -P.spin; w.st.rotation.y = w.front ? P.steer : 0; }); }
  };
}
