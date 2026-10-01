#!/usr/bin/env python3
"""Regenerate the README carousels (docs/assets/carousel-*.gif and carousel-poster.png) from the
live reference page, so the pictures never drift from the rules they show.

    python scripts/make-carousel.py            all three
    python scripts/make-carousel.py charts     just one group (de-ai, improvements or charts)

Needs: Python 3, Pillow (pip install pillow), and Chrome or Chromium (set CHROME to its path if it
is not found). Nothing is mocked: each slide is a headless render of a real sample on
docs/reference/ui-rules-visual.html, at 2x, with the explanatory notes hidden. A slide may carry a small
script that puts the page into the state worth showing (a filter panel opened, a nudge fired, a wedge
selected): the state is produced by the page's own code, not drawn.

Three short loops, one per category: de-AI (what makes an interface look machine-made), improvements
(what makes it feel better to use) and charts. To change what they show, edit GROUPS.
"""
import io
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "docs", "reference", "ui-rules-visual.html")
OUTDIR = os.path.join(ROOT, "docs", "assets")


def S(sid, rid, cap, width=800, hover=False, css="", js=""):
    return dict(id=sid, rid=rid, cap=cap, width=width, hover=hover, css=css, js=js)


EVT = "new Event('input',{bubbles:true})"
HIDE_TABLE = "{sec} .tableside{{display:none!important}}"
CLICK = "new MouseEvent('click',{bubbles:true,cancelable:true})"

GROUPS = [
    ("de-ai", [
        S("l1-hierarchy", "L1", "One thing wins; everything else steps back"),
        S("b1-icons", "B1", "Icon first, a label that fits, always explainable", 1000),
        S("l5-height", "L5", "Controls in a row share one height"),
        S("y2-plate", "Y2", "Label contrast is a decision, not a hope"),
        S("b4-halo", "B4", "Everything that acts answers the pointer the same way", hover=True),
    ]),
    ("improvements", [
        S("t1-filter", "T1", "A filter is a panel: sort, values, counts", 1000,
          js="var t=document.querySelector('#t1-filter .demo.right .ftrig[data-col=\"type\"]'); if(t){t.click();}"),
        S("f1-nudge", "F1", "A required field says so before it is missed",
          js="['r-site','r-type'].forEach(function(id){document.getElementById(id).dispatchEvent(new Event('blur'));});"),
        S("f4-shape", "F4", "A field is the shape of what goes in it",
          js=("var m='Hi {customer}, your quotation for the Taman Sri Indah reroof is ready. Please confirm the start "
              "date, and tell us if the access gate is locked on weekdays.';"
              "['f4Bad','f4Good'].forEach(function(id){var i=document.getElementById(id); i.value=m; i.dispatchEvent(" + EVT + ");});")),
        S("n2-close", "N2", "A panel can always be closed: its trigger toggles, Done on touch",
          js=("['n2cBadBtn','n2cGoodBtn'].forEach(function(id){document.getElementById(id).dispatchEvent(" + CLICK + ");});")),
        S("f9-enter", "F9", "Enter moves to the next field; the last one submits",
          css="#f9SensForm,#f9SensOut{display:none!important}",
          js=("var bs=document.getElementById('f9b-site'); bs.value='Taman Sri Indah';"
              "bs.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));"
              "var gs=document.getElementById('f9g-site'); gs.value='Taman Sri Indah'; gs.focus();"
              "gs.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));"
              "var nx=document.getElementById('f9g-type'); if(nx){nx.style.boxShadow='var(--halo)';}")),
    ]),
    ("charts", [
        S("c5-ring", "C5", "A highlight follows the mark, not a box round it"),
        S("pie-chart", "C5", "Select a mark and it shows its values",
          css=HIDE_TABLE.format(sec="#pie-chart"),
          js="var m=document.querySelectorAll('#pie-chart svg path.seg')[2]; if(m){m.dispatchEvent(" + CLICK + ");}"),
        S("sun-chart", "C6", "Aggregate with the right operation for the measure",
          css=HIDE_TABLE.format(sec="#sun-chart"),
          js=("['Demolition','Piling'].forEach(function(id){var m=document.querySelector('#sun-chart svg path.seg[data-id=\"'+id+'\"]');"
              "if(m){m.dispatchEvent(" + CLICK + ");}});")),
        S("candle-chart", "C12", "A chart type keeps the marks that define it",
          css=HIDE_TABLE.format(sec="#candle-chart"),
          js="var m=document.querySelector('#candle-chart svg [data-id=\"S6\"]'); if(m){m.dispatchEvent(" + CLICK + ");}"),
        S("series-chart", "C4", "A time chart ships range presets and derives its granularity",
          css=HIDE_TABLE.format(sec="#series-chart")),
    ]),
]
GRADIENT_SLIDES = {"y2-plate"}      # a smooth gradient needs its own palette share: a GIF has 256 colours
GRADIENT_COLORS = 120

