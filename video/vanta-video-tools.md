# Vanta video tools — everything needed to build the custom ring v2 walkthrough

> **Audience for this file:** an agent or editor building the announcement video with
> zero context. Read top to bottom. Every number here is real and re-verifiable on
> devnet; nothing is illustrative. The previous launch assets (`src/RingLaunch.tsx`,
> `out/ring-v2-film.mp4`) used a heavy VHS look — **the new direction is a walkthrough**:
> easy, fast, smooth, one idea per scene. Do not copy the tape effects.

---

## 1. Vanta in 30 seconds

**Vanta** is a devnet privacy wallet for Android (Solana Mobile stack). You raise in
public and spend in private. It has four send modes — Shield (public deposit into a
shielded pool), Shadow (private send to a Vanta user), Ghost (private send to any
Solana address), Public (plain transfer). Every send renders a receipt saying what was
hidden and what still leaks. That honesty is the brand: **confidential, never
"anonymous".**

- Product: `https://vanta-mobile.xyz` · APK at `/download/vanta.apk`
- Repo: `https://github.com/geekman58748/vanta-mobile`
- The cryptography (pools, circuits, prover) is **Helius Zolana**; Vanta is the client
  plus the relayer infrastructure.

## 2. What the upgrade (custom ring v2) actually is

V1 spends on Helius's **default ring**. Its rule: *the note owner must sign AND pay the
fee.* So every private spend leaves your address on chain as the fee payer — visible,
reused, countable by anyone you've paid. (This was literally residual #2 in the
project's honesty table.)

Vanta now operates its **own custom ring** (program
`8aMW8MPHBn4oGsss2NuB4QNvFx6iBSB8RHHkMAHrZduU`, devnet). Under this ring's rules the
**relayer pays the fee and the owner co-signs beside it**. Result:

- The fee payer is a **shared service address**, not you.
- **No reusable per-user spend identity** is left on chain.
- **You never need SOL** to spend privately.
- The amount stays hidden, as before. The recipient does not: it is published as a view tag, so this is not recipient privacy.

The infrastructure story ("our sponsor handles everything"): the app sends the
prepared spend to Vanta's **relayer** (`/relay` endpoint); the relayer validates it,
co-signs as fee payer, and broadcasts. One-time-use ring addresses + a shared relayer
address replace the old single visible identity. Status: **shipped, devnet, test
phase** — off by default behind `VITE_RING_PROGRAM_ID`, unaudited, single-key
authority.

### The claim wording that is SAFE vs WALK-BACK

| Safe to say | Do NOT say |
|---|---|
| "your spend never pays the fee again" | "your wallet never signs" — **wrong**: the owner still *co-signs*. The point is it never *pays* and leaves no reusable identity |
| "no reusable spend identity on chain" | "anonymous" / "untraceable" |
| "test phase on devnet" | anything mainnet / audited / production |
| "confidential, not anonymous" | — (this phrase must appear, small print is fine) |

One honest footnote if there's room: the ring's auditor key *can* open a transfer —
that's how ring programs work; the receipts say so.

---

## 3. The message (friend's brief, cleaned up)

> **Vanta just got a new upgrade.** Your private spend identity never pays for a
> transaction again — **our custom rings do.** Send your transaction to our sponsor;
> it signs as the fee payer and handles everything needed to keep your wallet stealth.
> One more step closer to privacy. **Vanta.**

---

## 4. Storyboard — 5 scenes, ~22s, walkthrough

One idea per scene. Big legible type, real numbers, phone/UI mock where it helps.
Smooth everything; no glitch, no grain, no scanlines.

| # | Sec | Voiceover / on-screen copy | Visual |
|---|---|---|---|
| 1 | 0–3 | "Vanta just got an upgrade." | Logo resolves in; small chip: `CUSTOM RING v2 · DEVNET` |
| 2 | 3–8 | "Your private spend never pays the fee again." | Before/after decode: OLD row animates `fee payer: YOU (141cNkh4…)` struck through → NEW row `fee payer: RELAYER (FhV7cyfV…)` |
| 3 | 8–14 | "Send it to our sponsor. It signs and handles the rest." | 3-step flow, gentle arrows: `You tap send` → `Relayer co-signs + pays` → `Ring note lands · err null`. Phone frame with the real app send screen if using screenshots |
| 4 | 14–18 | "One more step closer to privacy." + three ticks | `no reusable identity` ✓ `no SOL needed` ✓ `amount hidden` ✓ `recipient published` ⚠ · small print: devnet · test phase · confidential, not anonymous |
| 5 | 18–22 | "Vanta." | Logo + `vanta-mobile.xyz` |

## 5. Motion direction (this is the "easy, fast, smooth" part)

- **Transitions:** 300–500 ms ease-in-out cubic crossfades or 24 px slides. One idea
  per scene. Nothing bounces, nothing tears.
- **Type:** animate opacity + small translate only. Stagger lines 80–120 ms.
- **The one hero moment** (scene 2): the strike-through swap — "YOU" fades to red and
  gets struck; "RELAYER" slides in green. That single swap IS the announcement.
- **Speed:** brisk. Every scene readable at muted autoplay; if a caption is needed to
  understand it, the scene is too busy.
