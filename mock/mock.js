/* Vanta first-run mock. Two flows, same destination, tap counted. */

const S = { flow: 'new', screen: 'start', taps: 0, pub: 0, priv: 0 };

const ADDRESS = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

const NEW_STEPS = [
  { id: 'start', label: 'One screen. One button: Create my wallet.', tag: 'start', k: 'new' },
  { id: 'creating', label: 'Wallet and faucet run in the same tap', tag: 'create + fund', k: 'new' },
  { id: 'shield', label: 'Lands with Shield already open, amount filled in', tag: 'shield', k: 'same' },
  { id: 'shieldDone', label: 'Private balance, nothing else to find', tag: 'private balance', k: 'new' },
  { id: 'send', label: 'Send privately', tag: 'send', k: 'same' },
  { id: 'sendDone', label: 'Receipt', tag: 'receipt', k: 'same' },
];

const OLD_STEPS = [
  { id: 'o1', label: 'Intro page 1 of 3', tag: 'intro 1', k: 'gone' },
  { id: 'o2', label: 'Intro page 2 of 3', tag: 'intro 2', k: 'gone' },
  { id: 'o3', label: 'Intro page 3 of 3', tag: 'intro 3', k: 'gone' },
  { id: 'connect', label: 'Choose a wallet. The main button cannot work here.', tag: 'pick wallet', k: 'gone' },
  { id: 'dash0', label: 'Dashboard at 0.0000', tag: 'empty wallet', k: 'same' },
  { id: 'shield0', label: 'Shield 0.1 SOL', tag: 'shield', k: 'same' },
  { id: 'err', label: 'Refused: not enough SOL', tag: 'refused', k: 'dead', dead: true },
  { id: 'dash0b', label: 'Close the error, still at zero', tag: 'back', k: 'same' },
  { id: 'profile', label: 'Open the profile', tag: 'profile', k: 'gone' },
  { id: 'settings', label: 'Open settings, scroll', tag: 'settings', k: 'gone' },
  { id: 'dash1', label: 'Back out, now funded', tag: 'faucet', k: 'gone' },
  { id: 'shield1', label: 'Shield 0.1 SOL', tag: 'shield again', k: 'same' },
  { id: 'done', label: 'Receipt', tag: 'receipt', k: 'same' },
];

/* ---------- icons ---------- */

const shieldIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.6 20 5.5v6.2c0 4.6-3.2 8.4-8 9.7-4.8-1.3-8-5.1-8-9.7V5.5l8-2.9Z"/><path d="M8.6 12.1l2.3 2.3 4.5-4.6"/></svg>';

const infoIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5" stroke-linecap="round"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/></svg>';

const arrowIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';

const upIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V4m0 0l-6 6m6-6l6 6"/></svg>';

const downIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v16m0 0l-6-6m6 6l6-6"/></svg>';

const checkIcon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';

/* ---------- helpers ---------- */

const fmt = (n) => n.toFixed(4);

function qrHtml() {
  const N = 21;
  let seed = 11;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const finder = (x, y) => {
    const ring = x === 0 || x === 6 || y === 0 || y === 6;
    const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
    return ring || core;
  };
  let cells = '';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let on;
      if (x < 7 && y < 7) on = finder(x, y);
      else if (x > N - 8 && y < 7) on = finder(x - (N - 7), y);
      else if (x < 7 && y > N - 8) on = finder(x, y - (N - 7));
      else on = rnd() > 0.52;
      cells += '<i class="' + (on ? 'on' : '') + '"></i>';
    }
  }
  return '<div class="qr">' + cells + '</div>';
}

