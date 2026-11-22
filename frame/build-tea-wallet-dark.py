#!/usr/bin/env python3
"""Port the tokenized dark theme into the full Vanta wallet prototype.

The prototype hardcodes its light palette into Tailwind arbitrary values
(text-[#0b0b0c]) and SVG presentation attributes. Duplicating every class a
second time for dark would drift the moment either copy changes, so this script
rewrites the neutrals into CSS variables and lets the palette live in one place.
Brand colors (USDT green, BNB gold, the Solana gradient, violet fills) are left
alone on purpose: they do not change between themes.

The output is written inside the repo first so it can be reviewed and diffed;
the Desktop file is only updated once the result has been checked.
"""
import re
import sys
from pathlib import Path

# Input is the pristine prototype, not the Desktop copy: the Desktop file is
# our own output, so regenerating from it would re-apply every transform on top
# of itself.
SRC = Path("/Users/mac/vanta-mobile/frame/tea_crypto_wallet.orig.html")
OUT = Path("/Users/mac/vanta-mobile/frame/tea-wallet-dark.html")
# Light twin, written outside the repo: it exists only so the port can be
# diffed against the original, so it is not a second source of truth.
OUT_LIGHT = Path("/tmp/tea-wallet-light.html")

TEXT = {
    "#0b0b0c": "--ink-1",
    "#8a90a0": "--ink-2",
    "#7c8394": "--ink-3",
    "#7c3aed": "--accent-text",
    "#0052ff": "--accent-link",
}
# The near-identical greys keep separate tokens so light mode does not shift;
# they all resolve inside the same narrow band in dark.
BG = {
    "#0b0b0c": "--solid",
    "#f5f7fb": "--surface-2",
    "#f1f4fa": "--surface-3",
    "#f8f9fb": "--surface-2-hi",
    "#f8f9fc": "--surface-2-hi",
    "#eceff7": "--surface-hover",
    "#e5e9f2": "--surface-hover",
    "#e6e9f0": "--chip",
    "#e6e9f2": "--chip",
    "#d8dce3": "--chip",
    "#dce1ec": "--track-off",
    "#d5dbe7": "--track-off",
}
BORDER = {
    "#dfe3ec": "--hairline",
    "#e5e8ef": "--hairline",
    "#e5e8f0": "--hairline",
    "#e4e8f0": "--hairline",
    "#e2e6f0": "--hairline",
    "#e6eaf2": "--hairline",
    "#eaecef": "--hairline",
    "#f0f2f7": "--hairline-soft",
    "#0b0b0c": "--ink-1",
}

counts = {}


def bump(key, n=1):
    counts[key] = counts.get(key, 0) + n


def rewrite_utils(src, prop, table):
    """text-[#0b0b0c] -> text-[var(--ink-1)], keeping any variant prefix."""
    def sub(m):
        variant, hexv = m.group(1) or "", m.group(2).lower()
        token = table.get(hexv)
        if not token:
            return m.group(0)
        bump(f"{prop} {hexv}")
        return f"{variant}{prop}-[var({token})]"

    pat = re.compile(
        r'((?:hover|active|focus|group-hover):)?' + prop + r'-\[(#[0-9a-fA-F]{6})\]'
    )
    return pat.sub(sub, src)


