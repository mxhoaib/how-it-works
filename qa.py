"""Playwright QA: every page at 1440 and 390. Console errors, failed requests, overflow, WebGL pixel variance,
slice / explode / click-label / share-URL round trip, and the play modes (incl. touch at 390)."""
import asyncio, io, json, sys
from playwright.async_api import async_playwright
from PIL import Image, ImageStat
sys.path.insert(0, '.')
from content import MODELS
BASE = "http://127.0.0.1:8642/how-it-works/"
SHOTS = "shots/"
R = []
def ok(name, cond, info=""): R.append((name, bool(cond), info)); print(("PASS " if cond else "FAIL ") + name + (f"  {info}" if info else ""), flush=True)
def variance(png): im = Image.open(io.BytesIO(png)).convert("L"); return ImageStat.Stat(im).stddev[0]
async def wire(pg, errs):
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    pg.on("requestfailed", lambda r: errs.append("failed: " + r.url))
    pg.on("response", lambda r: errs.append(f"http {r.status}: {r.url}") if r.status >= 400 else None)
    await pg.route("**/gc.zgo.at/**", lambda r: r.fulfill(body="", content_type="text/javascript"))
async def touch(cdp, typ, pts): await cdp.send("Input.dispatchTouchEvent", {"type": typ, "touchPoints": [{"x": x, "y": y} for x, y in pts]})
async def part_xy(pg, pid):
    return await pg.evaluate("""id => { const a = window.__hiw, p = a.prep.byId[id], v = p.local.clone(); p.obj.localToWorld(v); v.project(a.camera);
      const r = a.canvas.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; }""", pid)
