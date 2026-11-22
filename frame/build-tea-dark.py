#!/usr/bin/env python3
"""Build the dark-mode variant of the TEA prototype.

The prototype hardcodes light-theme colors into Tailwind arbitrary values
(text-[#0b0b0c]) and SVG presentation attributes. A dark mode that re-lists
those classes a second time would drift the moment either copy changes, so
this script rewrites the neutrals into CSS variables and lets the palette live
in one place. Brand colors (USDT green, BNB yellow, Solana gradient) are left
alone on purpose: they do not change between themes.
"""
import re
import sys
from pathlib import Path

SRC = Path("/Users/mac/Desktop/tea_crypto_wallet_ui (2).html")
OUT = Path("/Users/mac/vanta-mobile/frame/tea-ui-dark.html")
# Light twin, written outside the repo: it exists only to diff the port
# against the approved light build, so it is not a second source of truth.
OUT_LIGHT = Path("/tmp/tea-ui-light.html")

# hex literal -> (theme-able token). Grouped by the role the color plays, not by
# its value, which is why #dfe3ec and #e5e8ef both land on --hairline.
TEXT = {
    "#0b0b0c": "--ink-1",
    "#8a90a0": "--ink-2",
    "#7c8394": "--ink-3",
}
BG = {
    "#0b0b0c": "--solid",
    "#f5f7fb": "--surface-2",
    "#f1f4fa": "--surface-2",
    "#eceff7": "--surface-2",
    "#f8f9fb": "--surface-2-hi",
    "#e6e9f0": "--chip",
    "#e6e9f2": "--chip",
    "#dce1ec": "--chip",
    "#d8dce3": "--chip",
    "#d5dbe7": "--hairline-strong",
}
BORDER = {
    "#dfe3ec": "--hairline",
    "#e5e8ef": "--hairline",
    "#e5e8f0": "--hairline",
    "#e4e8f0": "--hairline",
    "#e2e6f0": "--hairline",
    "#eaecef": "--hairline",
    "#f0f2f7": "--hairline-soft",
    "#0b0b0c": "--ink-1",
}

counts = {}


def bump(key):
    counts[key] = counts.get(key, 0) + 1


def rewrite_utils(src, prop, table):
    """text-[#0b0b0c] -> text-[var(--ink-1)], keeping any variant prefix."""
    def sub(m):
        variant, hexv = m.group(1) or "", m.group(2).lower()
        token = table.get(hexv)
        if not token:
            return m.group(0)
        bump(f"{prop} {hexv} -> {token}")
        return f"{variant}{prop}-[var({token})]"

    pat = re.compile(
        r'((?:hover|active|focus|group-hover):)?' + prop + r'-\[(#[0-9a-fA-F]{6})\]'
    )
    return pat.sub(sub, src)