TOKENS = """
    /* ===================================================================== */
    /* THEME TOKENS                                                          */
    /* ===================================================================== */
    /* One palette, two themes. Light values are the prototype's originals so
       the light experience stays where it was; the dark values are Vanta's
       site palette (canvas #0a0a0b, surface #121214, hairline #27272a, ink
       #e8e8ea, violet #8b7cf6) so the wallet reads as the same product as
       vanta-mobile.xyz rather than as a generic dark skin.
       Components must never hardcode a neutral; anything not listed here is a
       brand or a signal color and is theme-independent. */
    :root {
      color-scheme: light;
      --ink-1: #0b0b0c;
      --ink-2: #8a90a0;
      --ink-3: #7c8394;
      --solid: #0b0b0c;
      --on-solid: #ffffff;
      --card: #ffffff;
      --card-a90: rgba(255, 255, 255, 0.9);
      --card-a75: rgba(255, 255, 255, 0.75);
      --surface-2: #f5f7fb;
      --surface-3: #f1f4fa;
      --surface-2-hi: #f8f9fb;
      --surface-hover: #eceff7;
      --chip: #e6e9f0;
      --knob: #e0e5f3;
      --knob-fill: #ffffff;
      --track-off: #d5dbe7;
      --hairline: #e5e8ef;
      --hairline-soft: #f0f2f7;
      --hairline-strong: rgba(255, 255, 255, 0.88);
      --ring: rgba(255, 255, 255, 0.9);
      --ring-faint: rgba(0, 0, 0, 0.05);
      --hover-tint: rgba(0, 0, 0, 0.03);
      --scrim: rgba(0, 0, 0, 0.3);
      --icon-bg: #0b0b0c;
      --icon-ink: #ffffff;
      --orb-ink: #0b0b0c;
      --nav-active: #f4efff;
      --nav-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.16), 0 4px 14px rgba(124, 58, 237, 0.12);
      --nav-ink: #6d28d9;
      --accent-text: #7c3aed;
      --accent-wash: rgba(124, 58, 237, 0.12);
      --accent-link: #0052ff;
      --wall-1: #dce0e6;
      --wall-2: #eef1f5;
      --wall-3: #e5e1f2;
      --frame-1: #eeeff3;
      --frame-2: #eceef3;
      --frame-3: #e6eaf3;
      --frame-4: #e2e1f6;
      --frame-shadow: 0 30px 70px -15px rgba(15, 23, 42, 0.22);
      --frame-edge: rgba(255, 255, 255, 0.82);
      --shadow-soft: rgba(17, 24, 39, 0.035);
      --vault-bg: rgba(241, 235, 255, 0.8);
      --vault-edge: rgba(255, 255, 255, 0.88);
      --overlay: rgba(235, 239, 248, 0.25);
      --overlay-active: rgba(236, 240, 249, 0.78);
    }

    [data-theme="dark"] {
      color-scheme: dark;
      --ink-1: #e8e8ea;
      --ink-2: #8f8f96;
      --ink-3: #7f7f88;
      --solid: #26262a;
      --on-solid: #f4f4f6;
      --card: #121214;
      --card-a90: rgba(18, 18, 20, 0.92);
      --card-a75: rgba(18, 18, 20, 0.78);
      --surface-2: #18181b;
      --surface-3: #1b1b1f;
      --surface-2-hi: #1f1f23;
      --surface-hover: #232327;
      --chip: #27272a;
      --knob: #0f0f12;
      --knob-fill: #ededf0;
      --track-off: #3a3a40;
      --hairline: #27272a;
      --hairline-soft: #222226;
      --hairline-strong: rgba(255, 255, 255, 0.16);
      --ring: rgba(255, 255, 255, 0.1);
      --ring-faint: rgba(255, 255, 255, 0.08);
      --hover-tint: rgba(255, 255, 255, 0.06);
      --scrim: rgba(0, 0, 0, 0.62);
      --icon-bg: #e8e8ea;
      --icon-ink: #121214;
      --orb-ink: #f4f4f6;
      --nav-active: rgba(139, 124, 246, 0.14);
      --nav-shadow: inset 0 0 0 1px rgba(139, 124, 246, 0.28);
      --nav-ink: #a79bff;
      --accent-text: #a79bff;
      --accent-wash: rgba(139, 124, 246, 0.16);
      --accent-link: #7aa2ff;
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
    }

    /* Nav state lives in CSS rather than in switchTab(), so the theme has one
       owner and the SVG presentation attributes, which cannot hold var(), stop
       being a second source of truth. */
    .nav-item .nav-icon-wrap {
      width: 46px;
      height: 46px;
      background: transparent;
      box-shadow: none;
    }
    .nav-item .nav-svg-fill { fill: var(--ink-2); }
    .nav-item .nav-svg-stroke { stroke: var(--ink-2); }
    .nav-item .nav-label { color: var(--ink-2); font-weight: 500; }
    .nav-item.active .nav-icon-wrap {
      width: 48px;
      height: 48px;
      background: var(--nav-active);
      box-shadow: var(--nav-shadow);
    }
    .nav-item.active .nav-svg-fill { fill: var(--nav-ink); }
    .nav-item.active .nav-svg-stroke { stroke: var(--nav-ink); }
    .nav-item.active .nav-label { color: var(--nav-ink); font-weight: 600; }

    /* The pearl reads as a lit object on a white wall and as a duller, cooler
       stone on near-black; the light recipe would glare there. The specular is
       dialled back so the glyph on top keeps its contrast. */
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

    /* The cards are wavy SVG paths, so in light mode the white surface alone
       separated them from the wall. On near-black they need an edge instead. */
    [data-theme="dark"] .token-card-wrapper svg path,
    [data-theme="dark"] .swap-card-shadow svg path {
      stroke: var(--hairline);
      stroke-width: 1;
    }
"""

