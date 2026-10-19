#!/usr/bin/env python3
"""Generates the static HTML pages, sitemap and robots from content.py. The site itself needs no build step to run."""
import json, html, os
from content import MODELS, MODES
BASE = "https://mxhoaib.github.io/how-it-works/"
THREE = "https://cdn.jsdelivr.net/npm/three@0.170.0/"
DATE = "2026-10-19"
E = html.escape
BY = {m["slug"]: m for m in MODELS}
GC = '<script data-goatcounter="https://d3dddsites.goatcounter.com/count" async defer src="https://gc.zgo.at/count.js"></script>'
FONTS = '<link rel="preload" href="{pre}assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>'
IMPORTMAP = '<script type="importmap">{"imports":{"three":"%sbuild/three.module.min.js","three/addons/":"%sexamples/jsm/"}}</script>' % (THREE, THREE)
ICON = {
 "rot": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/></svg>',
 "ex": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3"/></svg>',
 "sl": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4" stroke-dasharray="2 2.5"/><path d="M4 17l8 4 8-4"/></svg>',
 "tools": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
 "play": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
 "reset": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/></svg>',
}
CPUNAV = '<a class="hide-m" href="{pre}cpu/">CPU</a>' if "cpu" in BY else '<a class="hide-m" href="{pre}jet-engine/">Jet</a>'
def nav(dark=False, pre=""):
    return f'''<header class="nav{' dark' if dark else ''}"><div class="wrap"><a class="logo" href="{pre or './'}"><i aria-hidden="true"></i>How Things Work</a><nav aria-label="Main"><a href="{pre}#models">Models</a><a class="hide-m" href="{pre}smartphone/">Phone</a>{CPUNAV.format(pre=pre)}<a class="hide-m" href="{pre}car-engine/">Engine</a><a class="support" href="{pre}pay/?item=support" rel="nofollow" aria-label="Support this project"><span class="lg">Support this project</span><span class="sm">Support</span></a></nav></div></header>'''
def footer(pre=""):
    cols = []
    for tag in ["Tech", "Machines", "Buildings", "Vehicles", "Nature"]:
        cols.append(f'<div><h4>{tag}</h4>' + "".join(f'<a href="{pre}{m["slug"]}/">{E(m["name"])}</a>' for m in MODELS if m["tag"] == tag) + '</div>')
    cols.append(f'<div><h4>Project</h4><a href="{pre}">All models</a><a href="{pre}pay/?item=support" rel="nofollow">Support this project</a><a href="https://github.com/mxhoaib/how-it-works/blob/main/CREDITS.md">Credits</a><a href="https://github.com/mxhoaib/how-it-works">Source on GitHub</a></div>')
    cols.append('<div><h4>D3DDD</h4><a href="https://d3ddd.com">d3ddd.com</a><a href="mailto:info@d3ddd.com">info@d3ddd.com</a></div>')
    return f'''<footer><div class="wrap"><div class="cols">{"".join(cols)}</div><p class="legal">Every model is built from code out of simple shapes: no stock models, no licence fees. Facts are kept to well-established ones. Renders by <a style="display:inline;color:inherit" href="https://d3ddd.com">D3DDD</a>.</p></div></footer>'''
def cta():
    return '''<section class="cta"><div class="wrap reveal"><p class="eyebrow" style="color:#a1a1a6">D3DDD</p><h2>Need 3D renders or drawings like this?</h2><p>D3DDD makes them: product cutaways, exploded views, architectural renders and technical drawings.</p><div class="row"><a class="btn light" href="mailto:info@d3ddd.com?subject=3D%20renders%20enquiry">Email info@d3ddd.com</a><a class="btn ghost" style="color:#f5f5f7" href="https://d3ddd.com">Visit d3ddd.com</a></div></div></section>'''
