"""QA for the clip recorder, the D3DDD badge and the home count."""
import asyncio, os, re, sys
from playwright.async_api import async_playwright
sys.path.insert(0, "."); from content import MODELS
BASE = os.environ.get("QA_BASE", "http://127.0.0.1:8642/how-it-works/"); R = []
def ok(n, c, i=""): R.append(c); print(("PASS " if c else "FAIL ") + n + (f"  {i}" if i else ""), flush=True)
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
async def rec_once(pg):
    await pg.click(".hud .clipbtn")
    try:
        await pg.wait_for_function("window.__hiwClip && window.__hiwClip.size > 500", timeout=18000)
        return await pg.evaluate("window.__hiwClip")
    except Exception:
        return await pg.evaluate("window.__hiwClip")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        for w, h, mob in [(1440, 900, False), (390, 844, True)]:
            got = False
            for slug, mode in [("flying-roadster", "fly"), ("electric-pickup", "drive")]:
                ctx = await b.new_context(viewport={"width": w, "height": h}, is_mobile=mob, has_touch=mob, accept_downloads=True, device_scale_factor=2 if mob else 1)
                ctx.set_default_timeout(90000); pg = await ctx.new_page(); errs = []
                pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
                await pg.route("**/gc.zgo.at/**", lambda r: r.fulfill(body="", content_type="text/javascript"))
                await pg.goto(f"{BASE}{slug}/?mode={mode}"); await pg.wait_for_selector(".hud .clipbtn", timeout=90000)
                await pg.wait_for_function("() => window.__hiw && window.__hiw.canvas && window.__hiw.canvas.width > 100", timeout=30000)
                await pg.wait_for_timeout(800)
                tag = f"{slug}@{w}"
                ok(f"{tag} clip button visible", await pg.locator(".hud .clipbtn").is_visible())
                ok(f"{tag} badge hidden while playing", not await pg.locator(".made").is_visible())
                lazy = await pg.evaluate("!performance.getEntriesByType('resource').some(r=>r.name.includes('clip.js'))"); ok(f"{tag} clip.js not loaded before click", lazy)
                info = await rec_once(pg)
                if not (info and info.get("size", 0) > 500):
                    await pg.evaluate("window.__hiwClip = null")
                    await pg.wait_for_timeout(500)
                    info = await rec_once(pg)
                good = bool(info and info.get("size", 0) > 500); got = got or good
                ok(f"{tag} clip recorded", good, str(info))
                if mob: await pg.screenshot(path=f"shots/{slug}-{mode}-390.png")
                ok(f"{tag} no console errors", not errs, "; ".join(errs[:3])); await ctx.close()
            ok(f"clip works at {w}", got)
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}); await ctx.add_init_script("delete window.MediaRecorder")
        pg = await ctx.new_page(); await pg.route("**/gc.zgo.at/**", lambda r: r.fulfill(body="", content_type="text/javascript"))
        await pg.goto(f"{BASE}electric-pickup/?mode=drive"); await pg.wait_for_selector(".hud .exit", timeout=90000)
        ok("clip button hidden without MediaRecorder", await pg.locator(".hud .clipbtn").count() == 0); await ctx.close()
        for w, h, mob in [(1440, 900, False), (390, 844, True)]:
            ctx = await b.new_context(viewport={"width": w, "height": h}, is_mobile=mob, has_touch=mob); pg = await ctx.new_page()
            await pg.route("**/gc.zgo.at/**", lambda r: r.fulfill(body="", content_type="text/javascript"))
            for path in ["", "ev-anatomy/", "cpu/", "pay/?item=support", "404.html"]:
                await pg.goto(BASE + path); a = pg.locator("a.made")
                ok(f"badge @{w} /{path}", await a.count() == 1 and await a.get_attribute("href") == "https://d3ddd.com" and await a.is_visible())
            await pg.goto(BASE); txt = await pg.evaluate("document.querySelector('.hero .eyebrow').textContent"); n = int(re.search(r"(\d+)\s+models", txt, re.I).group(1))
            cards = await pg.locator("#mgrid .card3").count(); ok(f"home count @{w}", n == len(MODELS) == cards, f"label {n}, models {len(MODELS)}, cards {cards}")
            await ctx.close()
        await b.close()
    print(f"TOTAL {len(R)} checks, {sum(R)} pass, {len(R)-sum(R)} fail"); sys.exit(0 if all(R) else 1)
asyncio.run(main())