THEME_JS = """
    // Theme lives on <html> so tokens apply to the frame and the wall as well
    // as the app, and so it can be restored before first paint.
    function syncThemeSwitch() {
      const btn = document.getElementById('darkModeSwitch');
      if (!btn) return;
      const isDark = document.documentElement.dataset.theme === 'dark';
      btn.classList.toggle('justify-end', isDark);
      btn.classList.toggle('justify-start', !isDark);
      btn.classList.toggle('bg-[var(--solid)]', isDark);
      btn.classList.toggle('bg-[var(--track-off)]', !isDark);
      btn.setAttribute('aria-checked', String(isDark));
    }

    function toggleDarkMode() {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('vanta-theme', next); } catch (e) { /* private mode */ }
      syncThemeSwitch();
      showToast(next === 'dark' ? 'Dark mode on' : 'Light mode on');
    }
"""

# Wallet name and photo. Stored per address so switching accounts cannot
# rename the other wallets, and every surface repaints from this one store.
PROFILE_JS = r"""
    // -----------------------------------------------------------------------
    // WALLET IDENTITY: NAME AND PHOTO
    // Keyed by address, because the switcher holds three wallets and a rename
    // must not follow you into the next one.
    // -----------------------------------------------------------------------
    const PROFILE_KEY = 'vanta-wallet-profiles';
    const DEFAULT_AVATAR_SRC = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
    // Gradients only, no bitmaps, so a picked avatar carries no network call
    // and stays crisp at every size the app renders.
    const AVATAR_PRESETS = [
      { from: '#7C3AED', to: '#2A1B5E' },
      { from: '#F25C54', to: '#8C3A34' },
      { from: '#26A17B', to: '#124F3C' },
      { from: '#F3BA2F', to: '#8A6714' },
      { from: '#3B82F6', to: '#1E3A8A' },
      { from: '#64748B', to: '#1E293B' }
    ];
    let pendingAvatar = null;

    function loadProfiles() {
      try {
        const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (e) {
        return {};
      }
    }

    function currentProfile() {
      const saved = loadProfiles()[walletState.fullAddress] || {};
      return {
        name: saved.name || '',
        avatar: saved.avatar || { type: 'photo', src: DEFAULT_AVATAR_SRC }
      };
    }

    function identityName() {
      return currentProfile().name || walletState.walletName;
    }

    function escapeText(value) {
      return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    // The frame is round, so a photo crops from the top like the shipped
    // portrait rather than centring and cutting a face in half.
    function avatarMarkup(avatar, name, size) {
      if (avatar && avatar.type === 'photo' && avatar.src) {
        return `<img src="${escapeText(avatar.src)}" alt="" class="w-full h-full object-cover object-top" />`;
      }
      const preset = AVATAR_PRESETS[(avatar && avatar.index) || 0];
      const initial = escapeText((name || 'W').trim().charAt(0).toUpperCase() || 'W');
      return `<span class="w-full h-full flex items-center justify-center font-semibold text-white" style="background: linear-gradient(135deg, ${preset.from}, ${preset.to}); font-size: ${Math.round(size * 0.42)}px">${initial}</span>`;
    }

    function applyAvatar(el, size, avatar, name) {
      if (!el) return;
      // The editor previews a choice that is not saved yet, so the avatar is a
      // parameter rather than always the stored one.
      const shown = avatar || currentProfile().avatar;
      el.innerHTML = avatarMarkup(shown, name || identityName(), size);
    }

    function renderWalletIdentity() {
      const name = identityName();
      const headerLabel = document.getElementById('walletAddressLabel');
      if (headerLabel) headerLabel.textContent = name;
      const settingsName = document.getElementById('settingsWalletName');
      if (settingsName) settingsName.textContent = name;
      const settingsAddr = document.getElementById('settingsWalletAddr');
      if (settingsAddr && walletState.fullAddress.length > 14) {
        settingsAddr.textContent = `${walletState.fullAddress.slice(0, 10)}...${walletState.fullAddress.slice(-4)}`;
      }
      applyAvatar(document.getElementById('headerAvatar'), 44);
      applyAvatar(document.getElementById('settingsAvatar'), 48);
      applyAvatar(document.getElementById('editAvatarPreview'), 72);
    }

    function openEditWallet() {
      // Copied, so Cancel really cancels.
      pendingAvatar = JSON.parse(JSON.stringify(currentProfile().avatar));
      openSheet('editWallet');
    }

    function avatarTile(index, selected) {
      const preset = AVATAR_PRESETS[index];
      const ring = selected ? 'ring-2 ring-[var(--accent-text)] ring-offset-2 ring-offset-[var(--card)]' : '';
      return `<button type="button" onclick="chooseAvatarPreset(${index})" aria-label="Gradient avatar ${index + 1}" aria-pressed="${selected}" class="w-[46px] h-[46px] rounded-full tap-scale ${ring}" style="background: linear-gradient(135deg, ${preset.from}, ${preset.to})"></button>`;
    }

    function renderEditWalletSheet() {
      const tiles = AVATAR_PRESETS.map((_, i) => avatarTile(i, !!(pendingAvatar && pendingAvatar.type === 'preset' && pendingAvatar.index === i))).join('');
      return `
        <div>
          <h3 class="text-[18px] font-semibold text-[var(--ink-1)] text-center">Edit wallet</h3>
          <div class="mt-4 flex items-center gap-3.5">
            <div id="editAvatarPreview" class="w-[72px] h-[72px] rounded-full overflow-hidden bg-[var(--chip)] ring-1 ring-[var(--ring-faint)] shrink-0"></div>
            <div class="flex-1 min-w-0">
              <label for="walletNameInput" class="text-[12px] font-medium text-[var(--ink-2)]">Wallet name</label>
              <input id="walletNameInput" type="text" maxlength="24" spellcheck="false" autocomplete="off" value="${escapeText(identityName())}" class="mt-1 w-full h-[44px] px-3.5 rounded-[16px] bg-[var(--surface-2)] border border-[var(--hairline)] text-[15px] font-medium text-[var(--ink-1)] outline-none focus:border-[var(--accent-text)]" />
            </div>
          </div>
          <div class="mt-5">
            <div class="flex items-center justify-between">
              <span class="text-[12px] font-medium text-[var(--ink-2)]">Photo</span>
              <label class="text-[12.5px] font-semibold text-[var(--accent-link)] cursor-pointer tap-scale">
                Upload
                <input id="avatarFileInput" type="file" accept="image/*" class="hidden" onchange="handleAvatarFile(this)" />
              </label>
            </div>
            <div class="mt-2.5 flex flex-wrap gap-2.5">${tiles}</div>
          </div>
          <div class="mt-5 flex gap-2.5">
            <button onclick="closeSheet()" class="flex-1 h-[50px] rounded-full bg-[var(--surface-2)] text-[var(--ink-1)] text-[14.5px] font-medium tap-scale">Cancel</button>
            <button onclick="saveWalletIdentity()" class="flex-1 h-[50px] rounded-full bg-[var(--solid)] text-[var(--on-solid)] text-[14.5px] font-medium tap-scale">Save</button>
          </div>
        </div>
      `;
    }

    function paintEditWalletSheet(keepValue) {
      const body = document.getElementById('sheetBody');
      if (!body) return;
      body.innerHTML = renderEditWalletSheet();
      const input = document.getElementById('walletNameInput');
      if (input && typeof keepValue === 'string') input.value = keepValue;
      applyAvatar(document.getElementById('editAvatarPreview'), 72, pendingAvatar, input ? input.value : identityName());
    }

    function rerenderEditSheet() {
      // Preview and the selected tile both hang off pendingAvatar, so the body
      // is rebuilt rather than patched twice. Typed text survives the rebuild.
      const current = document.getElementById('walletNameInput');
      paintEditWalletSheet(current ? current.value : null);
    }

    function chooseAvatarPreset(index) {
      pendingAvatar = { type: 'preset', index };
      rerenderEditSheet();
    }

    function handleAvatarFile(input) {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type || file.type.indexOf('image/') !== 0) {
        showToast('Pick an image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          // Downscaled to 192px before storage: a phone photo as a data URL
          // would blow the storage quota on the first save.
          const side = 192;
          const canvas = document.createElement('canvas');
          canvas.width = side;
          canvas.height = side;
          const ctx = canvas.getContext('2d');
          const scale = Math.max(side / img.width, side / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (side - w) / 2, 0, w, h);
          pendingAvatar = { type: 'photo', src: canvas.toDataURL('image/jpeg', 0.85) };
          rerenderEditSheet();
          showToast('Photo ready');
        };
        img.onerror = () => showToast('Could not read that image');
        img.src = reader.result;
      };
      reader.onerror = () => showToast('Could not read that file');
      reader.readAsDataURL(file);
      input.value = '';
    }

    function saveWalletIdentity() {
      const input = document.getElementById('walletNameInput');
      const name = ((input && input.value) || '').trim().replace(/\s+/g, ' ');
      if (!name) {
        showToast('Give the wallet a name');
        if (input) input.focus();
        return;
      }
      const profiles = loadProfiles();
      profiles[walletState.fullAddress] = {
        name: name,
        avatar: pendingAvatar || { type: 'photo', src: DEFAULT_AVATAR_SRC }
      };
      let persisted = true;
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
      } catch (e) {
        // Quota, or private mode. The change still applies, but claiming it
        // will survive a reload would be a lie.
        persisted = false;
      }
      walletState.walletName = name;
      renderWalletIdentity();
      closeSheet();
      showToast(persisted ? 'Wallet updated' : 'Updated for this session only');
    }
"""