CRITICAL_CSS = """
    /* ── THEME TOKENS ───────────────────────────────────────────────────────
       One palette, two themes. Light values are the prototype's originals; the
       dark values are Vanta's site palette (canvas #0a0a0b, surface #121214,
       hairline #27272a, ink #e8e8ea, violet #8b7cf6) so the wallet reads as
       the same product as vanta-mobile.xyz rather than as a generic dark skin.
       Components must never hardcode a neutral; if a color is not here it is a
       brand or a signal color and is theme-independent. */
    :root {
      --ink-1: #0b0b0c;
      --ink-2: #8a90a0;
      --ink-3: #7c8394;
      --solid: #0b0b0c;
      --on-solid: #ffffff;
      --card: #ffffff;
      --card-a90: rgba(255, 255, 255, 0.9);
      --card-a75: rgba(255, 255, 255, 0.75);
      --surface-2: #f5f7fb;
      --surface-2-hi: #f8f9fb;
      --chip: #e6e9f0;
      --knob: #e0e5f3;
      --hairline: #e5e8ef;
      --hairline-soft: #f0f2f7;
      --hairline-strong: #d5dbe7;
      --ring: rgba(255, 255, 255, 0.9);
      --icon-bg: #0b0b0c;
      --icon-ink: #ffffff;
      --orb-ink: #0b0b0c;
      --nav-active: #ffffff;
      --nav-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
      --wall-1: #dce0e6;
      --wall-2: #eef1f5;
      --wall-3: #e2e6ee;
      --frame-1: #eeeff3;
      --frame-2: #eceef3;
      --frame-3: #e6eaf3;
      --frame-4: #dfe5f3;
      --frame-shadow: 0 30px 70px -15px rgba(15, 23, 42, 0.22);
      --frame-edge: rgba(255, 255, 255, 0.82);
      --shadow-soft: rgba(17, 24, 39, 0.035);
      --vault-bg: rgba(255, 255, 255, 0.52);
      --vault-edge: rgba(255, 255, 255, 0.88);
      --overlay: rgba(235, 239, 248, 0.25);
      --overlay-active: rgba(236, 240, 249, 0.78);
      --accent: #6d5ae6;
    }

    [data-theme="dark"] {
      --ink-1: #e8e8ea;
      --ink-2: #8f8f96;
      --ink-3: #7f7f88;
      --solid: #26262a;
      --on-solid: #f4f4f6;
      --card: #121214;
      --card-a90: rgba(18, 18, 20, 0.92);
      --card-a75: rgba(18, 18, 20, 0.78);
      --surface-2: #18181b;
      --surface-2-hi: #1f1f23;
      --chip: #27272a;
      --knob: #0f0f12;
      --hairline: #27272a;
      --hairline-soft: #222226;
      --hairline-strong: rgba(255, 255, 255, 0.16);
      --ring: rgba(255, 255, 255, 0.1);
      --icon-bg: #e8e8ea;
      --icon-ink: #121214;
      --orb-ink: #f4f4f6;
      --nav-active: #1f1f23;
      --nav-shadow: 0 4px 14px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
      --wall-1: #08080a;
      --wall-2: #0a0a0b;
      --wall-3: #0b0910;
      --frame-1: #0a0a0b;
      --frame-2: #0c0c10;
      --frame-3: #101018;
      --frame-4: #14111f;
      --frame-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.8);
      --frame-edge: rgba(255, 255, 255, 0.07);
      --shadow-soft: rgba(0, 0, 0, 0.5);
      --vault-bg: rgba(24, 24, 27, 0.62);
      --vault-edge: rgba(255, 255, 255, 0.08);
      --overlay: rgba(10, 10, 11, 0.35);
      --overlay-active: rgba(10, 10, 11, 0.82);
      --accent: #8b7cf6;
    }

    /* Nav state lives in CSS, not in switchTab(), so the theme has one owner.
       These beat the SVG presentation attributes, which cannot hold var(). */
    .nav-item .nav-svg-fill { fill: var(--ink-2); }
    .nav-item .nav-svg-stroke { stroke: var(--ink-2); }
    .nav-item .nav-label { color: var(--ink-2); }
    .nav-item.active .nav-svg-fill { fill: var(--ink-1); }
    .nav-item.active .nav-svg-stroke { stroke: var(--ink-1); }
    .nav-item.active .nav-label { color: var(--ink-1); font-weight: 600; }
    .nav-icon-on { background: var(--nav-active); box-shadow: var(--nav-shadow); }
    .slide-track-filled { background: var(--hairline-strong); }

    /* On the site, an active item is a violet wash with violet ink; the white
       square only works because light mode has a white surface to lift. */
    [data-theme="dark"] .nav-icon-on {
      background: rgba(139, 124, 246, 0.14);
      box-shadow: inset 0 0 0 1px rgba(139, 124, 246, 0.28);
    }
    [data-theme="dark"] .nav-item.active .nav-svg-fill { fill: #a79bff; }
    [data-theme="dark"] .nav-item.active .nav-svg-stroke { stroke: #a79bff; }
    [data-theme="dark"] .nav-item.active .nav-label { color: #a79bff; }

    /* The pearl reads as a lit object in light mode and as a duller, cooler
       stone in dark; the light recipe would glare against #0a0a0b. The specular
       is dialled back so the plus sign, which stays light, keeps its contrast. */
    [data-theme="dark"] .holo-orb {
      background:
        radial-gradient(circle at 32% 26%, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.05) 38%, transparent 64%),
        conic-gradient(
          from 215deg at 50% 50%,
          #45566f 0deg,
          #5e4659 65deg,
          #3b5f5a 135deg,
          #494070 205deg,
          #6a5445 280deg,
          #45566f 360deg
        );
      box-shadow:
        inset 0 1.5px 3px rgba(255, 255, 255, 0.28),
        inset 0 -2px 6px rgba(0, 0, 0, 0.6),
        0 2px 10px rgba(0, 0, 0, 0.55),
        0 0 20px rgba(139, 124, 246, 0.22);
    }

    /* Cards are wavy paths, so light mode's white surface separated them from
       the wall on its own. On near-black they need an edge instead. */
    [data-theme="dark"] .token-card-wrapper svg path,
    [data-theme="dark"] .swap-card-shadow svg path {
      stroke: var(--hairline);
      stroke-width: 1;
    }

    /* Review affordance, not part of the app. Sits outside the phone frame. */
    .theme-toggle {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 999;
      padding: 10px 14px;
      border-radius: 999px;
      border: 1px solid var(--hairline);
      background: var(--card);
      color: var(--ink-1);
      font: 600 12px/1 'Plus Jakarta Sans', 'Inter', sans-serif;
      letter-spacing: 0.02em;
      cursor: pointer;
    }
"""