W, H = 960, 540
BG, INK, MUTED, ACCENT = (239, 237, 234), (28, 26, 24), (93, 85, 78), (59, 110, 245)
CARD_W, CARD_MAXH, SPACING, STAGE_Y = 720, 385, 700, 248
HOLD_MS, STEP_MS, STEPS = 2300, 40, 12
COLORS = 256


def find_chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for c in [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]:
        if os.path.exists(c):
            return c
    for name in ("google-chrome", "chromium", "chromium-browser", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    sys.exit("Chrome or Chromium not found. Set the CHROME environment variable to its path.")


def font(names, size):
    dirs = [r"C:\Windows\Fonts", "/Library/Fonts", "/System/Library/Fonts", "/usr/share/fonts/truetype/dejavu",
            "/usr/share/fonts/truetype/liberation"]
    for n in names:
        for d in dirs + [""]:
            try:
                return ImageFont.truetype(os.path.join(d, n), size)
            except OSError:
                continue
    return ImageFont.load_default()


def render_slide(tmp, chrome, page, sl):
    sid = sl["id"]
    css = ("<style>.wrap > *:not(#%s){display:none!important}#%s > h2,#%s > p.rule,#%s .note{display:none!important}"
           "body{background:var(--bg)}.wrap{padding-top:14px;padding-bottom:14px}"
           "*,*::before,*::after{transition:none!important;animation:none!important}%s</style></head>") % (sid, sid, sid, sid, sl["css"])
    assert page.count("</head>") == 1 and ('id="%s"' % sid) in page, "section %s not found on the page" % sid
    h = page.replace("</head>", css, 1)
    if sl["hover"]:      # show the state the sample is about: the halo on hover
        h = h.replace('act act-good"', 'act act-good force-hover"')
    if sl["js"]:         # put the page into the state worth showing, using the page's own code
        script = ("<script>(function(){function go(){try{%s}catch(e){}}"
                  "if(document.readyState==='complete'){setTimeout(go,400);}else{addEventListener('load',function(){setTimeout(go,400);});}})();</script></body>") % sl["js"]
        assert h.count("</body>") == 1
        h = h.replace("</body>", script, 1)
    src = os.path.join(tmp, "slide-%s.html" % sid)
    io.open(src, "w", encoding="utf-8", newline="\n").write(h)
    png = os.path.join(tmp, sid + ".png")
    url = "file:///" + src.replace("\\", "/").lstrip("/") + "?theme=light"
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
                    "--force-device-scale-factor=2", "--window-size=%d,%d" % (sl["width"], 900),
                    "--virtual-time-budget=7000", "--screenshot=" + png, url],
                   capture_output=True, text=True, timeout=120)
    if not os.path.exists(png):
        sys.exit("render failed for %s" % sid)
    im = Image.open(png).convert("RGB")
    bg = Image.new("RGB", im.size, im.getpixel((4, 4)))
    box = ImageChops.difference(im, bg).point(lambda v: 255 if v > 10 else 0).getbbox()
    box = (max(0, box[0] - 16), max(0, box[1] - 16), min(im.width, box[2] + 16), min(im.height, box[3] + 16))
    im = im.crop(box)
    im = im.crop((0, 30, im.width, im.height))              # drop the page's own rule at the top
    scale = min(CARD_W / float(im.width), CARD_MAXH / float(im.height))
    return im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)


