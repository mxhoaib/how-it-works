// Shared play layer: assemble puzzle, find-the-part quiz, timers, local leaderboards, score cards and challenge links.
// Loaded lazily, only when a play mode is opened.
import * as THREE from 'three';
const MODES = { assemble: 'Assemble it', quiz: 'Find the part', run: 'Run the engine', print: 'Print', pet: 'Pet and walk', drive: 'Drive', fly: 'Fly', peel: 'Open it layer by layer', water: 'Water test', press: 'Press the key', zoom: 'Zoom to transistors', load: 'Run a load', hinge: 'Open the lid', write: 'Write data' };
const HIGHER = { fly: true, press: true };
let G = null;
const fmt = ms => { const s = ms / 1000, m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`; };
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const util = { fmt, el, esc };

// ---------- leaderboard ----------
export function board(slug, mode) {
  const key = `hiw:${slug}:${mode}`, hi = !!HIGHER[mode];
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; } };
  return {
    list: read,
    add(v, s) { const l = read(); const e = { v, s, d: Date.now() }; l.push(e); l.sort((a, b) => hi ? (b.v - a.v) : (a.v - b.v)); const top = l.slice(0, 5); try { localStorage.setItem(key, JSON.stringify(top)); } catch (er) { } return { rank: top.indexOf(e) + 1, best: top[0], top }; },
  };
}
// ---------- session (fullscreen stage + HUD) ----------
export function session(api, mode, opts = {}) {
  const { state } = api, saved = { ...state, layers: { ...state.layers }, colors: { ...state.colors } };
  api.playing = true; document.body.classList.add('playing');
  Object.assign(state, { rot: false, axis: 'off', depth: 1, sel: null, xr: false, wf: false }); api.D.layers.forEach(l => state.layers[l] = true);
  api.select(null); api.setEx(opts.ex || 0); api.applyAll(); api.homeView(); api.resize(); api.setRun();
  const hud = el('div', 'hud'); hud.innerHTML = `<div class="bar"><div class="glass"><span class="muted" style="font-size:13px;display:block">${esc(MODES[mode])}</span><b class="tm">0:00.0</b></div><div style="display:flex;gap:8px;align-items:center"><div class="glass sc" hidden></div><button class="exit" type="button">Exit</button></div></div><div class="prompt"></div>`;
  api.stage.append(hud);
  const S = { hud, t0: 0, running: false, extra: 0, ended: false, cleanups: [],
    q: s => hud.querySelector(s),
    prompt(h, small) { hud.querySelector('.prompt').innerHTML = esc(h) + (small ? `<small>${esc(small)}</small>` : ''); },
    score(h) { const s = hud.querySelector('.sc'); s.hidden = !h; s.innerHTML = h; },
    start() { S.t0 = performance.now(); S.running = true; },
    elapsed() { return S.running ? performance.now() - S.t0 + S.extra : S.final || 0; },
    stopTimer() { S.final = S.elapsed(); S.running = false; return S.final; },
    on(target, ev, fn, o) { target.addEventListener(ev, fn, o); S.cleanups.push(() => target.removeEventListener(ev, fn, o)); },
    exit() {
      if (S.ended) return; S.ended = true; S.cleanups.forEach(f => f()); api.hooks.delete(tick); hud.remove(); api.canvas.style.cursor = '';
      if (opts.onExit) opts.onExit();
      api.playing = false; api.freeCam = false; api.skip = null; api.controls.enabled = true; document.body.classList.remove('playing');
      Object.assign(state, saved); api.applyAll(); api.select(null); api.homeView(); api.resize(); api.setRun(); G = null;
    },
  };
  const tick = (dt, t) => { if (S.running) S.q('.tm').textContent = fmt(S.elapsed()); if (opts.tick) opts.tick(dt, t); };
  if (opts.countdown) S.q('.tm').textContent = fmt(opts.countdown);
  api.hooks.add(tick);
  S.on(hud.querySelector('.exit'), 'click', () => S.exit());
  if ((mode === 'drive' || mode === 'fly') && typeof MediaRecorder !== 'undefined' && api.canvas.captureStream) {
    const rb = el('button', 'exit clipbtn'); rb.type = 'button'; rb.textContent = 'Record a clip'; rb.setAttribute('aria-label', 'Record a 6 second clip');
    hud.querySelector('.exit').before(rb); let busy = false;
    S.on(rb, 'click', async () => { if (busy) return; busy = true; try { const c = await import('./clip.js'); await c.record(api, rb); } catch (e) { api.toast && api.toast('Recording is not available here'); } busy = false; });
  }
  S.on(document, 'keydown', e => { if (e.key === 'Escape') S.exit(); });
  return S;
}
// ---------- result + share card ----------
export function result(api, S, mode, { v, s, headline, sub, unit = 'time', challenge }) {
  const lb = board(api.D.slug, mode), r = lb.add(v, s), show = x => unit === 'time' ? fmt(x.v) : `${x.v} ${unit}`;
  let ch = '';
  if (challenge && Number.isFinite(challenge.v)) { const won = HIGHER[mode] ? v > challenge.v : v < challenge.v; ch = `<p style="font-weight:600;color:${won ? '#30d158' : '#ff453a'}">${won ? 'You beat the challenge' : 'Challenge to beat'}: ${esc(unit === 'time' ? fmt(challenge.v) : challenge.v + ' ' + unit)}</p>`; }
  const box = el('div', 'result'); box.innerHTML = `<div class="box" role="dialog" aria-label="Result"><p class="eyebrow">${esc(MODES[mode])}${r.rank === 1 ? ' · New best' : ''}</p><h3>${esc(headline)}</h3><p class="muted">${esc(sub || '')}</p>${ch}<p class="muted" style="margin:0;font-size:14px">Your best on this device</p><ol>${r.top.map(x => `<li>${show(x)}${x.s != null && unit === 'time' ? ` · ${x.s} pts` : ''}</li>`).join('')}</ol><div class="acts"><button class="btn accent" type="button" data-a="again">Play again</button><button class="btn" type="button" data-a="share">Share score</button><button class="btn ghost" type="button" data-a="exit">Exit</button></div></div>`;
  S.hud.append(box);
  box.querySelector('[data-a=again]').onclick = () => { S.exit(); api.startMode(mode, challenge); };
  box.querySelector('[data-a=exit]').onclick = () => S.exit();
  box.querySelector('[data-a=share]').onclick = () => shareScore(api, mode, v, s, headline);
}
function card(api, headline) {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 630; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 1200, 630);
  try { api.R.render(api.scene, api.camera); const src = api.canvas, k = Math.max(560 / src.width, 630 / src.height), w = src.width * k, h = src.height * k; x.drawImage(src, 1200 - 560 + (560 - w) / 2, (630 - h) / 2, w, h); const g = x.createLinearGradient(640, 0, 760, 0); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(640, 0, 120, 630); } catch (e) { }
  x.fillStyle = api.D.accent; x.font = '700 22px Inter, -apple-system, Segoe UI, Arial'; x.fillText('HOW THINGS WORK · ' + api.D.name.toUpperCase(), 64, 110);
  x.fillStyle = '#f5f5f7'; x.font = '700 64px Inter, -apple-system, Segoe UI, Arial';
  const words = headline.split(' '); let line = '', y = 210; for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > 600) { x.fillText(line, 64, y); y += 72; line = w; } else line = t; } x.fillText(line, 64, y);
  x.fillStyle = '#a1a1a6'; x.font = '500 30px Inter, -apple-system, Segoe UI, Arial'; x.fillText('Can you beat it?', 64, y + 70); x.font = '500 22px Inter, Arial'; x.fillText('mxhoaib.github.io/how-it-works', 64, 570);
  return c;
}
const b64 = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
export async function shareScore(api, mode, v, s, headline) {
  const url = `${api.D.url}?c=${b64({ g: mode, v: Math.round(v * 10) / 10, s })}`, text = `${headline}. Can you beat it?`;
  const c = card(api, headline), blob = await new Promise(r => c.toBlob(r, 'image/png')), file = blob && new File([blob], `${api.D.slug}-${mode}-score.png`, { type: 'image/png' });
  window.__lastShare = { url, text };
  try { if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text, url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text, url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); api.toast('Challenge link copied · score card downloaded'); } catch (e) { api.toast('Score card downloaded'); }
  if (blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
}
export function challenge(c, api) {
  let o; try { o = unb64(c); } catch (e) { return; }
  if (!o || !api.D.modes.includes(o.g) || !Number.isFinite(+o.v)) return;
  const unit = o.g === 'fly' ? `${+o.v} rings` : fmt(+o.v), b = el('div', 'challenge');
  b.innerHTML = `<span>Challenge: ${esc(MODES[o.g])} · beat <b>${esc(unit)}</b></span><button class="btn" type="button">Accept</button><button type="button" aria-label="Dismiss" style="background:none;border:0;color:#fff;min-width:36px;min-height:36px;cursor:pointer">×</button>`;
  api.stage.append(b); b.querySelector('.btn').onclick = () => { b.remove(); api.startMode(o.g, { v: +o.v, s: o.s }); }; b.lastChild.onclick = () => b.remove();
}
// ---------- input (keyboard + touch joystick + hold buttons) ----------
export function input(S, buttons = []) {
  const keys = new Set(), joy = { x: 0, y: 0 }, held = new Set();
  S.on(document, 'keydown', e => { keys.add(e.code); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); });
  S.on(document, 'keyup', e => keys.delete(e.code));
  S.on(window, 'blur', () => keys.clear());
  const touch = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
  if (touch) {
    const j = el('div', 'joy ctrl', '<i></i>'); j.setAttribute('aria-label', 'Joystick'); S.hud.append(j); const knob = j.firstChild; let id = null;
    const mv = e => { const r = j.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; };
    S.on(j, 'pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); mv(e); e.preventDefault(); });
    S.on(j, 'pointermove', e => { if (e.pointerId === id) mv(e); });
    const up = e => { if (e.pointerId !== id) return; id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
    S.on(j, 'pointerup', up); S.on(j, 'pointercancel', up);
  }
  if (buttons.length) {
    const w = el('div', 'vbtns ctrl'); S.hud.append(w);
    buttons.forEach(([name, label]) => { const b = el('button', '', esc(label)); b.type = 'button'; b.dataset.b = name; w.append(b);
      S.on(b, 'pointerdown', e => { held.add(name); b.classList.add('on'); b.setPointerCapture(e.pointerId); e.preventDefault(); });
      const rel = () => { held.delete(name); b.classList.remove('on'); }; S.on(b, 'pointerup', rel); S.on(b, 'pointercancel', rel); });
  }
  if (!touch) { const k = el('div', 'kbd', S.kbdHint || 'W A S D or arrow keys'); S.hud.append(k); S.kbdEl = k; }
  const k = (...c) => c.some(x => keys.has(x)) ? 1 : 0;
  return { keys, joy, held, k, touch,
    axis() { return { x: Math.max(-1, Math.min(1, joy.x + k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft'))), y: Math.max(-1, Math.min(1, joy.y + k('KeyS', 'ArrowDown') - k('KeyW', 'ArrowUp'))) }; } };
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function flash(api, color) { const f = el('div', 'flash'); f.style.background = color; api.stage.append(f); setTimeout(() => f.remove(), 600); }
// ---------- assemble ----------
function assemble(api, challenge) {
  const { prep, camera, canvas, stage } = api; if (api.mdl.params) { api.mdl.params.walk = false; }
  const S = session(api, 'assemble'); const parts = prep.list.filter(p => p.obj.visible), placed = new Set(), n = parts.length;
  api.skip = new Set(parts.map(p => p.id));
  const homeC = {}, v = new THREE.Vector3();
  parts.forEach(p => { p.obj.position.copy(p.home); if (p.spread) p.spread.forEach(s => s.o.position.copy(s.home)); });
  api.mdl.root.updateMatrixWorld(true);
  parts.forEach(p => homeC[p.id] = p.obj.localToWorld(p.local.clone()));
  const order = shuffle(parts.slice()), asp = stage.clientWidth / stage.clientHeight;
  order.forEach((p, i) => {
    const a = i / n * Math.PI * 2 + Math.random() * .5, c = homeC[p.id].clone().project(camera);
    const nx = Math.cos(a) * (asp > 1 ? .72 : .62), ny = Math.sin(a) * (asp > 1 ? .55 : .5) - .05;
    const target = new THREE.Vector3(nx, ny, c.z).unproject(camera); p.obj.position.add(target.sub(homeC[p.id]));
  });
  S.score(`<b>0</b> / ${n} placed`); S.prompt('Drag each part back into place', 'The clock starts on your first move');
  const ring = el('div', 'snap'); stage.append(ring); S.cleanups.push(() => ring.remove());
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3();
  let drag = null;
  const scr = w => { v.copy(w).project(camera); return [(v.x + 1) / 2 * stage.clientWidth, (1 - v.y) / 2 * stage.clientHeight]; };
  const toRay = e => { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); };
  S.on(stage, 'pointerdown', e => {
    if (e.target !== canvas || S.ended) return; const h = api.pick(e, p => !placed.has(p.id) && api.skip.has(p.id)); if (!h) return;
    const p = prep.byId[h.id]; if (!S.running) S.start();
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), h.point);
    drag = { p, grab: h.point.clone().sub(p.obj.position), id: e.pointerId }; api.controls.enabled = false; canvas.setPointerCapture(e.pointerId);
    api.state.sel = p.id; api.applyMaterials(); api.state.sel = null;
    const [x, y] = scr(homeC[p.id]); ring.style.display = 'block'; ring.style.transform = `translate(${x}px,${y}px)`;
  }, true);
  S.on(stage, 'pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return; toRay(e); if (ray.ray.intersectPlane(plane, hit)) drag.p.obj.position.copy(hit.sub(drag.grab));
    const [x, y] = scr(homeC[drag.p.id]); ring.style.transform = `translate(${x}px,${y}px)`;
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return; const p = drag.p; drag = null; api.controls.enabled = true; ring.style.display = 'none';
    const cur = p.obj.localToWorld(p.local.clone()), [ax, ay] = scr(cur), [bx, by] = scr(homeC[p.id]);
    const tol = Math.max(44, Math.min(stage.clientWidth, stage.clientHeight) * .08);
    if (Math.hypot(ax - bx, ay - by) < tol || cur.distanceTo(homeC[p.id]) < prep.size * .05) {
      p.obj.position.copy(p.home); placed.add(p.id); flash(api, api.D.accent); S.score(`<b>${placed.size}</b> / ${n} placed`);
      S.prompt(api.D.parts[p.id]?.name || p.id, placed.size < n ? 'Snapped into place' : '');
      if (placed.size === n) { const t = S.stopTimer(); S.prompt('Assembled!'); setTimeout(() => result(api, S, 'assemble', { v: t, s: n, headline: `I assembled the ${api.D.name.toLowerCase()} in ${fmt(t)}`, sub: `${n} parts`, challenge }), 500); }
    }
    api.applyMaterials();
  };
  S.on(stage, 'pointerup', end); S.on(stage, 'pointercancel', end);
  return S;
}
// ---------- quiz ----------
function quiz(api, challenge) {
  const S = session(api, 'quiz', { ex: api.mdl.quizEx ?? .32 }), D = api.D;
  // only ask for parts you can actually tap from the starting view (small inner parts can hide behind others)
  api.mdl.root.updateMatrixWorld(true); const c = api.canvas.getBoundingClientRect(), seen = new Map();
  for (let gx = 0; gx < 30; gx++) for (let gy = 0; gy < 22; gy++) { const x = c.left + 16 + (c.width - 32) * (gx + .5) / 30, y = c.top + 150 + (c.height - 210) * (gy + .5) / 22, h = api.pick({ clientX: x, clientY: y }); if (h) seen.set(h.id, (seen.get(h.id) || 0) + 1); }
  let pool = api.prep.list.filter(p => p.obj.visible && seen.get(p.id) >= 3).map(p => p.id); if (pool.length < 4) pool = api.prep.list.filter(p => p.obj.visible).map(p => p.id);
  const ids = shuffle(pool).slice(0, Math.min(8, pool.length));
  let i = 0, first = true, score = 0, down = null;
  const ask = () => (api.quizTarget = ids[i], S.prompt(`Tap the ${D.parts[ids[i]].name.toLowerCase()}`, `Round ${i + 1} of ${ids.length} · wrong taps add 3 s`));
  ask(); S.score(`<b>0</b> pts`);
  S.on(api.canvas, 'pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  S.on(api.canvas, 'pointerup', e => {
    if (!down || S.ended || i >= ids.length) return; const d = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (d > 8) return;
    const h = api.pick(e); if (!h) return; if (!S.running) S.start();
    if (h.id === ids[i]) {
      if (first) score++; S.score(`<b>${score}</b> pts`); flash(api, '#30d158'); api.state.sel = h.id; api.applyMaterials();
      setTimeout(() => { if (S.ended) return; api.state.sel = null; api.applyMaterials(); }, 450);
      i++; first = true;
      if (i >= ids.length) { const t = S.stopTimer(); S.prompt('Done!'); setTimeout(() => result(api, S, 'quiz', { v: t, s: score, headline: `I found ${score}/${ids.length} ${api.D.name.toLowerCase()} parts in ${fmt(t)}`, sub: `${score} of ${ids.length} first time`, challenge }), 500); }
      else ask();
    } else { first = false; S.extra += 3000; flash(api, '#ff453a'); api.toast(`That's the ${D.parts[h.id].name.toLowerCase()} (+3 s)`); }
  });
  return S;
}
export async function start(mode, api, ch) {
  if (G) G.exit();
  if (mode === 'assemble') G = assemble(api, ch);
  else if (mode === 'quiz') G = quiz(api, ch);
  else { const m = await import(`./play/${mode}.js`); G = m.start(api, { session, result, input, board, util, challenge: ch }); }
  api.G = G; return G;
}