def main():
    src = SRC.read_text()

    # 1. Utility colors -> tokens.
    for prop, table in (("text", TEXT), ("bg", BG), ("border", BORDER)):
        src = rewrite_utils(src, prop, table)

    # 2. Tailwind's keyword colors that carry the same meaning.
    rules = [
        (r'(?<![-:\w])bg-white(?![/\w])', 'bg-[var(--card)]', 'bg-white'),
        (r'(?<![-:\w])text-white(?![/\w])', 'text-[var(--on-solid)]', 'text-white'),
        (r'(?<![-:\w])border-white(?![/\w])', 'border-[var(--hairline-strong)]', 'border-white'),
        (r'ring-white(?![/\w])', 'ring-[var(--ring)]', 'ring-white'),
        (r'bg-white/90', 'bg-[var(--card-a90)]', 'bg-white/90'),
        (r'bg-white/75', 'bg-[var(--card-a75)]', 'bg-white/75'),
    ]
    for pat, repl, label in rules:
        src, n = re.subn(pat, repl, src)
        counts[label] = n

    # 3. SVG presentation attributes. Icons that sit on a chip invert with the
    #    chip, so they get the icon pair rather than the ink token.
    src, n = re.subn(r'fill="#0b0b0c"', 'fill="var(--icon-bg)"', src, flags=re.I)
    counts['fill=#0b0b0c'] = n
    # The action pill is the one solid black shape whose label is white on top,
    # so it follows --solid, not the icon chip.
    src, n = re.subn(
        r'Z\n(\s+)"\n\s+fill="var\(--icon-bg\)"',
        lambda m: f'Z\n{m.group(1)}"\n{m.group(1)}fill="var(--solid)"',
        src,
    )
    counts['action pill fill'] = n
    src, n = re.subn(r'stroke="#0b0b0c"', 'stroke="var(--ink-1)"', src, flags=re.I)
    counts['stroke=#0b0b0c'] = n
    # The orb's plus sits on the pearl, not on a card.
    src, n = re.subn(
        r'(<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke=")var\(--ink-1\)',
        r'\1var(--orb-ink)',
        src,
    )
    counts['orb plus'] = n
    src, n = re.subn(r'fill="#8A90A0"', 'fill="var(--ink-2)"', src, flags=re.I)
    counts['fill=#8A90A0'] = n
    src, n = re.subn(r'fill="#E1E6F3"', 'fill="var(--knob)"', src, flags=re.I)
    counts['fill=#E1E6F3'] = n
    src, n = re.subn(r'fill="#E0E5F3"', 'fill="var(--knob)"', src, flags=re.I)
    counts['fill=#E0E5F3'] = n
    src, n = re.subn(r'stroke="#C6CCD8"', 'stroke="var(--hairline)"', src, flags=re.I)
    counts['stroke=#C6CCD8'] = n
    src, n = re.subn(r'stroke="#7A8191"', 'stroke="var(--ink-3)"', src, flags=re.I)
    counts['stroke=#7A8191'] = n

    # 4. Two shapes that are white in light mode but must follow the theme.
    #    (a) The token cards are wavy SVG blobs, not divs, so their surface is a
    #        path fill and has to be themed like any other card.
    src, n = re.subn(
        r'(d="M 30,0 L \d+,0[^"]*" )fill="#FFFFFF"',
        r'\1fill="var(--card)"',
        src,
    )
    counts['card path inline'] = n
    # The swap cards put the fill on its own line after the closing Z.
    src, n = re.subn(
        r'Z\n(\s+)"\n\s+fill="#FFFFFF"',
        lambda m: f'Z\n{m.group(1)}"\n{m.group(1)}fill="var(--card)"',
        src,
    )
    counts['card path multiline'] = n

    #    (b) Glyphs drawn white-on-black inside an inverted chip: the marks take
    #        the surface color so they invert with the shape they sit on.
    parts = re.split(r'(?=<svg)', src)
    for i, part in enumerate(parts):
        if 'var(--icon-bg)' in part:
            new = part.replace('stroke="#FFFFFF"', 'stroke="var(--card)"')
            new = new.replace('fill="#FFFFFF"', 'fill="var(--card)"')
            if new != part:
                counts['inverted glyph'] = counts.get('inverted glyph', 0) + 1
                parts[i] = new
    src = ''.join(parts)

    # 5. Component CSS that carries color.
    css_rules = [
        (
            "background: linear-gradient(155deg, #dce0e6 0%, #eef1f5 52%, #e2e6ee 100%);",
            "background: linear-gradient(155deg, var(--wall-1) 0%, var(--wall-2) 52%, var(--wall-3) 100%);",
            'body gradient',
        ),
        (
            "        #eeeff3 0%,\n        #eceef3 42%,\n        #e6eaf3 74%,\n        #dfe5f3 100%",
            "        var(--frame-1) 0%,\n        var(--frame-2) 42%,\n        var(--frame-3) 74%,\n        var(--frame-4) 100%",
            'frame gradient',
        ),
        (
            "        0 30px 70px -15px rgba(15, 23, 42, 0.22),\n        0 0 0 1px rgba(255, 255, 255, 0.82) inset",
            "        var(--frame-shadow),\n        0 0 0 1px var(--frame-edge) inset",
            'frame shadow',
        ),
        (
            "background: #eef1f5;",
            "background: var(--wall-2);",
            'body mobile bg',
        ),
        (
            "      background: rgba(255, 255, 255, 0.52);\n      border: 1.5px solid rgba(255, 255, 255, 0.88);",
            "      background: var(--vault-bg);\n      border: 1.5px solid var(--vault-edge);",
            'vault strip',
        ),
        (
            "      filter: drop-shadow(0 10px 24px rgba(17, 24, 39, 0.035));",
            "      filter: drop-shadow(0 10px 24px var(--shadow-soft));",
            'card shadow',
        ),
        (
            "      filter: drop-shadow(0 10px 26px rgba(17, 24, 39, 0.035));",
            "      filter: drop-shadow(0 10px 26px var(--shadow-soft));",
            'swap shadow',
        ),
        (
            "      color: #0b0b0c;\n      font-weight: 600;",
            "      color: var(--ink-1);\n      font-weight: 600;",
            'swap input',
        ),
        (
            "      background: rgba(235, 239, 248, 0.25);",
            "      background: var(--overlay);",
            'overlay idle',
        ),
        (
            "      background: rgba(236, 240, 249, 0.78);",
            "      background: var(--overlay-active);",
            'overlay active',
        ),
        (
            "      background: #0b0b0c;\n      box-shadow:\n        0 18px 40px rgba(11, 11, 12, 0.24),",
            "      background: var(--solid);\n      box-shadow:\n        0 18px 40px rgba(11, 11, 12, 0.24),",
            'complete orb',
        ),
    ]
    for old, new, label in css_rules:
        if old not in src:
            print(f"MISS: {label}", file=sys.stderr)
            continue
        src = src.replace(old, new)
        counts[label] = 1

    # 6. Nav state written from JS: swap the hardcoded shadow utlity for the
    #    class the stylesheet owns, and drop the fill loops.
    old_active = "iconWrap.className = 'nav-icon-wrap w-[48px] h-[48px] rounded-full bg-[var(--card)] shadow-[0_4px_14px_rgba(15,23,42,0.06)] flex items-center justify-center transition-all';"
    new_active = "iconWrap.className = 'nav-icon-wrap w-[48px] h-[48px] rounded-full nav-icon-on flex items-center justify-center transition-all';"
    counts['js nav active'] = src.count(old_active)
    src = src.replace(old_active, new_active)

    # The static markup has the same pair of classes; keep the two in sync.
    counts['html nav active'] = src.count(
        'bg-[var(--card)] shadow-[0_4px_14px_rgba(15,23,42,0.06)]'
    )
    src = src.replace(
        'bg-[var(--card)] shadow-[0_4px_14px_rgba(15,23,42,0.06)]', 'nav-icon-on'
    )

    for loop in ("\n          fills.forEach(el => el.setAttribute('fill', 'var(--ink-1)'));",
                 "\n          fills.forEach(el => el.setAttribute('fill', 'var(--ink-2)'));"):
        if loop in src:
            src = src.replace(loop, "")
            counts['js fill loop'] = counts.get('js fill loop', 0) + 1

    src, n = re.subn(r"btn\.classList\.(add|remove)\('justify-start', 'bg-\[#D5DBE7\]'\)",
                     lambda m: f"btn.classList.{m.group(1)}('justify-start', 'slide-track-filled')", src)
    counts['slide fill js'] = n
    # The slide track's fill class is added from JS, so it goes through a CSS
    # class the stylesheet owns rather than a utility the CDN has to generate
    # on a DOM mutation.
    src, n = re.subn(
        r"'(?:bg-\[#D5DBE7\]|bg-\[var\(--hairline-strong\)\])'",
        "'slide-track-filled'",
        src,
    )
    counts['slide fill js'] = n

    # 7. Token block + dark overrides, inserted before the closing </style>.
    idx = src.rindex("  </style>")
    src = src[:idx] + CRITICAL_CSS + src[idx:]

    # 8. Theme attribute, default dark, plus the review toggle.
    src = src.replace('<html lang="en">', '<html lang="en" data-theme="dark">', 1)
    toggle = """  <button id="themeToggle" class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">Light</button>

"""
    marker = '  <!-- Mobile Viewport Container (393 x 852) -->'
    src = src.replace(marker, toggle + marker, 1)
    js_hook = """
    // Review-only theme switch. The shipped app follows the OS setting instead.
    function toggleTheme() {
      const root = document.documentElement;
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      document.getElementById('themeToggle').textContent = next === 'dark' ? 'Light' : 'Dark';
    }
    document.addEventListener('DOMContentLoaded', function () {
      document.getElementById('themeToggle').textContent =
        document.documentElement.dataset.theme === 'dark' ? 'Light' : 'Dark';
    });
"""
    src = src.replace("  </script>", js_hook + "  </script>", 1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(src)
    OUT_LIGHT.write_text(src.replace('data-theme="dark"', 'data-theme="light"', 1))

    for k, v in sorted(counts.items()):
        print(f"{v:4}  {k}")
    print(f"\nwrote {OUT} ({len(src.splitlines())} lines)")
    print(f"wrote {OUT_LIGHT} (same file, light theme, for the no-regression check)")


if __name__ == "__main__":
    main()