def rounded(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
    return m


def ease(t):
    return 3 * t * t - 2 * t * t * t


def build(slides, cards):
    n = len(cards)
    f_cap = font(["seguisb.ttf", "segoeuib.ttf", "Arial Bold.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"], 22)
    f_bold = font(["segoeuib.ttf", "Arial Bold.ttf", "arialbd.ttf", "DejaVuSans-Bold.ttf"], 22)

    def frame(p):
        im = Image.new("RGB", (W, H), BG)
        items = []
        for k in range(n):
            base = ((k - p + n / 2.0) % n) - n / 2.0
            for off in (-n, 0, n):
                d = base + off
                if abs(d) < 1.6:
                    items.append((abs(d), k, d))
        for _a, k, d in sorted(items, reverse=True):         # the centre card is drawn last, on top
            near = min(abs(d), 1.0)
            s, a = 1 - 0.12 * near, 1 - 0.5 * near
            c = cards[k]
            w, h = int(c.width * s), int(c.height * s)
            cc = c.resize((w, h), Image.LANCZOS)
            if a < 1:
                cc = Image.blend(Image.new("RGB", cc.size, BG), cc, a)
            x, y = int(W / 2 + d * SPACING - w / 2), int(STAGE_Y - h / 2)
            sh = Image.new("L", (w + 60, h + 60), 0)
            ImageDraw.Draw(sh).rounded_rectangle([30, 35, 30 + w, 35 + h], 16, fill=int(60 * a))
            im.paste((70, 60, 50), (x - 30, y - 30), sh.filter(ImageFilter.GaussianBlur(10)))
            im.paste(cc, (x, y), rounded(w, h, 16))
        dr = ImageDraw.Draw(im)
        idx = int(round(p)) % n
        sl = slides[idx]
        y0 = H - 66
        dr.text((40, y0), sl["rid"], font=f_bold, fill=ACCENT)
        dr.text((40 + dr.textlength(sl["rid"] + "  ", font=f_bold), y0), sl["cap"], font=f_cap, fill=MUTED)
        dr.text((W - 40 - dr.textlength("kz-skills", font=f_bold), y0), "kz-skills", font=f_bold, fill=INK)
        for i in range(n):
            cx, cy = int(W / 2 - (n - 1) * 9 + i * 18), H - 26
            dr.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=ACCENT if i == idx else (205, 200, 195))
        return im

    frames, durs = [], []
    for i in range(n):
        frames.append(frame(i)); durs.append(HOLD_MS)
        for s in range(1, STEPS + 1):
            frames.append(frame(i + ease(s / float(STEPS)))); durs.append(STEP_MS)
    frames.pop(); durs.pop()                                  # the last step lands on slide 0: a seamless loop
    # One palette for the whole animation so the ink does not fade while sliding. A smooth gradient has
    # the least area and needs the most colours: split the palette and build the gradient's half from
    # the gradient's own pixels (median-cut splits by pixel COUNT, so anything else starves it).
    sw = Image.new("RGB", (W, 60), BG)
    dsw = ImageDraw.Draw(sw)
    for i, col in enumerate([INK, MUTED, ACCENT, BG, (205, 200, 195)]):
        dsw.rectangle([i * W // 5, 0, (i + 1) * W // 5, 60], fill=col)
    grad = [k for k, sl in enumerate(slides) if sl["id"] in GRADIENT_SLIDES]
    others = [frames[i] for i in range(0, len(frames), STEPS + 1) if i // (STEPS + 1) not in grad]
    parts = others + frames[3::5] + [sw]
    sheet = Image.new("RGB", (W, sum(f.height for f in parts)))
    y = 0
    for f in parts:
        sheet.paste(f, (0, y)); y += f.height
    if grad:
        n_rest = COLORS - GRADIENT_COLORS
        pal_r = sheet.quantize(colors=n_rest, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        frame_g = frames[grad[0] * (STEPS + 1)]
        pixels = getattr(frame_g, "get_flattened_data", frame_g.getdata)()
        tinted = [px for px in pixels if px[2] - px[1] > 22]
        strip = Image.new("RGB", (len(tinted), 1))
        strip.putdata(tinted)
        pal_g = strip.quantize(colors=GRADIENT_COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        pal = Image.new("P", (1, 1))
        pal.putpalette(pal_r.getpalette()[:n_rest * 3] + pal_g.getpalette()[:GRADIENT_COLORS * 3])
    else:
        pal = sheet.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    return frames, [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames], durs


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    tmp = tempfile.mkdtemp(prefix="kz-carousel-")
    try:
        chrome = find_chrome()
        page = io.open(PAGE, encoding="utf-8").read()
        os.makedirs(OUTDIR, exist_ok=True)
        if not only:
            for old in os.listdir(OUTDIR):                    # a stale carousel is worse than none
                if old.startswith("carousel") and old.endswith((".gif", ".png")):
                    os.remove(os.path.join(OUTDIR, old))
        for gi, (slug, slides) in enumerate(GROUPS):
            if only and slug != only:
                continue
            cards = [render_slide(tmp, chrome, page, sl) for sl in slides]
            frames, q, durs = build(slides, cards)
            gif = os.path.join(OUTDIR, "carousel-%s.gif" % slug)
            q[0].save(gif, save_all=True, append_images=q[1:], duration=durs, loop=0, optimize=True, disposal=1)
            if gi == 0:
                frames[0].save(os.path.join(OUTDIR, "carousel-poster.png"), optimize=True)
            print("wrote docs/assets/carousel-%s.gif  (%d slides, %d frames, %.2f MB, %.1fs loop)"
                  % (slug, len(slides), len(q), os.path.getsize(gif) / 1048576.0, sum(durs) / 1000.0))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