function dashboard() {
  const shieldTarget = S.flow === 'new' ? 'shield' : S.pub > 0 ? 'shield1' : 'shield0';
  return `
  <div class="screen">
    <div class="top">
      <button class="icon-btn" onclick="go('${S.flow === 'new' ? 'receive' : 'profile'}')" title="${S.flow === 'new' ? 'Receive' : 'Profile'}">${S.flow === 'new' ? downIcon : '<span class="mono" style="font-size:11px">SO</span>'}</button>
      <span class="pill">DEVNET</span>
      <button class="icon-btn" title="Sync">${upIcon}</button>
    </div>

    <div class="balance-card">
      <p class="balance-label">Private balance</p>
      <p class="balance-value">${fmt(S.priv)}<small>SOL</small></p>
    </div>

    <div class="split">
      <div><div class="k">Public</div><div class="v">${fmt(S.pub)}</div></div>
      <div><div class="k">Notes</div><div class="v">${S.priv > 0 ? '1' : '0'}</div></div>
    </div>

    <div class="row">
      <button class="btn ghost" onclick="go('${shieldTarget}')">${shieldIcon}<span class="stack"><span class="label">Shield</span><span class="sub">Set amount</span></span></button>
      <button class="btn ghost" onclick="go('send')">${upIcon}<span class="stack"><span class="label">Send</span><span class="sub">Shadow</span></span></button>
      <button class="btn ghost icon-only" onclick="go('${S.flow === 'new' ? 'receive' : 'profile'}')">${downIcon}</button>
    </div>

    <div class="mode-card">
      <div>
        <div style="font-size:13px;font-weight:600">Shadow mode</div>
        <div class="muted" style="font-size:11px;margin-top:3px">Amount hidden, recipient public</div>
      </div>
      <span class="pill">ON</span>
    </div>

    <div class="empty-note">
      ${S.priv > 0
        ? 'Nothing spent yet. The note is yours until you send it.'
        : 'No transactions yet.<br>Shield some SOL to go private.'}
    </div>
  </div>`;
}

function sheet(inner) {
  return dashboard() + `<div class="sheet-backdrop"><div class="sheet">${inner}</div></div>`;
}

/* ---------- views ---------- */

