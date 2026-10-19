import { THREE, model, add, grp, box, cyl, mat, glow, rbox, pcbTex, ctex, merge, MOBILE } from '../kit.js';
export function dieTex() {
  return ctex(512, 384, (x, w, h) => { x.fillStyle = '#2a2f3a'; x.fillRect(0, 0, w, h);
    const blk = (X, Y, W, H, c) => { x.fillStyle = c; x.fillRect(X, Y, W, H); x.strokeStyle = 'rgba(255,255,255,.18)'; x.strokeRect(X + .5, Y + .5, W - 1, H - 1); };
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) blk(16 + i * 74, 16 + j * 176, 66, 160, '#5c4a8f');
    blk(16, 120, 290, 48, '#2f6d6b'); blk(316, 16, 180, 248, '#7a3d4a'); blk(316, 276, 180, 92, '#6b5a2a'); blk(16, 360 - 8, 290, 16, '#3a4a6a');
    x.globalAlpha = .25; for (let k = 0; k < 4000; k++) { x.fillStyle = Math.random() > .5 ? '#9ab' : '#456'; x.fillRect(Math.random() * w, Math.random() * h, 2, 1); } });
}
export function build() {
  const { root, parts, part } = model();
  const S2 = 3.2, gold = mat(0xd9b45a, .3, .95), nickel = mat(0xd3d6da, .22, .95);
  const ct = part('contact-pads'), pads = [], n = MOBILE ? 24 : 34;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = -S2 / 2 + .12 + i * (S2 - .24) / (n - 1), z = -S2 / 2 + .12 + j * (S2 - .24) / (n - 1); if (Math.abs(x) < .5 && Math.abs(z) < .5) continue; const g = new THREE.BoxGeometry(.045, .012, .045); g.translate(x, .006, z); pads.push(g); }
  add(ct, merge(pads), gold);
  const sb = part('substrate'); add(sb, box(S2, .1, S2), mat(0xffffff, .55, .1, { map: pcbTex('#1f4d2c') }), [0, .062, 0]); add(sb, box(.1, .102, .1), gold, [-S2 / 2 + .1, .062, S2 / 2 - .1]);
  const cp = part('capacitors'), caps = []; for (let i = 0; i < (MOBILE ? 30 : 60); i++) { const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * .3, g = new THREE.BoxGeometry(.08, .04, .04); g.rotateY(Math.round(Math.random()) * Math.PI / 2); g.translate(Math.cos(a) * r * (Math.abs(Math.cos(a)) > .7 ? 1 : .2) , .13, Math.sin(a) * r * (Math.abs(Math.cos(a)) > .7 ? .5 : 1)); caps.push(g); }
  add(cp, merge(caps), mat(0x9b7a52, .5, .3)); const caps2 = []; for (let i = 0; i < 40; i++) { const g = new THREE.BoxGeometry(.06, .03, .03); g.translate((Math.random() - .5) * .9, .0, (Math.random() - .5) * .9); caps2.push(g); } add(cp, merge(caps2), mat(0x9b7a52, .5, .3));
  const di = part('die'); add(di, box(1.4, .06, 1.05), mat(0xffffff, .2, .6, { map: dieTex() }), [0, .142, 0]);
  const tm = part('thermal-interface'); add(tm, box(1.42, .02, 1.07), mat(0x9aa0a6, .45, .7), [0, .183, 0]);
  const se = part('sealant'), sl = []; [[0, 1.42], [0, -1.42]].forEach(([x, z]) => { const g = new THREE.BoxGeometry(2.86, .05, .06); g.translate(x, .137, z); sl.push(g); }); [[1.42, 0], [-1.42, 0]].forEach(([x, z]) => { const g = new THREE.BoxGeometry(.06, .05, 2.86); g.translate(x, .137, z); sl.push(g); }); add(se, merge(sl), mat(0x1f1f22, .7));
  const ih = part('heat-spreader'); add(ih, rbox(2.9, .06, 2.9, .05), nickel, [0, .15, 0]); add(ih, rbox(2.3, .14, 2.3, .06), nickel, [0, .25, 0]);
  [[-1.15, 0], [1.15, 0]].forEach(([x]) => add(ih, box(.25, .061, .6), mat(0xa8adb3, .4, .9), [x * 1.18, .15, 0]));
  return {
    root, parts, quizEx: .7, view: [.6, 1.0, .9], sliceAxis: 'x', shells: ['heat-spreader'],
    zoom: [
      { label: 'The processor package', sub: 'Metal lid, circuit-board substrate and contacts', bar: '≈ 1 cm', mag: '1×' },
      { label: 'The silicon die', sub: 'Lid and thermal paste removed', bar: '≈ 3 mm', mag: '4×', focus: [0, .17, 0], k: .42, hide: ['heat-spreader', 'thermal-interface', 'sealant'] },
      { label: 'One CPU core', sub: 'Billions of transistors share this sliver of silicon', bar: '≈ 1 mm', mag: '15×', focus: [-.56, .17, -.25], k: .14, hide: ['heat-spreader', 'thermal-interface', 'sealant'] },
      { label: 'A single FinFET transistor', sub: 'The gold gate wraps the fins; blue dots are electrons flowing source → drain', bar: '≈ 50 nm', mag: '1,000,000×', nano: true, k: 1.1 }
    ],
    explode: { 'heat-spreader': [0, .45, 0], 'thermal-interface': [0, .3, 0], sealant: [0, .2, .05], die: [0, .16, 0], capacitors: [0, .08, 0], substrate: [0, 0, 0], 'contact-pads': [0, -.18, 0] }
  };
}