async def model_page(b, m, w, h, mobile):
    s, tag = m["slug"], f'{m["slug"]}@{w}'
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
    pg = await ctx.new_page(); errs = []; await wire(pg, errs)
    await pg.goto(BASE + s + "/", wait_until="load"); await pg.wait_for_selector(".stage.ready", timeout=45000); await pg.wait_for_timeout(800)
    ok(f"{tag} no horizontal overflow", await pg.evaluate("document.documentElement.scrollWidth <= innerWidth"))
    v = variance(await pg.locator("#stage").screenshot()); ok(f"{tag} WebGL renders", v > 8, f"stddev={v:.1f}")
    await pg.screenshot(path=f"{SHOTS}{s}-{w}.png")
    # explode (story slider)
    await pg.evaluate("window.__hiw.state.rot=false"); await pg.locator("#explode").scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
    await pg.evaluate("""() => { const r = document.querySelector('#tools .r-ex'); r.value = 60; r.dispatchEvent(new Event('input', {bubbles: true})); }""")
    moved = await pg.evaluate("() => { const a = window.__hiw; return Math.max(...a.prep.list.map(p => p.obj.position.distanceTo(p.home))) / a.prep.size; }")
    ok(f"{tag} explode moves parts", moved > .1, f"max offset {moved:.2f}×size")
    # slice via tools panel
    await pg.evaluate("window.scrollTo(0, document.querySelector('#parts').offsetTop - 60)"); await pg.wait_for_timeout(500)
    await pg.click("#b-tools"); await pg.click(f"#tools [data-axis=y]")
    await pg.evaluate("""() => { const r = document.querySelector('#tools .r-depth'); r.value = 55; r.dispatchEvent(new Event('input', {bubbles: true})); }""")
    sl = await pg.evaluate("() => ({n: window.__hiw.R.clippingPlanes.length, d: window.__hiw.state.depth, ax: window.__hiw.state.axis})")
    ok(f"{tag} slice plane active", sl["n"] == 1 and sl["ax"] == "y" and abs(sl["d"] - .55) < .01, json.dumps(sl))
    await pg.click("#b-tools"); await pg.click(f"#b-sl"); await pg.click(f"#b-sl")  # off then on via pill
    await pg.evaluate("() => { const a = window.__hiw; a.state.axis = 'off'; a.applyClip(); a.setEx(.3); }"); await pg.wait_for_timeout(300)
    # click a part -> label
    pid = await pg.evaluate("""() => { const a = window.__hiw; const ids = a.prep.list.filter(p => !p.shell).map(p => p.id); return ids[Math.floor(ids.length / 2)]; }""")
    x, y = await part_xy(pg, pid)
    if mobile: await pg.touchscreen.tap(x, y)
    else: await pg.mouse.click(x, y)
    await pg.wait_for_timeout(300)
    info = await pg.evaluate("() => ({shown: !document.querySelector('#info').hidden, name: document.querySelector('#info h3').textContent, sel: window.__hiw.state.sel})")
    ok(f"{tag} click shows label", info["shown"] and info["sel"] and info["name"] == m and True or (info["shown"] and info["name"]), json.dumps(info))
    if mobile: await pg.screenshot(path=f"{SHOTS}{s}-{w}-label.png")
    else: await pg.locator("#stage").screenshot(path=f"{SHOTS}{s}-{w}-label.png")
    # share URL round trip
    await pg.evaluate("() => { const a = window.__hiw; a.state.axis = 'x'; a.state.depth = .42; a.setEx(.37); a.state.layers[a.D.layers[a.D.layers.length - 1]] = false; a.applyAll(); }")
    await ctx.grant_permissions(["clipboard-read", "clipboard-write"]) if not mobile else None
    await pg.evaluate("window.__hiw.select(null)"); await pg.click("#b-tools"); await pg.click("#share"); await pg.wait_for_timeout(300)
    url = await pg.evaluate("location.href"); st = await pg.evaluate("() => { const a = window.__hiw; return {e: a.state.ex, ax: a.state.axis, d: a.state.depth, l: {...a.state.layers}, c: a.camera.position.toArray().map(n => +n.toFixed(2))}; }")
    p2 = await ctx.new_page(); e2 = []; await wire(p2, e2); await p2.goto(url); await p2.wait_for_selector(".stage.ready", timeout=45000); await p2.wait_for_timeout(500)
    st2 = await p2.evaluate("() => { const a = window.__hiw; return {e: a.state.ex, ax: a.state.axis, d: a.state.depth, l: {...a.state.layers}, c: a.camera.position.toArray().map(n => +n.toFixed(2))}; }")
    same = abs(st["e"] - st2["e"]) < .002 and st["ax"] == st2["ax"] and abs(st["d"] - st2["d"]) < .002 and st["l"] == st2["l"] and all(abs(a - b) < .05 for a, b in zip(st["c"], st2["c"]))
    ok(f"{tag} share URL round trip", same and "#c=" in url, url.split("#")[1][:80])
    dl = await p2.evaluate(f"() => {{ location.hash = 'part={pid}'; return new Promise(r => setTimeout(() => r(window.__hiw.state.sel), 300)); }}")
    ok(f"{tag} #part deep link", dl == pid, str(dl)); errs += e2; await p2.close()
    # play: assemble (drag one part home) + quiz (tap the named part)
    await pg.evaluate("() => { window.__hiw.reset(); }"); await pg.wait_for_timeout(200)
    await pg.evaluate("window.__hiw.startMode('assemble')"); await pg.wait_for_selector(".hud", timeout=15000); await pg.wait_for_timeout(500)
    # pick an unplaced part and drag its centre to its home position
    pa = await pg.evaluate("""() => { const a = window.__hiw, V = a.THREE.Vector3; const c = a.canvas.getBoundingClientRect();
      const sc = w => { const v = w.clone().project(a.camera); return [c.left + (v.x + 1) / 2 * c.width, c.top + (1 - v.y) / 2 * c.height]; };
      for (const p of a.prep.list.filter(p => !p.shell)) { const cur = p.obj.localToWorld(p.local.clone()), o = p.obj.position.clone(); p.obj.position.copy(p.home); p.obj.updateMatrixWorld(true); const home = p.obj.localToWorld(p.local.clone()); p.obj.position.copy(o); p.obj.updateMatrixWorld(true);
        const s = sc(cur), e = sc(home); const ev = {clientX: s[0], clientY: s[1]}; const h = a.pick(ev); if (h && h.id === p.id && s[0] > 0 && s[1] > 60) return {id: p.id, s, e}; } return null; }""")
    if pa:
        sx, sy = pa["s"]; ex, ey = pa["e"]
        if mobile:
            cdp = await ctx.new_cdp_session(pg); await touch(cdp, "touchStart", [(sx, sy)])
            for k in range(1, 11): await touch(cdp, "touchMove", [(sx + (ex - sx) * k / 10, sy + (ey - sy) * k / 10)]); await pg.wait_for_timeout(16)
            await touch(cdp, "touchEnd", [])
        else:
            await pg.mouse.move(sx, sy); await pg.mouse.down()
            for k in range(1, 11): await pg.mouse.move(sx + (ex - sx) * k / 10, sy + (ey - sy) * k / 10); await pg.wait_for_timeout(16)
            await pg.mouse.up()
        await pg.wait_for_timeout(300)
        placed = await pg.evaluate("document.querySelector('.hud .sc b').textContent")
        ok(f"{tag} assemble drag-to-snap ({'touch' if mobile else 'mouse'})", placed == "1", f"part={pa['id']} placed={placed}")
    else: ok(f"{tag} assemble drag-to-snap", False, "no draggable part found")
    if not mobile: await pg.screenshot(path=f"{SHOTS}{s}-{w}-assemble.png")
    await pg.click(".hud .exit"); await pg.wait_for_timeout(200)
    await pg.evaluate("window.__hiw.startMode('quiz')"); await pg.wait_for_selector(".hud", timeout=15000); await pg.wait_for_timeout(500)
    tgt = await pg.evaluate("window.__hiw.quizTarget")
    # find a pixel on the target: sample around its centre until pick() returns it
    xy = await pg.evaluate("""id => { const a = window.__hiw, p = a.prep.byId[id], c = a.canvas.getBoundingClientRect(), b = new a.THREE.Box3().setFromObject(p.obj);
      for (let i = 0; i < 400; i++) { const v = new a.THREE.Vector3(b.min.x + Math.random() * (b.max.x - b.min.x), b.min.y + Math.random() * (b.max.y - b.min.y), b.min.z + Math.random() * (b.max.z - b.min.z)); const q = v.clone().project(a.camera);
        const x = c.left + (q.x + 1) / 2 * c.width, y = c.top + (1 - q.y) / 2 * c.height; if (y < 140 || y > c.bottom - 40 || x < 10 || x > c.right - 10) continue; const h = a.pick({clientX: x, clientY: y}); if (h && h.id === id) return [x, y]; } return null; }""", tgt)
    if xy:
        if mobile: await pg.touchscreen.tap(*xy)
        else: await pg.mouse.click(*xy)
        await pg.wait_for_timeout(300)
        sc = await pg.evaluate("document.querySelector('.hud .sc b').textContent")
        ok(f"{tag} quiz tap scores", sc == "1", f"target={tgt}")
    else: ok(f"{tag} quiz tap scores", False, f"no visible pixel for {tgt}")
    await pg.click(".hud .exit")
    # model-specific play
    for mode in m["play"]:
        await pg.evaluate(f"window.__hiw.startMode('{mode}')"); await pg.wait_for_selector(".hud", timeout=15000); await pg.wait_for_timeout(600)
        if mode in ("drive", "fly"):
            start = await pg.evaluate("window.__hiw.mdl.root.position.toArray()")
            if mobile:
                cdp = await ctx.new_cdp_session(pg)
                jb = await pg.locator(".joy").bounding_box(); jx, jy = jb["x"] + jb["width"] / 2, jb["y"] + jb["height"] / 2
                if mode == "fly":
                    ub = await pg.locator(".vbtns [data-b=up]").bounding_box(); ux, uy = ub["x"] + ub["width"] / 2, ub["y"] + ub["height"] / 2
                    await touch(cdp, "touchStart", [(ux, uy)]); await pg.wait_for_timeout(1500)
                    await touch(cdp, "touchStart", [(ux, uy), (jx, jy)]); await touch(cdp, "touchMove", [(ux, uy), (jx, jy - 50)]); await pg.wait_for_timeout(1500)
                else:
                    await touch(cdp, "touchStart", [(jx, jy)]); await touch(cdp, "touchMove", [(jx, jy - 55)]); await pg.wait_for_timeout(2500)
                await pg.screenshot(path=f"{SHOTS}{s}-{w}-{mode}.png")
                await touch(cdp, "touchEnd", [])
            else:
                if mode == "fly": await pg.keyboard.down("Space"); await pg.wait_for_timeout(1500); await pg.keyboard.down("KeyW"); await pg.wait_for_timeout(1500); await pg.keyboard.up("Space"); await pg.keyboard.up("KeyW")
                else: await pg.keyboard.down("KeyW"); await pg.wait_for_timeout(2500); await pg.keyboard.up("KeyW")
                await pg.screenshot(path=f"{SHOTS}{s}-{w}-{mode}.png")
            end = await pg.evaluate("window.__hiw.mdl.root.position.toArray()")
            d = sum((a - b) ** 2 for a, b in zip(start, end)) ** .5
            ok(f"{tag} {mode} {'touch' if mobile else 'keyboard'} controls move vehicle", d > 2 and (mode != "fly" or end[1] > 1), f"moved {d:.1f}, alt {end[1]:.1f}")
        elif mode == "run":
            await pg.evaluate("() => { const r = document.querySelector('.hud .rng input'); r.value = 600; r.dispatchEvent(new Event('input')); }")
            ok(f"{tag} run RPM slider", await pg.evaluate("window.__hiw.mdl.params.rpm") == 600)
        elif mode == "print":
            await pg.wait_for_timeout(1500); pr = await pg.evaluate("window.__hiw.mdl.params.print"); ok(f"{tag} print progresses", pr and pr > 0, f"{pr:.3f}")
        elif mode == "pet":
            cx, cy = await part_xy(pg, "heart")
            if mobile: await pg.touchscreen.tap(cx, cy)
            else: await pg.mouse.click(cx, cy)
            await pg.wait_for_timeout(200); ok(f"{tag} pet purrs", await pg.evaluate("window.__hiw.mdl.params.purr") > 0)
            await pg.click(".hud [data-a=walk]"); await pg.wait_for_timeout(1500); ok(f"{tag} walk moves cat", await pg.evaluate("window.__hiw.mdl.root.position.length()") > .2)
        if not mobile or mode in ("pet", "run", "print"): await pg.screenshot(path=f"{SHOTS}{s}-{w}-{mode}.png")
        await pg.click(".hud .exit"); await pg.wait_for_timeout(200)
    ok(f"{tag} no console errors / failed requests", not errs, "; ".join(errs[:4]))
    await ctx.close()