const views = {
  /* ===== proposed ===== */

  start: () => `
    <div class="screen center">
      <div>
        <div class="top" style="margin-bottom:34px"><span class="pill">DEVNET</span></div>
        <div class="hero">
          <div class="mark logo">${shieldIcon}</div>
          <p class="eyebrow accent" style="margin-bottom:12px">Private by default</p>
          <h1>Hidden amounts.<br>Visible recipients.</h1>
          <p class="lede">Shield a payment and it becomes a note only your keys can read. Who you paid stays public, and every receipt says so.</p>
        </div>
      </div>
      <div class="footer">
        <button class="btn primary" onclick="go('creating')">Create my wallet</button>
        <p class="tiny">No sign up. The key stays in this browser. Devnet only.</p>
      </div>
    </div>`,

  creating: () => `
    <div class="screen center">
      <div></div>
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px">
        <div class="spinner"></div>
        <h2>Setting up your wallet</h2>
        <p class="lede" style="text-align:center">No email, no password, no second app.</p>
      </div>
      <div class="steps-list" style="width:100%">
        <div class="step-line done"><span class="dot done">1</span>Wallet created on this device</div>
        <div class="step-line done"><span class="dot done">2</span>0.2 SOL from the Vanta faucet</div>
        <div class="step-line"><span class="dot live">3</span>Opening Shield</div>
      </div>
    </div>`,

  dash: dashboard,

  shield: () => sheet(`
    <div class="grab"></div>
    <h2>Shield SOL</h2>
    <p class="lede" style="margin-top:6px">Already filled in. One tap and it is done.</p>
    <div class="field">
      <div class="k">Amount</div>
      <div class="big">0.100<span>SOL</span></div>
    </div>
    <div class="honest">${infoIcon}<span>The amount is hidden. Your address stays visible as the payer, and the receipt says so in these words.</span></div>
    <button class="btn primary" onclick="go('shieldDone')">Shield 0.1 SOL</button>
    <button class="btn quiet" onclick="jump('dash')">Not now</button>
  `),

  shieldDone: () => `
    <div class="screen center">
      <div>
        <div class="check-big">${checkIcon}</div>
        <h1 style="text-align:center;font-size:26px">0.1 SOL is now private</h1>
        <p class="lede" style="text-align:center;margin:12px auto 0">Only your keys can read the amount. The deposit itself is a public transaction from your address.</p>
      </div>
      <div class="footer">
        <button class="btn primary" onclick="go('send')">Send it privately</button>
        <button class="btn quiet" onclick="go('dash')">Back to wallet</button>
      </div>
    </div>`,

  send: () => sheet(`
    <div class="grab"></div>
    <h2>Send privately</h2>
    <p class="lede" style="margin-top:6px">Shadow keeps the amount off chain. The recipient is still published.</p>
    <div class="field">
      <div class="k">To</div>
      <div class="mono" style="font-size:13px;margin-top:8px">7xKXtg2C...sgAsU</div>
    </div>
    <div class="field">
      <div class="k">Amount</div>
      <div class="big">0.050<span>SOL</span></div>
    </div>
    <div class="honest">${infoIcon}<span>Recipient published. Amount hidden. Your fee payer is public.</span></div>
    <button class="btn primary" onclick="go('sendDone')">Shadow send 0.05 SOL</button>
  `),

  sendDone: () => `
    <div class="screen">
      <div class="top"><span class="pill">RECEIPT</span></div>
      <div class="check-big" style="margin-top:20px">${checkIcon}</div>
      <h1 style="text-align:center;font-size:24px">0.05 SOL sent privately</h1>
      <p class="lede" style="text-align:center;margin:10px auto 22px">Confirmed on devnet.</p>
      <div class="balance-card">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:10px"><span class="muted">Mode</span><span>Shadow</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:10px"><span class="muted">Amount</span><span class="mono">hidden</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:10px"><span class="muted">Recipient</span><span class="mono">7xKX...sgAsU</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px"><span class="muted">Fee payer</span><span class="mono accent">relayer</span></div>
      </div>
      <div class="footer" style="margin-top:auto">
        <button class="btn primary" onclick="go('dash')">Back to wallet</button>
      </div>
    </div>`,

  receive: () => sheet(`
    <div class="grab"></div>
    <h2>Receive</h2>
    <p class="lede" style="margin-top:6px">Send SOL or USDC here, from any wallet. This address is public.</p>
    ${qrHtml()}
    <p class="addr">${ADDRESS}</p>
    <button class="btn ghost" style="margin-top:16px" onclick="go('dash')">Done</button>
  `),

  /* ===== current ===== */

  o1: () => `
    <div class="screen center">
      <div>
        <h1>Hidden amounts.<br>Visible recipients.</h1>
        <div class="intro-art"><div class="redact"></div></div>
        <p class="lede">Shield a payment and it becomes a note that only your keys can read.</p>
      </div>
      <div class="footer">
        <div class="dots"><i class="on"></i><i></i><i></i></div>
        <button class="btn primary" onclick="go('o2')">Next</button>
      </div>
    </div>`,

  o2: () => `
    <div class="screen center">
      <div>
        <p class="eyebrow accent">No sign-up</p>
        <h1 style="margin-top:10px">You are<br>the account.</h1>
        <div class="intro-art" style="height:240px">${shieldIcon}</div>
        <p class="lede">No email, no phone, no server holding your keys. This device is the whole wallet.</p>
      </div>
      <div class="footer">
        <div class="dots"><i></i><i class="on"></i><i></i></div>
        <button class="btn primary" onclick="go('o3')">Next</button>
      </div>
    </div>`,

  o3: () => `
    <div class="screen center">
      <div>
        <p class="eyebrow accent">You are set</p>
        <h1 style="margin-top:10px">Fund it, then send<br>what nobody can read</h1>
        <div class="intro-art">${shieldIcon}</div>
        <p class="lede">Add a little SOL to cover fees, shield it, then send privately. Nothing to configure.</p>
      </div>
      <div class="footer">
        <div class="dots"><i></i><i></i><i class="on"></i></div>
        <button class="btn primary" onclick="go('connect')">Done</button>
      </div>
    </div>`,

  connect: () => `
    <div class="screen center">
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:18px;margin-top:60px">
        <div class="logo">${shieldIcon}</div>
        <div>
          <h1 style="font-size:27px">Vanta</h1>
          <p class="lede" style="margin:10px auto 0">Private transfers on Solana. Shield into a pool, then Shadow-send to another Vanta user or Ghost-send to any wallet.</p>
        </div>
      </div>
      <div class="footer">
        <button class="btn primary" disabled>Connect device wallet</button>
        <p class="tiny">Unavailable in this browser. Mobile Wallet Adapter only exists in the Android app.</p>
        <button class="btn ghost" onclick="go('dash0')">Use a throwaway in-app wallet</button>
        <p class="tiny" style="margin-top:14px">Seed Vault / Phantom / Solflare holds your funds. Vanta never stores that key.</p>
        <p class="tiny" style="opacity:.7">No wallet app detected. Install Phantom or Solflare, or use a Seeker.</p>
      </div>
    </div>`,

  dash0: () => dashboard(),

  shield0: () => sheet(`
    <div class="grab"></div>
    <h2>Shield SOL</h2>
    <div class="field">
      <div class="k">Amount</div>
      <div class="big">0.100<span>SOL</span></div>
    </div>
    <div class="honest">${infoIcon}<span>The amount is hidden. Your address stays visible as the payer.</span></div>
    <button class="btn primary" onclick="go('err')">Shield 0.1 SOL</button>
  `),

  err: () => sheet(`
    <div class="grab"></div>
    <h2>Shield SOL</h2>
    <div class="field">
      <div class="k">Amount</div>
      <div class="big">0.100<span>SOL</span></div>
    </div>
    <div class="toast-error">Need 0.100005 SOL to shield ( 0.1 + network fee ). You have 0.000000.</div>
    <button class="btn ghost" onclick="go('dash0b')">Close</button>
    <p class="tiny" style="margin-top:14px">There is no button on this screen that can succeed.</p>
  `),

  dash0b: () => dashboard(),

  profile: () => `
    <div class="screen">
      <div class="top"><button class="icon-btn" onclick="go('dash0b')">${arrowIcon}</button><span class="pill">PROFILE</span><span style="width:42px"></span></div>
      <h2 style="margin-bottom:14px">Wallet</h2>
      <div class="empty-note" style="text-align:left">
        <div class="mono" style="font-size:11px;color:var(--white)">${ADDRESS}</div>
        <div style="margin-top:8px">In-app wallet, key in this browser.</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:18px">
        <button class="btn ghost" style="justify-content:space-between;padding:0 16px" onclick="go('settings')">Settings <span class="muted">›</span></button>
        <button class="btn ghost" style="justify-content:space-between;padding:0 16px" disabled>Back up wallet <span class="muted">›</span></button>
      </div>
      <p class="tiny" style="margin-top:auto">You came here looking for money. The faucet is one level deeper.</p>
    </div>`,

  settings: () => `
    <div class="screen">
      <div class="top"><button class="icon-btn" onclick="go('dash0b')">${arrowIcon}</button><span class="pill">SETTINGS</span><span style="width:42px"></span></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="mode-card"><div><div style="font-size:13px">Network</div><div class="muted" style="font-size:11px;margin-top:2px">Devnet</div></div><span class="muted">›</span></div>
        <div class="mode-card"><div><div style="font-size:13px">Force resync from chain</div><div class="muted" style="font-size:11px;margin-top:2px">Clears the local note cache and rescans.</div></div><span class="muted">›</span></div>
        <div class="mode-card"><div><div style="font-size:13px">Back up wallet</div><div class="muted" style="font-size:11px;margin-top:2px">Export the key from this browser.</div></div><span class="muted">›</span></div>
        <button class="mode-card" style="text-align:left;width:100%;cursor:pointer;border-color:rgba(139,121,240,.35)" onclick="go('dash1')">
          <div><div style="font-size:13px;color:var(--accent)">Get devnet SOL from the faucet</div><div class="muted" style="font-size:11px;margin-top:2px">Sends 1 test SOL to your public address.</div></div>
        </button>
      </div>
      <p class="tiny" style="margin-top:auto">Row 4 of 6, below three rows nobody needs on day one.</p>
    </div>`,

  dash1: () => dashboard(),

  shield1: () => sheet(`
    <div class="grab"></div>
    <h2>Shield SOL</h2>
    <div class="field">
      <div class="k">Amount</div>
      <div class="big">0.100<span>SOL</span></div>
    </div>
    <div class="honest">${infoIcon}<span>The amount is hidden. Your address stays visible as the payer.</span></div>
    <button class="btn primary" onclick="go('done')">Shield 0.1 SOL</button>
  `),

  done: () => `
    <div class="screen">
      <div class="top"><span class="pill">RECEIPT</span></div>
      <div class="check-big" style="margin-top:20px">${checkIcon}</div>
      <h1 style="text-align:center;font-size:24px">0.1 SOL is now private</h1>
      <p class="lede" style="text-align:center;margin:10px auto 22px">Only your keys can read the amount.</p>
      <div class="balance-card">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:10px"><span class="muted">Public left</span><span class="mono">0.0999</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px"><span class="muted">Private</span><span class="mono accent">0.1000</span></div>
      </div>
      <div class="footer" style="margin-top:auto">
        <button class="btn primary" onclick="go('dash')">Back to wallet</button>
      </div>
    </div>`,
};

