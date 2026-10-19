// Object-page viewer: lazy WebGL init, scroll story, slice, explode, picking, layers, share & PNG.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeRenderer, setupScene, shadowPlane, prepare, applyExplode, fitCamera, isMobile, reduced } from './core.js';

const D = JSON.parse(document.getElementById('model-data').textContent);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const stage = $('#stage'), canvas = $('#c'), clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const accent = new THREE.Color(D.accent);
const state = { ex: reduced ? .5 : 0, axis: 'off', depth: 1, layers: Object.fromEntries(D.layers.map(l => [l, true])), wf: false, xr: false, rot: !reduced, sel: null, colors: {} };
const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
let R, scene, camera, controls, mdl, prep, ready = false, inView = false, t = 0, homeCam, homeTarget, tween = null, step = null;
const hooks = new Set(), clock = new THREE.Clock();
const api = { THREE, D, state, accent, hooks, stage, canvas, isMobile, reduced, playing: false };
window.__hiw = api; // handy for debugging and automated QA

function toast(msg) { let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); } el.textContent = msg; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2200); }
api.toast = toast;

// ---------- state application ----------
function setEx(v) { state.ex = clamp(v); if (prep) applyExplode(prep, state.ex, api.skip); syncUI(); }
function applyClip() {
  if (!R) return;
  if (state.axis === 'off') { R.clippingPlanes = []; return; }
  const b = prep.box, ax = state.axis, lo = b.min[ax], hi = b.max[ax], pad = (hi - lo) * .01;
  plane.normal.set(ax === 'x' ? -1 : 0, ax === 'y' ? -1 : 0, ax === 'z' ? -1 : 0);
  plane.constant = lo - pad + (hi - lo + pad * 2) * state.depth; R.clippingPlanes = [plane];
}
function applyMaterials() {
  if (!prep) return;
  for (const p of prep.list) {
    const meta = D.parts[p.id] || {}; p.obj.visible = state.layers[meta.layer] !== false;
    const isSel = state.sel === p.id;
    for (const m of p.mats) {
      const b = m.userData.base; let op = b.opacity, tr = b.transparent;
      m.color.copy(b.color); if (state.colors[p.id]) m.color.set(state.colors[p.id]); else if (isSel) m.color.lerp(accent, .55);
      if (state.xr) { op = Math.min(op, .28); tr = true; }
      if (state.sel && !isSel) { op = Math.min(op, .15); tr = true; }
      if (m.transparent !== tr) m.needsUpdate = true;
      m.transparent = tr; m.opacity = op; m.depthWrite = tr ? false : b.depthWrite; m.wireframe = state.wf;
      if (isSel) { m.emissive.copy(accent); m.emissiveIntensity = state.colors[p.id] ? .12 : .35; } else { m.emissive.copy(b.emissive); m.emissiveIntensity = b.ei; }
    }
  }
}
function applyAll() { if (!prep) return; applyExplode(prep, state.ex, api.skip); applyClip(); applyMaterials(); syncUI(); }
Object.assign(api, { setEx, applyMaterials, applyAll, applyClip });

function syncUI() {
  $$('[data-axis]').forEach(b => b.classList.toggle('on', b.dataset.axis === state.axis));
  $$('.r-depth').forEach(r => { r.value = Math.round(state.depth * 100); r.disabled = state.axis === 'off'; });
  $$('.r-ex').forEach(r => r.value = Math.round(state.ex * 100));
  $$('[data-layer]').forEach(c => c.checked = state.layers[c.dataset.layer] !== false);
  const s = (id, v) => { const el = $(id); if (el) el.checked = v; };
  s('#wf', state.wf); s('#xr', state.xr); s('#ar', state.rot);
  $('#b-rot')?.classList.toggle('on', state.rot); $('#b-ex')?.classList.toggle('on', state.ex > .05); $('#b-sl')?.classList.toggle('on', state.axis !== 'off');
  $$('.chip[data-part]').forEach(c => c.classList.toggle('on', c.dataset.part === state.sel));
}

