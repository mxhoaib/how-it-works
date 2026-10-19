"""Renders poster/card/OG images from the live procedural models via tools/og.html (Playwright, build-time only)."""
import asyncio, sys, io
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, '.')
from content import MODELS
B = "http://127.0.0.1:8642/how-it-works/tools/og.html"
JOBS = []
for m in MODELS:
    s = m["slug"]
    JOBS += [(f"?m={s}&mode=poster", 1200, 900, f"assets/img/{s}-poster.webp"),
             (f"?m={s}&mode=card", 800, 600, f"assets/img/{s}-card.webp"),
             (f"?m={s}&mode=og&dark=1", 1200, 630, f"assets/img/{s}-og.png")]
JOBS += [("?m=smartphone&mode=poster&dark=1&ex=0&tilt=1&hero=1", 1600, 800, "assets/img/home-poster.webp"),
         ("?m=smartphone&mode=og&dark=1&tilt=1&ex=.2&title=How%20things%20work.&eyebrow=Interactive%203D", 1200, 630, "assets/img/home-og.png")]
only = sys.argv[1:]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        for q, w, h, out in JOBS:
            if only and not any(o in out for o in only): continue
            pg = await b.new_page(viewport={"width": w, "height": h})
            await pg.goto(B + q); await pg.wait_for_function("document.title==='ready'", timeout=60000); await pg.wait_for_timeout(400)
            png = await pg.screenshot(); im = Image.open(io.BytesIO(png)).convert("RGB")
            if out.endswith(".webp"): im.save(out, "WEBP", quality=80, method=6)
            else: im.save(out, "PNG", optimize=True)
            print(out); await pg.close()
        await b.close()
asyncio.run(main())
