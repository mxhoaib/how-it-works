import { THREE, model, add, grp, box, cyl, mat, glow, tor, lathe, bladeRing, cone, S } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const Y = 1.38, ti = mat(0xc7ccd3, .25, .9), hot = mat(0xb07a5a, .35, .85), dark = mat(0x2c2e33, .4, .6), white = mat(0xf2f2f4, .35, .2);
  const ax = (id) => { const p = part(id); p.position.y = Y; return p; };
  const fan = ax('fan'), fanSpin = grp(fan, [2.35, 0, 0]);
  add(fanSpin, bladeRing(22, .26, 1.04, .34, .035, .7), ti); add(fanSpin, cyl(.28, .28, .3, 32), ti, [0, 0, 0], [0, 0, Math.PI / 2]);
  add(fanSpin, cone(.28, .55, 32), white, [.42, 0, 0], [0, 0, -Math.PI / 2]);
  const co = ax('compressor'), comp = [];
  for (let i = 0; i < 7; i++) { const x = 1.85 - i * .17, tip = .56 - i * .028; const g = grp(co, [x, 0, 0]); add(g, bladeRing(20, .27, tip, .09, .02, .5), ti); comp.push(g); }
  add(co, cyl(.25, .28, 1.2, 32), mat(0x8d939a, .35, .8), [1.35, 0, 0], [0, 0, Math.PI / 2]);
  const cb = ax('combustor'), flames = [];
  add(cb, tor(.42, .1, 12, 40), mat(0x9a6b4c, .4, .8), [.48, 0, 0], [0, Math.PI / 2, 0]);
  const fl = add(cb, tor(.42, .065, 10, 40), glow(0xff6a1a, 2.2), [.48, 0, 0], [0, Math.PI / 2, 0]); flames.push(fl);
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; add(cb, cyl(.02, .02, .2, 6), ti, [.66, Math.cos(a) * .42, Math.sin(a) * .42], [0, 0, Math.PI / 2]); }
  const tu = ax('turbine'), turb = [];
  for (let i = 0; i < 4; i++) { const x = .1 - i * .2, tip = .44 + i * .045; const g = grp(tu, [x, 0, 0]); add(g, bladeRing(24, .27, tip, .1, .025, -.55), hot); add(g, cyl(.27, .27, .1, 24), hot, [0, 0, 0], [0, 0, Math.PI / 2]); turb.push(g); }
  const sh = ax('shaft'), shaft = grp(sh); add(shaft, cyl(.07, .07, 3.6, 16), mat(0xdcdfe3, .2, .95), [.8, 0, 0], [0, 0, Math.PI / 2]); add(shaft, cyl(.13, .13, 2.6, 16, true), mat(0x9aa0a6, .3, .9), [.9, 0, 0], [0, 0, Math.PI / 2]);
  const nz = ax('nozzle');
  const plug = add(nz, lathe([[0, -1.3], [.12, -1.1], [.24, -.6], [.3, 0]], 32), hot); plug.rotation.z = -Math.PI / 2; plug.position.x = -.75;
  const ring = add(nz, lathe([[.58, 0], [.5, -.7], [.47, -.7], [.55, 0]], 40), mat(0x6e6158, .4, .8)); ring.rotation.z = -Math.PI / 2; ring.position.x = -.75;
  const nc = ax('nacelle'), ps = .26, pl = Math.PI * 1.5;
  const outer = add(nc, lathe([[1.08, 2.95], [1.16, 2.8], [1.22, 2.3], [1.22, 1.2], [1.12, 0], [1.0, -.7], [.96, -.7], [1.07, 0], [1.16, 1.2], [1.16, 2.3], [1.11, 2.8], [1.04, 2.95]], 56, ps, pl), white); outer.rotation.z = -Math.PI / 2;
  const core = add(nc, lathe([[.6, 2.05], [.66, 1.6], [.66, .6], [.6, -.75], [.57, -.75], [.62, .6], [.62, 1.6], [.57, 2.05]], 48, ps, pl), mat(0xb6bcc4, .35, .7)); core.rotation.z = -Math.PI / 2;
  add(nc, box(.25, Y - 1.1, .25), dark, [1.4, -(Y - (Y - 1.1) / 2) + 0, 0]); add(nc, box(.25, Y - 1.1, .25), dark, [-.2, -(Y - (Y - 1.1) / 2), 0]);
  add(nc, box(2.6, .06, .9), dark, [.6, -Y + .03, 0]);
  const P = { rpm: 40 }; let a = 0;
  return {
    root, parts, params: P, view: [.55, .32, 1.2], sliceAxis: 'z', shells: ['nacelle'],
    explode: { fan: [.32, 0, 0], compressor: [.14, 0, .05], combustor: [0, .12, .12], turbine: [-.14, 0, .05], shaft: [0, -.14, .1], nozzle: [-.32, 0, 0], nacelle: [0, 0, -.3] },
    update(dt, t) { a += P.rpm / 60 * Math.PI * 2 * dt; fanSpin.rotation.x = a; comp.forEach(g => g.rotation.x = a * 1.7); turb.forEach((g, i) => g.rotation.x = i < 2 ? a * 1.7 : a); shaft.rotation.x = a; flames.forEach(f => f.material.emissiveIntensity = 1.8 + Math.sin(t * 23) * .4 + Math.sin(t * 7) * .3); }
  };
}
