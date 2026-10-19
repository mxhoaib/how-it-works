import { THREE, model, add, grp, box, cyl, mat, sph, cone, tor, tube, S } from '../kit.js';
export function build() {
  const { root, parts, part } = model();
  const fur = mat(0xe3a86b, .8, 0, { transparent: true, opacity: .34, depthWrite: false }), bone = mat(0xf1e9d8, .6, .05), eye = mat(0x9ad16b, .2, .1);
  const hips = [[.92, 1.02, .22], [.92, 1.02, -.22], [-.95, 1.06, .22], [-.95, 1.06, -.22]], gait = [0, Math.PI, Math.PI, 0];
  const tailPts = [[0, 0, 0], [-.45, -.05, 0], [-.75, .25, .02], [-.85, .75, .04], [-.7, 1.1, .05]];
  // skin
  const sk = part('skin'), sLegs = [];
  add(sk, sph(1, 40), fur, [0, 1.15, 0], [0, 0, .04], [1.3, .44, .4]);
  add(sk, sph(1, 28), fur, [1.2, 1.38, 0], [0, 0, .7], [.42, .27, .3]);
  const head = grp(sk, [1.55, 1.62, 0]);
  add(head, sph(.36, 32), fur, [0, 0, 0], [0, 0, 0], [1.05, .92, .95]); add(head, sph(.15, 20), fur, [.3, -.1, 0], [0, 0, 0], [1, .8, 1.15]);
  [-1, 1].forEach(s => { add(head, cone(.11, .26, 16), fur, [-.02, .33, s * .17], [s * .25, 0, -.15]); add(head, sph(.055, 14), eye, [.28, .06, s * .14], [0, 0, 0], [.6, 1, 1]); });
  const tail = grp(sk, [-1.25, 1.22, 0]); add(tail, tube(tailPts, .07, 40, 10), fur);
  hips.forEach(h => { const p = grp(sk, h); add(p, cyl(.13, .09, .95, 18), fur, [0, -.48, 0]); add(p, sph(.1, 14), fur, [.04, -.98, 0], [0, 0, 0], [1.3, .6, 1]); sLegs.push(p); });
  // skeleton
  const sku = part('skull'), skull = grp(sku, [1.55, 1.62, 0]);
  add(skull, sph(.27, 28), bone, [-.03, .03, 0], [0, 0, 0], [1.15, .88, .9]); add(skull, box(.3, .07, .2), bone, [.22, -.18, 0], [0, 0, -.15]); add(skull, box(.22, .12, .22), bone, [.24, -.08, 0]);
  [-1, 1].forEach(s => add(skull, tor(.075, .018, 8, 18), bone, [.2, .05, s * .13], [0, Math.PI / 2 + s * .5, 0]));
  const sp = part('spine'), spinePts = [[1.32, 1.5, 0], [1.05, 1.38, 0], [.5, 1.42, 0], [-.2, 1.43, 0], [-.85, 1.33, 0], [-1.22, 1.22, 0]];
  const curve = new THREE.CatmullRomCurve3(spinePts.map(p => new THREE.Vector3(...p)));
  for (let i = 0, n = S(30); i <= n; i++) { const p = curve.getPoint(i / n); add(sp, box(.07, .09, .09), bone, [p.x, p.y, p.z]); add(sp, box(.025, .08, .03), bone, [p.x, p.y + .07, 0]); }
  const tB = grp(sp, [-1.25, 1.22, 0]), tc = new THREE.CatmullRomCurve3(tailPts.map(p => new THREE.Vector3(...p)));
  for (let i = 1, n = S(20); i <= n; i++) { const p = tc.getPoint(i / n), s = 1 - i / n * .5; add(tB, box(.06 * s, .05 * s, .05 * s), bone, [p.x, p.y, p.z]); }
  const rc = part('ribcage');
  for (let i = 0; i < 13; i++) { const x = .98 - i * .07, rr = .2 + .12 * Math.sin(Math.min(1, (i + 2) / 11) * Math.PI * .62); add(rc, tor(rr, .014, 6, 28, Math.PI * 1.6), bone, [x, 1.42 - rr, 0], [0, Math.PI / 2, 5.34]); }
  add(rc, box(.85, .03, .05), bone, [.55, 1.42 - .6, 0], [0, 0, .08]);
  const lb = part('limbs'), bLegs = [];
  hips.forEach((h, i) => { const p = grp(lb, h); add(p, cyl(.035, .03, .47, 10), bone, [0, -.24, 0]); add(p, sph(.045, 10), bone, [0, -.47, 0]); add(p, cyl(.028, .024, .46, 10), bone, [0, -.71, 0]); add(p, box(.14, .04, .08), bone, [.04, -.96, 0]); bLegs.push(p); });
  [-1, 1].forEach(s => add(lb, box(.32, .2, .02), bone, [.95, 1.2, s * .25], [0, 0, -.5]));
  add(lb, box(.36, .12, .3), bone, [-.98, 1.17, 0], [0, 0, .2]);
  // organs
  add(part('brain'), sph(.19, 24), mat(0xf2a5b4, .6), [1.5, 1.68, 0], [0, 0, 0], [1.15, .78, .85]);
  add(part('heart'), sph(.1, 20), mat(0xd23a2e, .45, .05), [.74, .92, .02], [0, 0, -.5], [1, 1.25, .95]);
  const lu = part('lungs'); [-1, 1].forEach(s => add(lu, sph(.2, 22), mat(0xf08b9b, .7), [.6, 1.08, s * .14], [0, 0, -.2], [1.45, .95, .55]));
  add(part('stomach'), tor(.13, .07, 12, 24, Math.PI * 1.3), mat(0xe8a35e, .6), [.15, .95, .1], [Math.PI / 2, 0, .4]);
  const P = { walk: false, purr: 0 }; let ph = 0, ang = 0, back = 0;
  return {
    root, parts, params: P, view: [.35, .3, 1.2], sliceAxis: 'z', shells: ['skin'],
    explode: { skin: [0, 0, .32], skull: [.14, .1, 0], spine: [0, .16, 0], ribcage: [0, .02, -.18], limbs: [0, -.12, -.12], brain: [.18, .2, .1], heart: [.06, -.14, .22], lungs: [.06, .02, .3], stomach: [-.08, -.14, .26] },
    pet() { P.purr = 2.6; },
    update(dt, t) {
      const walking = P.walk; if (walking) { ph += dt * 7; ang += dt * .45; back = 1; } else if (back > 0) { back = Math.max(0, back - dt * 1.5); ang *= .92; ph *= .9; }
      const sw = walking ? .42 : .42 * back;
      [sLegs, bLegs].forEach(L => L.forEach((p, i) => p.rotation.z = Math.sin(ph + gait[i]) * sw));
      const Rr = .7; root.rotation.y = ang; root.position.set(Rr * Math.sin(ang), walking ? Math.abs(Math.sin(ph)) * .03 : 0, Rr * Math.cos(ang) - Rr);
      const wag = Math.sin(t * (P.purr > 0 ? 5 : 1.6)) * (P.purr > 0 ? .35 : .15); tail.rotation.y = wag; tB.rotation.y = wag;
      head.rotation.z = skull.rotation.z = Math.sin(t * .8) * .04;
      if (P.purr > 0) { P.purr -= dt; const v = Math.sin(t * 160) * .006; sk.children[0].scale.y = .44 + v; } else sk.children[0].scale.y = .44;
    }
  };
}