// ---------- selection & info card ----------
const ids = Object.keys(D.parts);
function select(id) {
  state.sel = id && D.parts[id] ? id : null; applyMaterials(); syncUI();
  const info = $('#info'); if (!info) return;
  if (!state.sel) { info.hidden = true; return; }
  const m = D.parts[state.sel]; info.hidden = false;
  info.querySelector('.eyebrow').textContent = (D.layerNames && D.layerNames[m.layer]) || m.layer;
  info.querySelector('h3').textContent = m.name; info.querySelector('.desc').textContent = m.desc;
  const f = info.querySelector('.fact'); f.hidden = !m.fact; if (m.fact) { f.innerHTML = '<b>Fun fact</b> '; f.append(document.createTextNode(m.fact)); }
  const pc = $('#pc'); const p = prep && prep.byId[state.sel]; if (pc && p) pc.value = '#' + (state.colors[state.sel] ? new THREE.Color(state.colors[state.sel]) : p.mats[0].userData.base.color).getHexString();
}
api.select = select;
$('#info .x')?.addEventListener('click', () => select(null));
$('#nextpart')?.addEventListener('click', () => { const visible = ids.filter(i => state.layers[D.parts[i].layer] !== false); select(visible[(visible.indexOf(state.sel) + 1) % visible.length]); });
$('#pc')?.addEventListener('input', e => { if (!state.sel) return; state.colors[state.sel] = e.target.value; applyMaterials(); });
$$('.chip[data-part]').forEach(c => c.addEventListener('click', () => select(state.sel === c.dataset.part ? null : c.dataset.part)));

// ---------- picking ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function shown(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
const OFF = [[0, 0], [7, 0], [-7, 0], [0, 7], [0, -7], [12, 12], [-12, 12], [12, -12], [-12, -12], [16, 0], [-16, 0], [0, 16], [0, -16]];
function pick(ev, filter) { // tolerant picking: thin parts (cables, rods) are still easy to tap
  if (!prep) return null;
  for (const [dx, dy] of OFF) { const h = pick1(ev.clientX + dx, ev.clientY + dy, filter); if (h) return h; }
  return null;
}
function pick1(cx, cy, filter) {
  const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const objs = prep.list.filter(p => p.obj.visible && (!filter || filter(p))).flatMap(p => p.meshes).filter(shown);
  const hits = ray.intersectObjects(objs, false).filter(h => !R.clippingPlanes.length || plane.distanceToPoint(h.point) >= 0);
  if (!hits.length) return null;
  const h = hits.find(h => !prep.byId[h.object.userData.part].shell) || hits[0];
  return { id: h.object.userData.part, point: h.point };
}
api.pick = pick;
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', e => {
  if (!down || api.playing) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y); const quick = performance.now() - down.t < 600; down = null;
  if (d > 6 || !quick) return; const h = pick(e); select(h ? (h.id === state.sel ? null : h.id) : null);
});

// ---------- hotspots ----------
const hsWrap = $('#hotspots'); const hsEls = {};
function buildHotspots() {
  for (const p of prep.list) {
    const b = document.createElement('button'); b.className = 'hs'; b.type = 'button'; b.setAttribute('aria-label', D.parts[p.id]?.name || p.id); b.title = b.getAttribute('aria-label');
    b.addEventListener('click', () => select(p.id)); hsWrap.append(b); hsEls[p.id] = b;
  }
}
const tmp = new THREE.Vector3();
function updateHotspots() {
  if (!stage.classList.contains('show-hs')) return;
  const w = stage.clientWidth, h = stage.clientHeight;
  for (const p of prep.list) {
    const el = hsEls[p.id]; tmp.copy(p.local); p.obj.localToWorld(tmp);
    const clipped = R.clippingPlanes.length && plane.distanceToPoint(tmp) < 0; tmp.project(camera);
    const off = !p.obj.visible || clipped || tmp.z > 1 || Math.abs(tmp.x) > 1 || Math.abs(tmp.y) > 1;
    el.classList.toggle('off', off); if (!off) el.style.transform = `translate(${(tmp.x + 1) / 2 * w}px,${(1 - tmp.y) / 2 * h}px)`;
  }
}

