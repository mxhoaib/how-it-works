import { THREE, model, add, grp, box, cyl, mat, glow, sph, S } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const xs = [-1.5, -.5, .5, 1.5], off = [0, 540, 180, 360].map(d => d * Math.PI / 180), r = .3, L = 1.0, Y = 1.0;
  const alu = mat(0xa7abb0, .45, .6), iron = mat(0x6d7177, .5, .7), steel = mat(0xc9ccd1, .25, .9), dark = mat(0x3a3c40, .5, .6);

  const reg = (id) => { const p = part(id); p.position.y = Y; return p; };
  // block (cutaway: front wall removed)
  const bl = reg('block');
  add(bl, box(4.3, 2.55, .1), alu, [0, .375, -.57]); [-2.15, 2.15].forEach(x => add(bl, box(.12, 2.55, 1.24), alu, [x, .375, 0]));
  xs.forEach(x => add(bl, cyl(.4, .4, 1.1, 32, true, Math.PI / 2, Math.PI), mat(0xb8bcc1, .3, .7), [x, 1.1, 0]));
  [-2, -1, 0, 1, 2].forEach(x => add(bl, box(.12, .8, .5), alu, [x, -.25, -.32]));
  add(bl, box(4.3, .35, 1.24), dark, [0, -.92, 0]);
  // head
  const hd = reg('head'); add(hd, box(4.3, .55, .2), alu, [0, 1.93, -.52]); add(hd, box(4.3, .05, .5), alu, [0, 1.68, -.32]); add(hd, box(4.3, .06, .2), alu, [0, 2.22, -.52]);
  [-2.1, 2.1].forEach(x => add(hd, box(.1, .55, 1.0), alu, [x, 1.93, -.1]));
  // pistons + rods
  const ps = reg('pistons'), pist = [], rods = [];
  xs.forEach(x => { const p = grp(ps, [x, 0, 0]); add(p, cyl(.37, .37, .45, 32), steel); [.12, .17].forEach(y => add(p, cyl(.372, .372, .025, 32), dark, [0, y, 0])); pist.push(p);
    const rd = grp(ps, [x, 0, 0]); add(rd, box(.1, L, .06), iron); add(rd, cyl(.09, .09, .14, 16), iron, [0, -L / 2, 0], [0, 0, Math.PI / 2]); rods.push(rd); });
  // crankshaft
  const ck = reg('crankshaft'), crank = grp(ck);
  add(crank, cyl(.11, .11, 4.6, 16), steel, [0, 0, 0], [0, 0, Math.PI / 2]);
  xs.forEach((x, i) => { const a = -off[i]; const py = r * Math.cos(a), pz = r * Math.sin(a);
    [-.18, .18].forEach(dx => { const w = add(crank, box(.08, .62, .34), iron, [x + dx, py / 2, pz / 2]); w.rotation.x = a; });
    add(crank, cyl(.09, .09, .3, 16), steel, [x, py, pz], [0, 0, Math.PI / 2]); });
  add(crank, cyl(.78, .78, .12, 48), iron, [-2.45, 0, 0], [0, 0, Math.PI / 2]); add(crank, cyl(.26, .26, .1, 32), dark, [2.42, 0, 0], [0, 0, Math.PI / 2]);
  for (let k = 0; k < 6; k++) add(crank, cyl(.05, .05, .14, 8), steel, [-2.45, Math.cos(k) * .5, Math.sin(k) * .5], [0, 0, Math.PI / 2]);
  // camshafts (intake + exhaust)
  const cm = reg('camshaft'), cams = [];
  [-.18, .18].forEach((z, j) => { const c = grp(cm, [0, 2.38, z]); add(c, cyl(.05, .05, 4.3, 12), steel, [0, 0, 0], [0, 0, Math.PI / 2]);
    xs.forEach((x, i) => { const lob = add(c, sph(.11, 16), iron, [x, 0, 0], [0, 0, 0], [.5, 1, 1]); lob.geometry.translate(0, .04, 0); lob.rotation.x = off[i] / 2 + (j ? Math.PI * .5 : Math.PI * 1.0); });
    add(c, cyl(.32, .32, .06, 40), dark, [2.3, 0, 0], [0, 0, Math.PI / 2]); cams.push(c); });
  // valves
  const vl = reg('valves'), valves = [];
  xs.forEach(x => [-.18, .18].forEach((z, j) => { const v = grp(vl, [x, 0, z]); add(v, cyl(.13, .05, .05, 24), steel, [0, 1.62, 0]); add(v, cyl(.025, .025, .66, 8), steel, [0, 1.96, 0]); add(v, cyl(.06, .06, .14, 12, true), mat(0x4a7cc9, .5, .4), [0, 2.1, 0]); valves.push({ v, j }); }));
  // spark plugs + combustion flash
  const sp = reg('spark-plugs'), plugs = [], flames = [];
  xs.forEach(x => { const p = grp(sp, [x, 0, 0]); add(p, cyl(.04, .04, .35, 12), mat(0xf4f4f0, .3), [0, 2.32, 0]); add(p, cyl(.075, .075, .1, 6), steel, [0, 2.1, 0]); const tip = add(p, sph(.04, 10), glow(0x7fc4ff, 0), [0, 1.62, 0]); plugs.push(tip);
    const fl = add(p, cyl(.36, .36, 1, 24), mat(0xff7a1a, .5, 0, { emissive: 0xff5a00, emissiveIntensity: 2, transparent: true, opacity: .55, depthWrite: false }), [0, 1.6, 0]); fl.visible = false; flames.push(fl); });
  let th = 0; const P = { rpm: 90 };
  const T = Math.PI * 4, e = { stroke: 'Power' };
  function pose() {
    xs.forEach((x, i) => { const a = th - off[i], py = r * Math.cos(a), pz = r * Math.sin(a), yp = py + Math.sqrt(L * L - pz * pz);
      pist[i].position.y = yp + .225 - .05; const rd = rods[i]; rd.position.set(x, (py + yp) / 2, pz / 2); rd.rotation.x = Math.atan2(-pz, yp - py);
      const c = ((a % T) + T) % T, deg = c * 180 / Math.PI;
      const fire = deg < 70 ? 1 - deg / 70 : 0; plugs[i].material.emissiveIntensity = deg < 14 ? 6 : 0; plugs[i].material.emissive.setHex(0x7fc4ff);
      const fl = flames[i]; fl.visible = fire > 0; if (fire > 0) { const top = yp + .45 - .05, h = Math.max(.02, 1.62 - top); fl.scale.y = h; fl.position.y = top + h / 2; fl.material.opacity = .15 + .5 * fire; }
      valves.forEach(({ v, j }, k) => { if ((k >> 1) !== i) return; const lo = j ? 180 : 360, u = (deg - lo) / 180; v.position.y = u > 0 && u < 1 ? -.1 * Math.sin(u * Math.PI) : 0; });
    });
    crank.rotation.x = th; cams.forEach(c => c.rotation.x = -th / 2 * 1);
  }
  pose();
  return {
    root, parts, params: P, view: [.35, .32, 1.2], sliceAxis: 'z', shells: ['block', 'head'],
    explode: { block: [0, 0, -.18], head: [0, .2, -.12], pistons: [0, .06, .14], crankshaft: [0, -.14, .06], camshaft: [0, .3, .02], valves: [0, .14, .12], 'spark-plugs': [0, .24, .2] },
    stroke() { const deg = (((th - off[0]) % T) + T) % T * 180 / Math.PI; return ['Power', 'Exhaust', 'Intake', 'Compression'][Math.floor(deg / 180)]; },
    update(dt) { th += P.rpm / 60 * Math.PI * 2 * dt; pose(); }
  };
}