- **Palette / type (copy from the product, don't invent):** canvas `#0a0a0c`, surface
  `#141417`, ink `#ffffff`, muted `#8e8e93`, accent violet `#8b79f0`, danger `#ec6a7a`,
  success green `#5fd68a`. Display **Space Grotesk**, body **Inter**, mono **Space
  Mono** — all already in `video/public/fonts/` (self-hosted; renders stay offline).
- **Phone mock / app screens:** real screenshots exist in `screenshots/`
  (`08-send.png`, `12-ghost-send.png`, `05-wallet-dashboard.png`, `06-what-leaks-sheet.png`).
- **Audio:** none licensed in repo. Either silent+legible or `@remotion/sfx`
  (zero-asset whoosh/ding) for scene cuts.

## 6. The real evidence (put these on screen or in the pinned reply)

All decoded live from devnet 2026-10-21 with `getTransaction`
(`maxSupportedTransactionVersion: 1`). Explorer links: append `?cluster=devnet` to
`https://explorer.solana.com/tx/<SIG>`.

```json
{
  "v1_default_ring_shadow": {
    "sig": "4xDGsYYXPhDWmGkXn1qPoe3uKhc1hgxG38VUoLFKzHQ4SovMpA4XbnULrU3wA4RV94irTY8Dn77T7RZ6bgChEJVY",
    "slot": 506148898,
    "feePayer": "141cNkh4Z9XQ3nBBW2YX3L3o9XqoRQXEaU4jxdfD4HrE",
    "signers": 1,
    "feeLamports": 5000,
    "err": null,
    "note": "the OLD story: the owner's own address paid and was the only signer"
  },
  "v2_ring_shadow_from_apk": {
    "sig": "4ucu98jHyDyCg8nnrgD8L5znTpj5cBacWgg7t5TTtnoU5DWHbSsJGeJPvpMAhPgq1rBBxnySaRVfkPWpjQPtgpap",
    "slot": 512979955,
    "feePayer": "FhV7cyfVAC8gyQqSRYiw5oKdC95GVw83ukvxhhu7uRk7",
    "coSigner": "2QnVHxmVNQ5LEYzKV8RzQcrxfQRf675J9DbJoJb4k2p4",
    "signers": 2,
    "feeLamports": 10000,
    "err": null,
    "note": "NEW story: relayer pays, owner co-signs. Sent from the APK on an emulator"
  },
  "v2_ring_ghost_from_apk": {
    "sig": "4aiLF66uQzYZbVtFBEi6rHvEcr2dSmDKqpEF631FTQcnaX13BL5M8HqazYH69DRBYvN8CoCb77cjATDrMuVxYajQ",
    "slot": 512980998,
    "feePayer": "FhV7cyfVAC8gyQqSRYiw5oKdC95GVw83ukvxhhu7uRk7",
    "coSigner": "2QnVHxmVNQ5LEYzKV8RzQcrxfQRf675J9DbJoJb4k2p4",
    "err": null
  },
  "ring_deposit_from_app": {
    "sig": "4hnT78rV579tHQ3urepQbEpuX2jK5LK1nhTVxdp4vHMmcEFzN3zqiPciAhmBve1mFgM871ePSdXRveHoMpBnPDAC"
  },
  "relayer_funded_the_float": {
    "sig": "5JRuNLiKyvtxrpyckd6hgScnHG7D9QErimuu3QCwtyJs3Ma34seo6Yu6Hu8RifGuC8JcuLVasnPt21Y8rfewPwxA",
    "note": "relayer -> X. The 'our infrastructure funds what it needs' scene, if used"
  },
  "register_handle_relayer_pays": {
    "sig": "3wsHVkmGK3NNZt4TbLEJ7nopHkHXffSiXhc4tbU9H7dThf2qe3FXusDXqAv8xHPpUuWypr6zqfvq5K382BueqbqF"
  }
}
```

**Addresses**

| Role | Address |
|---|---|
| Custom ring program (v2) | `8aMW8MPHBn4oGsss2NuB4QNvFx6iBSB8RHHkMAHrZduU` |
| v1 default pool | `sppU489D7A4U1exNo1oeMGZtLEofq3a6o2fR7UeoWB6` |
| Relayer (v2 fee payer) | `FhV7cyfVAC8gyQqSRYiw5oKdC95GVw83ukvxhhu7uRk7` |
| v1 spend identity X (the old fee payer) | `141cNkh4Z9XQ3nBBW2YX3L3o9XqoRQXEaU4jxdfD4HrE` |
| v2 owner co-signer | `2QnVHxmVNQ5LEYzKV8RzQcrxfQRf675J9DbJoJb4k2p4` |
| Relayer service | `https://p01--vanta-mobile--9ymc8tqmdxvj.code.run` |

**Re-verify any of it:** `node scripts/who-signs-check.mjs` /
`who-signs-decode.mjs` (needs `.env.local` with `VITE_HELIUS_API_KEY`), or
`npm run ring:check -- 8aMW8MPHBn4oGsss2NuB4QNvFx6iBSB8RHHkMAHrZduU`.

## 7. Tech: where to build it

The repo already renders video **from code** — a Remotion project at `video/`
(React components → MP4 via headless Chrome; no After Effects, no binary project
files, re-renderable forever).

```bash
cd video
npm install            # first time
npm run studio         # live preview, edit + scrub
npx remotion render <CompositionId> out/<name>.mp4 --codec h264 --crf 18 --color-space bt709
npx remotion still <CompositionId> out/<name>.png   # for the 1600×900 tweet card
```

- Palette/type helpers: `src/vhs.tsx` exports `C`, `DISPLAY`, `MONO`, `SANS` — reuse
  those constants; **skip** `Scanlines`/`Grain`/`TapeTear`/`Chroma` for this piece.
- Registered compositions live in `src/Root.tsx`. The walkthrough should be a **new**
  composition (e.g. `RingWalkthrough`, 1920×1080 @30fps, ~660 frames for 22s).
- The old attempt is `src/RingLaunch.tsx` (`RingCard`, `RingFilm`) — reference for the
  data constants, not for the look.
- Fonts must load before frame 0: Root.tsx already has the `delayRender` font-face
  loader; keep it.
- Tweet specs: video 16:9 MP4 ≤ 512 MB (22 s is nothing); card image 1600×900.