// ---------- render loop ----------
function resize() {
  if (!R) return; const w = stage.clientWidth, h = stage.clientHeight; R.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
api.resize = resize;
function frame() {
  const dt = Math.min(clock.getDelta(), .05); t += dt;
  if (tween) { tween.k = Math.min(1, tween.k + dt / tween.d); const e = tween.k < .5 ? 2 * tween.k * tween.k : 1 - Math.pow(-2 * tween.k + 2, 2) / 2; tween.fn(tween.a + (tween.b - tween.a) * e); if (tween.k >= 1) tween = null; }
  if (mdl.update && !(reduced && !api.playing)) mdl.update(dt, t, mdl.params);
  hooks.forEach(f => f(dt, t));
  controls.autoRotate = state.rot && !api.playing; if (!api.freeCam) controls.update();
  R.render(scene, camera); updateHotspots();
}
function setRun() { const run = ready && (inView || api.playing) && !document.hidden; R.setAnimationLoop(run ? frame : null); if (run) clock.getDelta(); }
api.setRun = () => setRun();
document.addEventListener('visibilitychange', () => R && setRun());
function animate(a, b, fn, d = .8) { tween = { a, b, fn, d, k: 0 }; }

// ---------- hash / share ----------
const f3 = n => +(+n).toFixed(3);
function hashState() {
  const c = camera.position, g = controls.target, a = [`c=${[c.x, c.y, c.z, g.x, g.y, g.z].map(f3).join(',')}`, `e=${f3(state.ex)}`, `s=${state.axis},${f3(state.depth)}`, `l=${D.layers.filter(l => state.layers[l]).join('.')}`];
  if (state.wf) a.push('w=1'); if (state.xr) a.push('x=1'); if (state.sel) a.push('part=' + state.sel); return a.join('&');
}
function readHash() {
  const h = new URLSearchParams(location.hash.slice(1)); if (![...h.keys()].length) return false;
  const c = (h.get('c') || '').split(',').map(Number);
  if (c.length === 6 && c.every(Number.isFinite)) { camera.position.set(c[0], c[1], c[2]); controls.target.set(c[3], c[4], c[5]); state.rot = false; }
  if (h.has('e')) state.ex = clamp(+h.get('e') || 0);
  if (h.has('s')) { const [ax, d] = h.get('s').split(','); if (['off', 'x', 'y', 'z'].includes(ax)) state.axis = ax; if (Number.isFinite(+d)) state.depth = clamp(+d); }
  if (h.has('l')) { const on = h.get('l').split('.'); D.layers.forEach(l => state.layers[l] = on.includes(l)); }
  state.wf = h.get('w') === '1'; state.xr = h.get('x') === '1';
  applyAll(); select(h.get('part')); controls.update(); return true;
}
async function share() {
  const url = location.origin + location.pathname + '#' + hashState(); history.replaceState(null, '', url);
  try { await navigator.clipboard.writeText(url); toast('Link to this view copied'); return; } catch (e) { }
  if (navigator.share) { try { await navigator.share({ title: document.title, url }); return; } catch (e) { } }
  toast('Copy the link from the address bar');
}
function png() {
  R.render(scene, camera); const a = document.createElement('a'); a.download = `${D.slug}-how-it-works.png`; a.href = canvas.toDataURL('image/png'); a.click(); toast('PNG downloaded');
}
api.hashState = hashState;

function reset() {
  Object.assign(state, { ex: reduced ? .5 : 0, axis: 'off', depth: 1, wf: false, xr: false, rot: !reduced, colors: {} }); D.layers.forEach(l => state.layers[l] = true);
  camera.position.copy(homeCam); controls.target.copy(homeTarget); select(null); applyAll(); history.replaceState(null, '', location.pathname + location.search);
}
api.reset = reset; api.homeView = () => { camera.position.copy(homeCam); controls.target.copy(homeTarget); };

// ---------- controls wiring ----------
const on = (sel, ev, fn) => $$(sel).forEach(el => el.addEventListener(ev, fn));
on('[data-axis]', 'click', e => { state.axis = e.currentTarget.dataset.axis; if (state.axis !== 'off' && state.depth > .97) state.depth = .5; applyClip(); syncUI(); });
on('.r-depth', 'input', e => { state.depth = e.target.value / 100; applyClip(); syncUI(); });
on('.r-ex', 'input', e => setEx(e.target.value / 100));
on('[data-layer]', 'change', e => { state.layers[e.target.dataset.layer] = e.target.checked; if (state.sel && !state.layers[D.parts[state.sel].layer]) select(null); applyMaterials(); });
on('#wf', 'change', e => { state.wf = e.target.checked; applyMaterials(); });
on('#xr', 'change', e => { state.xr = e.target.checked; applyMaterials(); });
on('#ar', 'change', e => { state.rot = e.target.checked; syncUI(); });
on('#b-rot', 'click', () => { state.rot = !state.rot; syncUI(); });
on('#b-ex', 'click', () => { const from = state.ex; animate(from, from > .05 ? 0 : .6, setEx); });
on('#b-sl', 'click', () => { state.axis = state.axis === 'off' ? (D.sliceAxis || 'z') : 'off'; state.depth = state.axis === 'off' ? 1 : .5; applyClip(); syncUI(); });
on('#b-reset', 'click', () => reset());
on('#share', 'click', share); on('#png', 'click', png);
function togglePanel(id) { ['#tools', '#playpanel'].forEach(p => { const el = $(p); if (el) el.hidden = p === id ? !el.hidden : true; }); $('#b-tools')?.classList.toggle('on', !$('#tools').hidden); }
on('#b-tools', 'click', () => togglePanel('#tools'));
on('#b-play', 'click', () => togglePanel('#playpanel'));
document.addEventListener('keydown', e => { if (e.key === 'Escape') { togglePanel(null); if (!api.playing) select(null); } });
let game;
async function startMode(mode, challenge) {
  togglePanel(null);
  if (!ready) await initP;
  game = game || await import('./game.js');
  game.start(mode, api, challenge);
}
api.startMode = startMode;
on('[data-mode]', 'click', e => startMode(e.currentTarget.dataset.mode));

// ---------- scroll story ----------
const markers = $$('.markers a'), steps = $$('.step[data-step]'), story = $('#story'), bar = $('.progress i'), links = $$('.subnav a[href^="#"]');
function enter(id) {
  stage.classList.toggle('show-hs', id === 'parts');
  if (reduced) return;
  if (id === 'overview') { state.axis = 'off'; state.depth = 1; select(null); animate(state.ex, 0, setEx, .6); }
  if (id === 'explode') { state.axis = 'off'; state.depth = 1; select(null); }
  if (id === 'parts') { state.axis = 'off'; state.depth = 1; if (state.ex < .15 || state.ex > .4) animate(state.ex, .25, setEx, .6); }
  if (id === 'facts') { select(null); animate(state.ex, .45, setEx, .8); }
  applyClip(); syncUI();
}
function onScroll() {
  const vh = innerHeight, sr = story.getBoundingClientRect();
  if (bar) bar.style.transform = `scaleX(${clamp(-sr.top / Math.max(1, sr.height - vh))})`;
  let act = null; for (const s of steps) { const r = s.getBoundingClientRect(); if (r.top < vh * .55 && r.bottom > vh * .45) act = s; }
  links.forEach(a => a.classList.toggle('on', act && a.getAttribute('href') === '#' + act.id)); markers.forEach(a => a.classList.toggle('on', act && a.getAttribute('href') === '#' + act.id));
  if (!act || api.playing || !ready) return;
  const id = act.dataset.step; if (id !== step) { step = id; enter(id); }
  if (reduced) return;
  const r = act.getBoundingClientRect(), top = isMobile ? vh * .75 : vh * .35, p = clamp((top - r.top) / Math.max(1, r.height - vh * .6));
  if (id === 'explode') { tween = null; const u = clamp(p / .8); setEx(1 - Math.pow(1 - u, 2.2)); }
  if (id === 'slice') { if (state.axis === 'off') state.axis = D.sliceAxis || 'z'; state.depth = 1 - clamp(p / .85) * .62; applyClip(); syncUI(); }
}
addEventListener('scroll', onScroll, { passive: true });

// ---------- lazy init ----------
let resolveInit; const initP = new Promise(r => resolveInit = r);
async function init() {
  R = makeRenderer(canvas); R.setClearColor(0xf5f5f7, 1); scene = setupScene(R); camera = new THREE.PerspectiveCamera(35, 1, .1, 1000);
  const mod = await import(`./models/${D.slug}.js`); mdl = mod.build(); mdl.params = mdl.params || {}; scene.add(mdl.root);
  prep = prepare(mdl); const sh = shadowPlane(prep); scene.add(sh);
  controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.autoRotateSpeed = .7;
  controls.minDistance = prep.size * .2; controls.maxDistance = prep.size * 4;
  resize(); controls.target.copy(fitCamera(camera, prep, mdl.view, camera.aspect)); controls.update();
  homeCam = camera.position.clone(); homeTarget = controls.target.clone();
  Object.assign(api, { R, scene, camera, controls, mdl, prep, shadow: sh, plane, home: () => ({ cam: homeCam, target: homeTarget }) });
  buildHotspots();
  if (!readHash()) applyAll();
  new ResizeObserver(resize).observe(stage);
  ready = true; frame(); stage.classList.add('ready'); setRun(); onScroll(); resolveInit();
  const qs = new URLSearchParams(location.search), qm = qs.get('mode');
  if (qm && D.modes.includes(qm)) setTimeout(() => startMode(qm), 300);
  const c = qs.get('c');
  if (c && game === undefined) { import('./game.js').then(g => { game = g; g.challenge(c, api); }); }
}
const io = new IntersectionObserver(es => { for (const e of es) { inView = e.isIntersecting; if (inView && !R) init().catch(err => { console.warn(err); $('.loading').textContent = '3D needs WebGL — showing a still image.'; }); else if (R) setRun(); } }, { rootMargin: '200px' });
io.observe(stage);
addEventListener('hashchange', () => { if (ready) readHash(); });
// reveal-on-scroll for text
const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .12 });
$$('.reveal').forEach(el => rv.observe(el));
