# How Things Work

Interactive 3D cutaways of machines, buildings, vehicles and a cat: spin, slice, explode, tap parts, and play (assemble puzzle, find-the-part quiz, drive, fly, run, print, pet).

Live: https://mxhoaib.github.io/how-it-works/

- Static site, no build step: three.js r170 from a pinned CDN via an import map.
- Models are procedural (`assets/js/models/*.js`), so there are no licence issues. See CREDITS.md.
- `gen.py` regenerates the HTML pages, sitemap and robots from `content.py` (optional, output is committed).
- `render_images.py` renders posters, cards and OG images; `qa.py` runs the Playwright QA (needs a local server on :8642 serving the parent folder).
