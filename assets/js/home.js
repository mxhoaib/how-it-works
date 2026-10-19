// Home: black hero with a slowly rotating engine that explodes on scroll; gallery cards turn their model on hover.
import * as THREE from 'three';
import { makeRenderer, setupScene, shadowPlane, prepare, applyExplode, fitCamera, isMobile, reduced } from './core.js';
const $ = s => document.querySelector(s), hero = $('#hero'), h2 = $('#h2'), copy = $('.hero .copy');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .1 });
document.querySelectorAll('.reveal').forEach(el => rv.observe(el));
let p = 0;
function onScroll() {
  const r = hero.getBoundingClientRect(); p = clamp(-r.top / Math.max(1, r.height - innerHeight));
  copy.style.opacity = 1 - clamp(p * 2.2); copy.style.transform = `translateY(${-p * 80}px)`; copy.style.pointerEvents = p > .3 ? 'none' : '';
  const q = clamp((p - .38) / .35); h2.style.opacity = q; h2.style.transform = `translateY(${(1 - q) * 40}px)`;
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
// hero renderer
(async () => {
  const c = $('#hc'), R = makeRenderer(c), scene = setupScene(R, true), cam = new THREE.PerspectiveCamera(35, 1, .1, 1000);
  const mdl = (await import('./models/car-engine.js')).build(); scene.add(mdl.root); const prep = prepare(mdl); scene.add(shadowPlane(prep, true));
  const size = () => { R.setSize(c.clientWidth, c.clientHeight, false); cam.aspect = c.clientWidth / c.clientHeight; cam.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  const target = fitCamera(cam, prep, [.2, .28, 1], cam.aspect, isMobile ? 1.15 : 1.45);
  const base = cam.position.clone().sub(target); let ang = 0, vis = true, t = 0, last = performance.now();
  new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(hero);
  function loop(now) {
    requestAnimationFrame(loop); if (!vis || document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    if (!reduced) { ang += dt * .18; mdl.update(dt, t, mdl.params); }
    applyExplode(prep, reduced ? .45 : (1 - Math.pow(1 - p, 2)) * .85);
    const pos = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang).multiplyScalar(1 + p * .35);
    cam.position.copy(target).add(pos); cam.lookAt(target); R.render(scene, cam);
  }
  requestAnimationFrame(loop); hero.classList.add('ready');
})().catch(e => console.warn('hero 3D unavailable', e));
// category filters
const grid = $('#mgrid');
document.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('on', x === b)); const f = b.dataset.f;
  grid.classList.toggle('filtered', f !== 'all'); grid.querySelectorAll('.card3').forEach(c => { c.hidden = f !== 'all' && c.dataset.tag !== f; if (!c.hidden) c.classList.add('in'); });
}));
// card hover: one shared renderer, moved into whichever card is hovered
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let R, scene, cam, cur = null, mdl = null, prep = null, raf = 0, ang = 0;
  const cache = {};
  async function show(card) {
    const slug = card.dataset.slug; cur = card;
    if (!R) { const cv = document.createElement('canvas'); R = makeRenderer(cv, true); R.setClearColor(0x000000, 0); scene = setupScene(R); cam = new THREE.PerspectiveCamera(35, 4 / 3, .1, 1000); }
    const m = cache[slug] || (cache[slug] = await import(`./models/${slug}.js`).then(mod => { const b = mod.build(); const pr = prepare(b); return { b, pr }; }));
    if (cur !== card) return;
    if (mdl) scene.remove(mdl.root); mdl = m.b; prep = m.pr; scene.add(mdl.root);
    const media = card.querySelector('.media'); media.append(R.domElement); R.setSize(media.clientWidth, media.clientHeight, false); cam.aspect = media.clientWidth / media.clientHeight;
    const target = fitCamera(cam, prep, mdl.view, cam.aspect, .98); const base = cam.position.clone().sub(target); ang = 0;
    card.querySelector('img').style.opacity = 0;
    cancelAnimationFrame(raf); let t = 0, last = performance.now();
    const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; ang += dt * .9; mdl.update && mdl.update(dt, t, mdl.params); cam.position.copy(target).add(base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang)); cam.lookAt(target); R.render(scene, cam); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  }
  function hide(card) { if (cur !== card) return; cur = null; cancelAnimationFrame(raf); card.querySelector('img').style.opacity = 1; R && R.domElement.remove(); }
  document.querySelectorAll('.card3').forEach(card => { card.addEventListener('pointerenter', () => show(card).catch(() => { })); card.addEventListener('pointerleave', () => hide(card)); });
}