async def home(b, w, h, mobile):
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
    pg = await ctx.new_page(); errs = []; await wire(pg, errs); tag = f"home@{w}"
    await pg.goto(BASE, wait_until="load"); await pg.wait_for_selector(".hero.ready", timeout=45000); await pg.wait_for_timeout(1200)
    v = variance(await pg.screenshot()); ok(f"{tag} hero WebGL renders", v > 8, f"stddev={v:.1f}")
    await pg.screenshot(path=f"{SHOTS}home-{w}.png")
    ok(f"{tag} no horizontal overflow", await pg.evaluate("document.documentElement.scrollWidth <= innerWidth"))
    await pg.evaluate("window.scrollTo(0, innerHeight * .45)"); await pg.wait_for_timeout(900); await pg.screenshot(path=f"{SHOTS}home-{w}-explode.png")
    await pg.evaluate("document.querySelector('#models').scrollIntoView()"); await pg.wait_for_timeout(1200); await pg.screenshot(path=f"{SHOTS}home-{w}-gallery.png")
    await pg.click(".filters [data-f=Vehicles]"); n = await pg.evaluate("[...document.querySelectorAll('.card3')].filter(c => !c.hidden).length"); ok(f"{tag} category filter", n == 2, f"{n} vehicle cards")
    await pg.click(".filters [data-f=all]")
    imgs = await pg.evaluate("Promise.all([...document.images].map(i => (i.loading = 'eager', i.decode().then(() => i.naturalWidth > 0, () => false))))")
    ok(f"{tag} all images load", all(imgs), f"{sum(imgs)}/{len(imgs)}")
    ok(f"{tag} no console errors / failed requests", not errs, "; ".join(errs[:4]))
    await ctx.close()
async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        for w, h, mob in [(1440, 900, False), (390, 844, True)]:
            if not only or "home" in only: await home(b, w, h, mob)
            for m in MODELS:
                if only and m["slug"] not in only: continue
                try: await model_page(b, m, w, h, mob)
                except Exception as e: ok(f'{m["slug"]}@{w} completed', False, str(e)[:300])
        await b.close()
    f = [r for r in R if not r[1]]
    print(f"\nTOTAL {len(R)} checks, {len(R) - len(f)} pass, {len(f)} fail")
    json.dump(R, open("shots/qa-results.json", "w"), indent=1)
asyncio.run(main())