/* ---------- state transitions ---------- */

function go(next) {
  S.taps += 1;
  S.screen = next;
  if (next === 'dash0') { S.pub = 0; S.priv = 0; }
  if (next === 'dash0b') { S.pub = 0; }
  if (next === 'dash1') { S.pub = 0.2; S.priv = 0; }
  if (next === 'shieldDone') { S.pub = 0.0999; S.priv = 0.1; }
  if (next === 'sendDone') { S.priv = 0.05; }
  render();
}

function jump(next) {
  S.screen = next;
  render();
}

function setFlow(flow) {
  S.flow = flow;
  S.screen = flow === 'new' ? 'start' : 'o1';
  S.taps = 0;
  S.pub = 0;
  S.priv = 0;
  document.getElementById('seg-new').className = flow === 'new' ? 'on' : '';
  document.getElementById('seg-old').className = flow === 'old' ? 'on' : '';
  render();
}

function restart() { setFlow(S.flow); }

function render() {
  const phone = document.getElementById('phone');
  const view = views[S.screen] || (() => '<div class="screen"></div>');
  phone.innerHTML = view();

  if (S.screen === 'creating') {
    S.pub = 0.2;
    setTimeout(() => { if (S.screen === 'creating') { S.screen = 'shield'; render(); } }, 1700);
  }

  document.getElementById('taps').textContent = S.taps;

  const steps = S.flow === 'new' ? NEW_STEPS : OLD_STEPS;
  const idx = steps.findIndex((s) => s.id === S.screen);

  document.getElementById('steps').innerHTML = steps
    .map((s, i) => {
      const cls = s.id === S.screen ? 'live' : i < idx ? 'done' : s.dead ? 'dead' : '';
      return '<li class="' + cls + '"><span class="n">' + (i + 1) + '</span><span>' + s.label + '</span></li>';
    })
    .join('');

  document.getElementById('note').innerHTML =
    S.flow === 'new'
      ? 'Shield, send and receipt are the same screens the current flow ends on. What changed is everything in front of them: three of six screens instead of ten of thirteen, and the funding happens inside the first tap.'
      : 'Ten of these thirteen screens exist only to reach the three the proposed flow starts on. One of them is a wall, and the faucet is behind the profile, under settings, below three rows.';

  renderCompare();
}