def card(m, pre="", feat=False):
    return f'''<a class="card3 reveal{' feat' if feat else ''}" data-tag="{m["tag"]}" href="{pre}{m["slug"]}/" data-slug="{m["slug"]}" style="--accent:{m["accent"]}"><span class="tag" style="color:{m["accent"]}">{E(m["tag"])}</span><div class="media"><img src="{pre}assets/img/{m["slug"]}-card.webp" alt="3D model of a {E(m["name"].lower())}" width="800" height="600" loading="lazy" decoding="async"></div><div class="txt"><b>{E(m["name"])}</b><span>{E(m["card"])}</span></div></a>'''
def head(title, desc, url, img, extra="", jsonld=None):
    j = f'<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>' if jsonld else ""
    return f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(title)}</title><meta name="description" content="{E(desc)}"><link rel="canonical" href="{url}">
<meta name="theme-color" content="#f5f5f7"><link rel="icon" href="{'../' if extra else ''}favicon.svg" type="image/svg+xml">
<meta property="og:type" content="{'article' if extra else 'website'}"><meta property="og:site_name" content="How Things Work"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{url}"><meta property="og:image" content="{img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{E(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(desc)}"><meta name="twitter:image" content="{img}">
{FONTS.format(pre='../' if extra else '')}{j}'''
def page(m):
    s, url, img = m["slug"], BASE + m["slug"] + "/", BASE + "assets/img/" + m["slug"] + "-og.png"
    layers = [l for l, _ in m["layers"]]
    data = {"slug": s, "name": m["name"], "accent": m["accent"], "layers": layers, "layerNames": dict(m["layers"]), "sliceAxis": m["slice"],
            "parts": {pid: {"name": n, "layer": l, "desc": d, "fact": f} for pid, n, l, d, f in m["parts"]}, "modes": ["assemble", "quiz"] + m["play"], "url": url}
    words = sum(len(p.split()) for _, ps in m["article"] for p in ps)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "headline": m["title"], "description": m["desc"], "image": img, "datePublished": DATE, "dateModified": DATE, "url": url, "mainEntityOfPage": url, "wordCount": words,
         "author": {"@type": "Organization", "name": "D3DDD", "url": "https://d3ddd.com"}, "publisher": {"@type": "Organization", "name": "D3DDD", "url": "https://d3ddd.com"}, "about": m["name"]},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "How Things Work", "item": BASE}, {"@type": "ListItem", "position": 2, "name": m["name"], "item": url}]}]}
    chips = "".join(f'<button class="chip" type="button" data-part="{pid}">{E(n)}</button>' for pid, n, *_ in m["parts"])
    tiles = "".join(f'<div class="tile reveal"><b>{E(a)}</b><p class="muted">{E(b)}</p></div>' for a, b in m["facts"])
    layer_tg = "".join(f'<label><input type="checkbox" data-layer="{l}" checked> {E(n)}</label>' for l, n in m["layers"])
    modes = "".join(f'<button type="button" data-mode="{k}"><b>{E(MODES[k][0])}</b><small>{E(MODES[k][1])}</small></button>' for k in data["modes"])
    art = "".join(f'<h3>{E(h)}</h3>' + "".join(f"<p>{E(p)}</p>" for p in ps) for h, ps in m["article"])
    gloss = "".join(f'<div><dt>{E(n)}</dt><dd>{E(d)}{(" <em>Fun fact: " + E(f) + "</em>") if f else ""}</dd></div>' for pid, n, l, d, f in m["parts"])
    rids = [r for r in m["related"] if r in BY]
    rids += [x["slug"] for x in MODELS if x["slug"] not in rids and x["slug"] != m["slug"] and x["tag"] == m["tag"]][:3 - len(rids)] if len(rids) < 3 else []
    rids += [x["slug"] for x in MODELS if x["slug"] not in rids and x["slug"] != m["slug"]][:3 - len(rids)] if len(rids) < 3 else []
    rel = "".join(card(BY[r], "../") for r in rids)
    axis_seg = lambda: '<div class="seg" role="group" aria-label="Slice axis">' + "".join(f'<button type="button" data-axis="{a}">{a.upper() if a != "off" else "Off"}</button>' for a in ["off", "x", "y", "z"]) + '</div>'
    return f'''<!doctype html><html lang="en"><head>{head(m["title"], m["desc"], url, img, extra="1", jsonld=ld)}
<link rel="stylesheet" href="../assets/css/site.css"><link rel="preload" as="image" href="../assets/img/{s}-poster.webp" fetchpriority="high">{IMPORTMAP}
<style>:root{{--accent:{m["accent"]}}}</style></head><body>
{nav(pre="../")}
<nav class="subnav" aria-label="Sections"><div class="wrap"><b>{E(m["name"])}</b><a href="#overview">Overview</a><a href="#explode">Explode</a><a href="#slice">Slice</a><a href="#parts">Parts</a><a href="#facts">Facts</a><a href="#how">Read</a></div><div class="progress"><i></i></div></nav>
<main>
<section class="intro"><div class="wrap"><p class="eyebrow">How it works · {E(m["tag"])}</p><h1 class="hero-h">{E(m["name"])}.</h1><p class="lede">{E(m["lede"])}</p><div class="row"><a class="btn" href="#explode">Take it apart</a><button class="btn ghost" type="button" data-mode="assemble">Play: assemble it</button></div></div></section>
<section class="story" id="story">
<div class="stage" id="stage" style="--accent:{m["accent"]}">
<img class="poster" src="../assets/img/{s}-poster.webp" alt="3D model of a {E(m["name"].lower())}" width="1200" height="900" fetchpriority="high" decoding="async">
<canvas id="c" aria-label="Interactive 3D model of a {E(m["name"].lower())}. Drag to rotate, pinch or scroll to zoom, tap a part for details."></canvas>
<div class="loading">Loading 3D…</div><nav class="markers" aria-label="Chapters"><a href="#overview"><i></i><span>Overview</span></a><a href="#explode"><i></i><span>Explode</span></a><a href="#slice"><i></i><span>Slice</span></a><a href="#parts"><i></i><span>Parts</span></a><a href="#facts"><i></i><span>Facts</span></a></nav><div class="hotspots" id="hotspots"></div>
<aside class="info" id="info" hidden aria-live="polite"><button class="x" type="button" aria-label="Close">×</button><p class="eyebrow"></p><h3></h3><p class="desc"></p><p class="fact" hidden></p><div class="row"><button class="btn accent" type="button" id="nextpart">Next part →</button><label class="muted" style="display:flex;align-items:center;gap:6px;font-size:14px">Colour <input type="color" id="pc" aria-label="Colour of selected part"></label></div></aside>
<div class="pill" role="toolbar" aria-label="Viewer controls"><button type="button" id="b-rot" aria-label="Auto-rotate">{ICON["rot"]}<span>Rotate</span></button><button type="button" id="b-ex" aria-label="Explode">{ICON["ex"]}<span>Explode</span></button><button type="button" id="b-sl" aria-label="Slice">{ICON["sl"]}<span>Slice</span></button><button type="button" id="b-tools" aria-label="Tools">{ICON["tools"]}<span>Tools</span></button><button type="button" class="play" id="b-play" aria-label="Play">{ICON["play"]}<span>Play</span></button><button type="button" id="b-reset" aria-label="Reset view">{ICON["reset"]}<span>Reset</span></button></div>
<div class="panel" id="tools" hidden><h4>Section cut</h4>{axis_seg()}<label class="ctl">Slice depth <input class="r-depth" type="range" min="0" max="100" value="100" aria-label="Slice depth"></label><label class="ctl">Explode <input class="r-ex" type="range" min="0" max="100" value="0" aria-label="Explode amount"></label><h4 style="margin-top:12px">Layers</h4><div class="tg">{layer_tg}</div><h4 style="margin-top:12px">Material</h4><div class="tg"><label><input type="checkbox" id="wf"> Wireframe</label><label><input type="checkbox" id="xr"> X-ray</label><label><input type="checkbox" id="ar" checked> Auto-rotate</label></div><div class="acts"><button class="btn" type="button" id="share">Share this view</button><button class="btn ghost" type="button" id="png">Download PNG</button></div></div>
<div class="panel" id="playpanel" hidden><h4>Play</h4><p class="muted" style="margin:0;font-size:14px">Scores are saved on this device only.</p><div class="modes">{modes}</div></div>
</div>
<div class="steps">
<article class="step" id="overview" data-step="overview"><div class="card reveal"><p class="num">01 / 05</p><p class="eyebrow">Overview</p><h2>{len(m["parts"])} parts, one idea.</h2><p>{E(m["desc"])}</p><p class="muted" style="font-size:15px">Drag to orbit, pinch or scroll to zoom, tap any part.</p></div></article>
<article class="step tall" id="explode" data-step="explode" style="--h:190vh;--hm:160vh"><div class="card"><p class="num">02 / 05</p><p class="eyebrow">Explode</p><h2>Pull it apart.</h2><p>Keep scrolling and every part slides away from the centre, so you can see how they fit together.</p><label class="ctl">Explode <input class="r-ex" type="range" min="0" max="100" value="0" aria-label="Explode amount"></label></div></article>
<article class="step tall" id="slice" data-step="slice" style="--h:150vh;--hm:130vh"><div class="card"><p class="num">03 / 05</p><p class="eyebrow">Slice</p><h2>Cut it open.</h2><p>A section plane sweeps through the model as you scroll. Pick an axis and set the depth yourself.</p>{axis_seg()}<label class="ctl">Depth <input class="r-depth" type="range" min="0" max="100" value="100" aria-label="Slice depth"></label></div></article>
<article class="step" id="parts" data-step="parts"><div class="card reveal"><p class="num">04 / 05</p><p class="eyebrow">Parts</p><h2>Tap to learn.</h2><p>Pick a part or tap a glowing dot. It lights up and everything else fades back.</p><div class="chips">{chips}</div></div></article>
<article class="step" id="facts" data-step="facts"><div class="card"><p class="num">05 / 05</p><p class="eyebrow">Facts</p><h2>Worth knowing.</h2><div class="tiles">{tiles}</div></div></article>
</div></section>
<section class="article" id="how"><div class="wrap"><p class="eyebrow">Explained</p><h2>How a {E(m["name"].lower())} works.</h2>{art}<h3>Parts glossary</h3><dl class="gloss">{gloss}</dl></div></section>
<section class="related"><div class="wrap"><p class="eyebrow">Keep exploring</p><h2 class="sec-h">Related models.</h2><div class="grid">{rel}</div><p style="margin-top:28px"><a class="btn ghost" href="../">All models</a></p></div></section>
{cta()}
</main>
{footer("../")}
<script type="application/json" id="model-data">{json.dumps(data, ensure_ascii=False)}</script>
<script type="module" src="../assets/js/viewer.js"></script>
{GC}
</body></html>'''
def home():
    url, img = BASE, BASE + "assets/img/home-og.png"
    title = "How Things Work: Interactive 3D Cutaways of Tech, Machines, Buildings and Nature"
    desc = "Spin, slice and explode interactive 3D models of a smartphone, earbuds, CPU, graphics card, car engine, jet engine, skyscraper, bridge and more, then play with them."
    ld = {"@context": "https://schema.org", "@graph": [{"@type": "WebSite", "name": "How Things Work", "url": BASE, "description": desc, "publisher": {"@type": "Organization", "name": "D3DDD", "url": "https://d3ddd.com"}},
          {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": BASE + m["slug"] + "/", "name": m["name"]} for i, m in enumerate(MODELS)]}]}
    order = ["smartphone", "wireless-earbuds", "smartwatch", "laptop", "keyboard-switch", "car-engine", "jet-engine", "cpu", "processor-die", "gpu-card", "electric-pickup", "flying-roadster", "ssd", "gearbox", "3d-printer", "suspension-bridge", "skyscraper", "cat-anatomy", "house-wall-section"]
    order = [k for k in order if k in BY] + [m["slug"] for m in MODELS if m["slug"] not in order]
    cards = "".join(card(BY[k], feat=k in ("smartphone", "car-engine", "electric-pickup", "suspension-bridge", "cat-anatomy")) for k in order)
    pl = [("assemble", "Every model", ""), ("quiz", "Every model", ""), ("drive", "Electric pickup", "electric-pickup/?mode=drive"), ("fly", "Flying roadster", "flying-roadster/?mode=fly"), ("run", "Car engine", "car-engine/?mode=run"), ("print", "3D printer", "3d-printer/?mode=print"), ("pet", "Cat", "cat-anatomy/?mode=pet"), ("water", "Smartphone", "smartphone/?mode=water"), ("zoom", "CPU", "cpu/?mode=zoom"), ("press", "Keyboard switch", "keyboard-switch/?mode=press"), ("load", "Graphics card", "gpu-card/?mode=load"), ("write", "SSD", "ssd/?mode=write"), ("peel", "Earbuds", "wireless-earbuds/?mode=peel")]
    pl = [x for x in pl if not x[2] or x[2].split("/")[0] in BY]
    pcards = "".join(f'<a class="pcard reveal" href="{h or "jet-engine/?mode=" + k}"><em style="color:#ff453a">{E(w)}</em><b>{E(MODES[k][0])}</b><span>{E(MODES[k][1])}</span></a>' for k, w, h in pl)
    return f'''<!doctype html><html lang="en"><head>{head(title, desc, url, img, jsonld=ld)}
<link rel="stylesheet" href="assets/css/site.css"><link rel="preload" as="image" href="assets/img/home-poster.webp" fetchpriority="high">{IMPORTMAP}<style>:root{{--accent:#ff453a}} .home .theme{{}}</style><meta name="theme-color" content="#000000"></head><body class="home">
{nav(dark=True)}
<main>
<section class="hero" id="hero"><div class="pin"><img class="hposter" src="assets/img/home-poster.webp" alt="" width="1600" height="800" fetchpriority="high"><canvas id="hc" aria-label="A smartphone slowly rotating and coming apart as you scroll"></canvas>
<div class="copy"><p class="eyebrow" style="color:#0a84ff">Interactive 3D · {len(MODELS)} models</p><h1 class="hero-h">How things work.</h1><p class="sub">Spin, slice and explode phones, chips, engines and buildings. Then play with them.</p><div class="ctas"><a class="btn light" href="#models">Explore the models</a><a class="btn ghost" style="color:#f5f5f7" href="smartphone/?mode=peel">Open a phone</a></div></div>
<p class="h2" id="h2" aria-hidden="true">See how everything works.</p><a class="cue" href="#models">Scroll<i></i></a></div></section>
<section class="gallery" id="models"><div class="wrap"><p class="eyebrow">The collection</p><h2 class="sec-h">Pick something. Take it apart.</h2><div class="filters" role="group" aria-label="Filter models"><button type="button" class="on" data-f="all">All</button><button type="button" data-f="Tech">Tech</button><button type="button" data-f="Machines">Machines</button><button type="button" data-f="Buildings">Buildings</button><button type="button" data-f="Vehicles">Vehicles</button><button type="button" data-f="Nature">Nature</button></div><div class="mgrid" id="mgrid">{cards}</div>
<div style="margin-top:96px"><p class="eyebrow">Play</p><h2 class="sec-h">Learn by playing.</h2><p class="lede">Timed puzzles, quizzes and a best-time board on your device. Share your score and challenge a friend.</p><div class="play-grid">{pcards}</div></div></div></section>
{cta()}
</main>
{footer()}
<script type="module" src="assets/js/home.js"></script>
{GC}
</body></html>'''
def main():
    for m in MODELS:
        os.makedirs(m["slug"], exist_ok=True)
        open(f'{m["slug"]}/index.html', "w").write(page(m))
    open("index.html", "w").write(home())
    urls = [BASE] + [BASE + m["slug"] + "/" for m in MODELS]
    open("sitemap.xml", "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{u}</loc><lastmod>{DATE}</lastmod></url>\n" for u in urls) + "</urlset>\n")
    open("robots.txt", "w").write(f"User-agent: *\nAllow: /\nDisallow: /how-it-works/pay/\nDisallow: /how-it-works/tools/\nSitemap: {BASE}sitemap.xml\n")
    print("pages:", len(MODELS) + 1)
if __name__ == "__main__":
    main()