PREPAINT = """  <script>
    // Restored before first paint so a dark-by-default app never flashes light.
    // Missing storage means dark: that is the shipped default.
    (function () {
      var saved = null;
      try { saved = localStorage.getItem('vanta-theme'); } catch (e) {}
      document.documentElement.dataset.theme = saved === 'light' ? 'light' : 'dark';
    })();
  </script>
"""


def main():
    src = SRC.read_text()

    # 1. Dead theme block: .theme-dark is never applied to any element, so the
    #    whole hand-rolled block goes; only the structural rules below survive.
    start = src.index("    /* ===================================================================== */\n    /* VANTA OBSIDIAN PURPLE DARK MODE")
    end = src.index("    /* Vault Frosted Pill Container */")
    src = src[:start] + src[end:]
    bump("dead theme block", 1)

    # 2. Token block replaces the three leftover prototype variables.
    old_root = """    :root {
      --bg-top: #dce0e6;
      --bg-mid: #eef1f5;
      --bg-bottom: #e2e6ee;
      --ink-primary: #0b0b0c;
      --ink-muted: #8a90a0;
      --card-surface: #ffffff;
    }
"""
    if old_root not in src:
        sys.exit("MISS: root block")
    src = src.replace(old_root, TOKENS.lstrip("\n"), 1)
    bump("token block", 1)

    # 3. Settings row: the switch now owns the theme, not a skinnable "look".
    src, n = re.subn(
        r'<span class="text-\[14\.5px\] font-semibold text-\[#0b0b0c\]">Obsidian Purple</span>',
        '<span class="text-[14.5px] font-semibold text-[#0b0b0c]">Dark Mode</span>',
        src,
    )
    bump("settings label", n)
    src, n = re.subn(
        r'aria-label="Toggle Obsidian Purple Dark Mode"',
        'aria-label="Toggle Dark Mode" role="switch"',
        src,
    )
    bump("settings aria", n)

    # 4. Utilities that carry opacity cannot take a var() channel, so they are
    #    swapped for a finished token instead of a variable plus "/12".
    explicit = [
        (r'bg-\[#7C3AED\]/12', 'bg-[var(--accent-wash)]', 'violet wash'),
        (r'ring-\[#0b0b0c\]/15', 'ring-[var(--ring-faint)]', 'ring faint'),
        (r'hover:bg-black/\[0\.03\]', 'hover:bg-[var(--hover-tint)]', 'hover tint'),
        (r'ring-black/5', 'ring-[var(--ring-faint)]', 'ring black'),
        (r'bg-black/30', 'bg-[var(--scrim)]', 'scrim'),
        # Switch knobs sit on a track, not on a card, so they need their own
        # fill: --card would vanish against the dark track.
        (r'rounded-full bg-white shadow-sm', 'rounded-full bg-[var(--knob-fill)] shadow-sm', 'knob'),
        (r'bg-white/90', 'bg-[var(--card-a90)]', 'card a90'),
        (r'bg-white/75', 'bg-[var(--card-a75)]', 'card a75'),
    ]
    for pat, repl, label in explicit:
        src, n = re.subn(pat, repl, src)
        if not n:
            print(f"MISS: {label}", file=sys.stderr)
        bump(label, n)

    for prop, table in (("text", TEXT), ("bg", BG), ("border", BORDER)):
        src = rewrite_utils(src, prop, table)

    # 5. Tailwind's keyword colors that carry the same meaning.
    rules = [
        (r'(?<![-:\w])bg-white(?![/\w])', 'bg-[var(--card)]', 'bg white'),
        (r'(?<![-:\w])text-white(?![/\w])', 'text-[var(--on-solid)]', 'text white'),
        (r'(?<![-:\w])border-white(?![/\w])', 'border-[var(--hairline-strong)]', 'border white'),
        (r'ring-white(?![/\w])', 'ring-[var(--ring)]', 'ring white'),
    ]
    for pat, repl, label in rules:
        src, n = re.subn(pat, repl, src)
        bump(label, n)

    # 6. SVG presentation attributes.
    #    The TEA glyph sits on the pearl, so it follows the pearl's ink rather
    #    than the icon chip pair.
    src, n = re.subn(r'r="2\.4" fill="#0b0b0c"', 'r="2.4" fill="var(--orb-ink)"', src)
    bump("tea glyph", n)
    src, n = re.subn(r'fill="#0b0b0c"', 'fill="var(--icon-bg)"', src, flags=re.I)
    bump("fill icon bg", n)
    # The action pill is the one solid black shape whose label is white on top,
    # so it follows --solid rather than the icon chip.
    src, n = re.subn(
        r'Z\n(\s+)"\n\s+fill="var\(--icon-bg\)"',
        lambda m: f'Z\n{m.group(1)}"\n{m.group(1)}fill="var(--solid)"',
        src,
    )
    bump("action pill", n)
    src, n = re.subn(r'stroke="#0b0b0c"', 'stroke="var(--ink-1)"', src, flags=re.I)
    bump("stroke ink", n)
    # The pearl's glyphs stay light in both themes.
    for tag in (
        r'<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="',
        r'<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="',
    ):
        src, n = re.subn(tag + r'var\(--ink-1\)', tag + 'var(--orb-ink)', src)
        bump("pearl glyph", n)
    src, n = re.subn(r'fill="#8A90A0"', 'fill="var(--ink-2)"', src, flags=re.I)
    bump("fill muted", n)
    for old, new, label in (
        ('fill="#E1E6F3"', 'fill="var(--knob)"', 'knob fill 1'),
        ('fill="#E0E5F3"', 'fill="var(--knob)"', 'knob fill 2'),
        ('stroke="#C6CCD8"', 'stroke="var(--hairline)"', 'gauge track'),
        ('stroke="#7A8191"', 'stroke="var(--ink-3)"', 'gauge arc'),
    ):
        n = src.lower().count(old.lower())
        src = re.sub(re.escape(old), new, src, flags=re.I)
        bump(label, n)

    # 7. Two shapes that are white in light mode but must follow the theme.
    #    (a) The token cards are wavy SVG blobs, not divs, so their surface is a
    #        path fill and has to be themed like any other card.
    src, n = re.subn(
        r'(d="M 30,0 L \d+,0[^"]*" )fill="#FFFFFF"',
        r'\1fill="var(--card)"',
        src,
    )
    bump("card path inline", n)
    # The swap cards put the fill on its own line after the closing Z.
    src, n = re.subn(
        r'Z\n(\s+)"\n\s+fill="#FFFFFF"',
        lambda m: f'Z\n{m.group(1)}"\n{m.group(1)}fill="var(--card)"',
        src,
    )
    bump("card path multiline", n)

    #    (b) A badge is a dark chip with a white mark drawn on it. Both follow
    #        --icon-bg, so on dark the chip flips light and the mark flips dark.
    parts = re.split(r'(?=<svg)', src)
    for i, part in enumerate(parts):
        if 'var(--icon-bg)' in part:
            new = part.replace('stroke="#FFFFFF"', 'stroke="var(--icon-ink)"')
            new = new.replace('fill="#FFFFFF"', 'fill="var(--icon-ink)"')
            if new != part:
                bump("badge glyph")
                parts[i] = new
    src = ''.join(parts)

    # 8. Component CSS that carries color.
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
            "        background: #eef1f5;",
            "        background: var(--wall-2);",
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
        bump(label, 1)

    # 9. switchTab() only moves the active class; the stylesheet owns both the
    #    sizing and the ink, so there is nothing left to set per icon.
    src, n = re.subn(
        r"      document\.querySelectorAll\('\.nav-item'\)\.forEach\(item => \{.*?\n      \}\);\n",
        """      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
      });
""",
        src,
        flags=re.S,
    )
    if not n:
        sys.exit("MISS: switchTab nav loop")
    bump("switchTab nav", n)

    # 10. Theme JS replaces the class-flipping version, which could not survive
    #     a reload or reach the frame and wall.
    src, n = re.subn(
        r"    function toggleDarkMode\(btn\) \{.*?\n    \}\n",
        THEME_JS.lstrip("\n"),
        src,
        flags=re.S,
    )
    if not n:
        sys.exit("MISS: toggleDarkMode")
    bump("toggleDarkMode", n)

    # 11. html attribute, pre-paint restore, and the first sync.
    src = src.replace('<html lang="en">', '<html lang="en" data-theme="dark">', 1)
    src = src.replace('  <meta name="viewport"', PREPAINT + '  <meta name="viewport"', 1)
    src = src.replace("  </script>\n</body>", "    syncThemeSwitch();\n  </script>\n</body>", 1)

    # 12. Wallet identity. The name and portrait were typed into the markup in
    #     three places with no way to change them, so each surface now carries
    #     an id and one render function writes all of them.
    identity_edits = [
        (
            '<div class="w-[44px] h-[44px] rounded-full overflow-hidden bg-[var(--chip)] ring-1 ring-[var(--ring-faint)]">',
            '<div id="headerAvatar" class="w-[44px] h-[44px] rounded-full overflow-hidden bg-[var(--chip)] ring-1 ring-[var(--ring-faint)]">',
            'header avatar hook',
        ),
        (
            """            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
              onerror="this.onerror=null;this.src='https://placehold.co/88x88/D8DCE3/0b0b0c?text=U';"
              alt="Profile"
              class="w-[48px] h-[48px] rounded-full object-cover object-top"
            />""",
            """            <span id="settingsAvatar" class="block w-[48px] h-[48px] rounded-full overflow-hidden bg-[var(--chip)] shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80"
                onerror="this.onerror=null;this.src='https://placehold.co/88x88/D8DCE3/0b0b0c?text=U';"
                alt="Profile"
                class="w-full h-full object-cover object-top"
              />
            </span>""",
            'settings avatar hook',
        ),
        (
            '<span class="text-[15.5px] font-semibold text-[var(--ink-1)]">Main Wallet</span>',
            '<span id="settingsWalletName" class="text-[15.5px] font-semibold text-[var(--ink-1)]">Main Wallet</span>',
            'settings wallet name',
        ),
        (
            '<span class="text-[13px] text-[var(--ink-2)] font-medium">0xfK0792b4...8336</span>',
            '<span id="settingsWalletAddr" class="text-[13px] text-[var(--ink-2)] font-medium">0xfK0792b4...8336</span>',
            'settings wallet address',
        ),
        (
            """          <button onclick="copyAddress()" class="h-[36px] px-[14px] rounded-full bg-[var(--surface-3)] text-[var(--ink-1)] text-[12.5px] font-semibold tap-scale">
            Copy
          </button>""",
            """          <div class="flex items-center gap-1.5 shrink-0">
            <button onclick="openEditWallet()" aria-label="Edit wallet name and photo" class="w-[36px] h-[36px] rounded-full bg-[var(--surface-3)] flex items-center justify-center tap-scale">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-1)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 20h4l10-10-4-4L4 16v4z" />
                <path d="M14 6l4 4" />
              </svg>
            </button>
            <button onclick="copyAddress()" class="h-[36px] px-[14px] rounded-full bg-[var(--surface-3)] text-[var(--ink-1)] text-[12.5px] font-semibold tap-scale">
              Copy
            </button>
          </div>""",
            'settings edit button',
        ),
        (
            """          { name: 'Cold Node', addr: '0x3C81...77B2', full: '0x3C8140f9a21e88c377B2', bal: '68,400.50 USD' }
        ];""",
            """          { name: 'Cold Node', addr: '0x3C81...77B2', full: '0x3C8140f9a21e88c377B2', bal: '68,400.50 USD' }
        ];
        // A renamed wallet keeps its new name here, so the stored profile wins
        // over the sample name baked into this array.
        wallets.forEach(w => { const saved = loadProfiles()[w.full]; if (saved && saved.name) w.name = saved.name; });""",
            'switcher names',
        ),
        (
            """              `).join('')}
            </div>
          </div>
        `;
      } else if (type === 'notifications') {""",
            """              `).join('')}
            </div>
            <button onclick="openEditWallet()" class="mt-2.5 w-full h-[50px] rounded-[22px] border border-[var(--hairline)] flex items-center justify-center gap-2 text-[13.5px] font-semibold text-[var(--ink-1)] tap-scale">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-1)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 20h4l10-10-4-4L4 16v4z" />
                <path d="M14 6l4 4" />
              </svg>
              Edit name and photo
            </button>
          </div>
        `;
      } else if (type === 'notifications') {""",
            'switcher edit row',
        ),
        (
            "      if (type === 'receive') {",
            "      if (type === 'editWallet') {\n        paintEditWalletSheet();\n      } else if (type === 'receive') {",
            'openSheet edit branch',
        ),
        (
            "      document.getElementById('walletAddressLabel').textContent = name;\n      closeSheet();",
            "      renderWalletIdentity();\n      closeSheet();",
            'switcher repaint',
        ),
    ]
    for old, new, label in identity_edits:
        if old not in src:
            sys.exit(f"MISS: {label}")
        src = src.replace(old, new, 1)
        bump(label, 1)

    # 13. Identity JS goes before the first render call, and the app paints the
    #     stored name and photo on load so a reload does not show the defaults.
    src = src.replace(
        "    syncThemeSwitch();\n  </script>\n</body>",
        PROFILE_JS.lstrip("\n") + "    syncThemeSwitch();\n    renderWalletIdentity();\n  </script>\n</body>",
        1,
    )
    if "renderWalletIdentity();" not in src:
        sys.exit("MISS: identity bootstrap")
    bump("identity bootstrap", 1)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(src)
    # The light twin also flips the restore default, otherwise the pre-paint
    # script would force dark on every load and the diff would be meaningless.
    light = src.replace('data-theme="dark"', 'data-theme="light"', 1)
    light = light.replace(
        "saved === 'light' ? 'light' : 'dark'", "saved === 'dark' ? 'dark' : 'light'"
    )
    OUT_LIGHT.write_text(light)

    for k, v in sorted(counts.items()):
        print(f"{v:4}  {k}")
    print(f"\nwrote {OUT} ({len(src.splitlines())} lines)")
    print(f"wrote {OUT_LIGHT} (same file, light theme, for the no-regression check)")


if __name__ == "__main__":
    main()