function renderCompare() {
  const row = (title, steps, active) => `
    <div class="cmp ${active ? '' : 'off'}">
      <div class="cmp-head"><b>${title}</b><span>${steps.length} screens</span></div>
      <div class="cmp-chips">${steps.map((s) => `<span class="chip ${s.k}">${s.tag}</span>`).join('')}</div>
    </div>`;

  document.getElementById('compare').innerHTML =
    '<h4>Every screen, both flows</h4>' +
    row('Proposed', NEW_STEPS, S.flow === 'new') +
    row('Current', OLD_STEPS, S.flow === 'old') +
    '<div class="cmp-key">' +
    '<span><i style="background:rgba(139,121,240,.7)"></i>only in proposed</span>' +
    '<span><i style="background:rgba(255,255,255,.4)"></i>same screen</span>' +
    '<span><i style="background:rgba(255,70,70,.6)"></i>dead end</span>' +
    '<span><i style="background:rgba(255,255,255,.15)"></i>removed</span>' +
    '</div>' +
    '<div class="cmp-head" style="margin-top:2px"><b>13 screens, 12 taps</b><span>to</span><b>6 screens, 2 taps</b></div>';
}

/* Deep link for screenshots and review: #new:shield, #old:err, and so on. */
const hash = decodeURIComponent(location.hash.slice(1));
if (hash) {
  const [flow, screen] = hash.split(':');
  if (flow === 'old' || flow === 'new') S.flow = flow;
  if (screen && views[screen]) S.screen = screen;
  if (S.screen === 'shield' || S.screen === 'dash1' || S.screen === 'shield1') S.pub = 0.2;
  if (S.screen === 'shieldDone') { S.pub = 0.0999; S.priv = 0.1; }
  if (S.screen === 'sendDone') { S.pub = 0.0999; S.priv = 0.05; }
  document.getElementById('seg-new').className = S.flow === 'new' ? 'on' : '';
  document.getElementById('seg-old').className = S.flow === 'old' ? 'on' : '';
}

render();
