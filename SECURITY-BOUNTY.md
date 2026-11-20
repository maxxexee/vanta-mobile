# Vanta security bounty

> **Payout pool: `$[POOL]`** — set the pool and the per-tier amounts below before this is
> published. Nothing in this document is an offer until those numbers exist.

Vanta is a devnet privacy wallet. Its entire product claim is a set of statements about
what a transaction still leaks, written in one table (`src/lib/honesty.js`), rendered on
every receipt, and repeated in this repository's README. This bounty exists to make those
statements false **before** anyone else finds out that they are.

The bar is deliberately high: we are not paying for things the app already tells you it
does. We are paying for the gap between what it says and what it does.

**Report privately:** GitHub Security Advisory on
[`geekman58748/vanta-mobile`](https://github.com/geekman58748/vanta-mobile)
→ *Security* → *Report a vulnerability*, or `$[CONTACT_EMAIL]`.

---

## 1. What you are trying to break

Four claims, in the order that matters to us:

| # | Claim | Where it is made |
|---|---|---|
| **T1** | A Shadow send hides the **amount** and the **recipient** from chain data; a Ghost send severs the link between the sender and the payout | `src/lib/honesty.js`, README → *What Vanta does not hide*, the receipt table |
| **T2** | On the Mobile Wallet Adapter path the signing key never enters Vanta — custody sits in the device wallet (Seed Vault on a Seeker) | README → *Built for Seeker*, `src/lib/mwa.js` |
| **T3** | The relayer stores **no amount and no counterparty**, and history reads/writes are identity-signed, so shipping the APK does not hand over the payment graph | `relayer/schema.sql`, `relayer/server.js`, `src/lib/identityProof.js` |
| **T4** | Every receipt states, leg by leg, what was hidden and what was exposed — and cannot contradict the disclosure sheet | `src/lib/honesty.js`, `src/lib/receiptPdf.js` |

A valid finding is one where **demonstrated behaviour contradicts one of those four
statements**, with a reproduction on devnet.

---

## 2. Tiers

| Tier | Award | Meaning |
|---|---|---|
| **Critical** | `$[CRITICAL]` | T1 or T2 broken with public data or the shipped APK: a Shield can be linked to its payout, a Shadow's amount or recipient recovered, or the user's key recovered from the MWA path |
| **High** | `$[HIGH]` | T3 broken: read or write the payment graph on the relayer, file history under another identity, replay or forge a proof, or recover amount/counterparty from server-held state |
| **Medium** | `$[MEDIUM]` | T4 broken: a receipt or the disclosure sheet understates what a flow leaks, or a flow labelled `hidden`/`severed` is derivable from data the app itself can access |
| **Low** | `$[LOW]` | A real leak that does not contradict a published claim: relayer abuse beyond the documented rate limits, shell-level file or intent handling, backup forgery, cross-identity restore, WebView bridge escape |

Severity is decided by **which claim falls**, not by CVSS. A one-line proof that T1 is
false outranks a beautifully demonstrated low-severity crash.

---

## 3. In scope

**A. Linkability (T1).** Using only chain data, RPC history, the relayer's public
endpoints and this repository, do any of the following:

1. Link a Shield deposit to a subsequent Shadow or Ghost payout for the same user, beyond
   the six residuals already disclosed in the README.
2. Recover the amount or the recipient of a Shadow send.
3. Trace the spend identity across sends in a way the app claims is broken (the harness
   `scripts/forensic-x.mjs` and `scripts/linkability-report.mjs` start you off — beating
   them is the point).
4. Correlate two Vanta users through server-held state, the `.vanta` handle registry, or
   timing on the relayer's public responses.

**B. Custody (T2).** On the MWA path: extract the user's key from the app or its storage;
make Vanta sign without the wallet's consent; get the wallet's key material to cross into
the WebView; or demonstrate any path where Vanta holds what it says it never holds.
`scripts/mwa-wire-check.mjs` and `scripts/mwa-signature-extract-check.mjs` document the
wire format you would be attacking.

**C. The relayer (T3).** Endpoints: `/healthz`, `/status`, `/address`, `/relay`, `/fund`,
`/tx/:address`, `/tx/report`, `/names/*`, `/waitlist`. Specifically worth money:

- Recover `amount_atomic` or `counterparty` from anything the server stores or returns —
  the columns were dropped from the schema, so prove where they survived.
- File a history row, or read someone else's history, without a valid identity proof:
  break the domain separation, the five-minute freshness window (`PROOF_MAX_AGE_MS`), or
  the signature check in `/tx/report` and `/tx/:address`.
- Get `/relay` to co-sign anything outside the program allowlist, or `/fund` to spend
  beyond its caps.
- Confuse `verified_on_chain` in either direction (a real transaction read as unverified
  forever, or a phantom read as verified).

**D. Receipt truthfulness (T4).** Construct a transaction the receipt renders as
`hidden` or `severed` where the labelled field is derivable by an observer. This is the
tier we care about most: `src/lib/honesty.js` is a single table read by both the disclosure
sheet and the receipt, so any divergence is a bug in the product's core promise.

**E. The Android shell.** `android/app/src/main/java/com/vanta/privacywallet/` —
`MainActivity.kt` bridges (`saveBase64File` is reachable from any script in the WebView),
`WebShellViewClient.kt` URL and intent handling, `FileSaver.kt` path construction,
`BiometricGate.kt` bypass, `FLAG_SECURE` gaps. A WebView-to-native escape that yields file
write outside `Downloads/Vanta/`, an intent that opens arbitrary content, or a biometric
gate that can be skipped is in scope.

**F. Backup and identity.** `src/lib/backup.js` (scrypt + XChaCha20-Poly1305) and
`src/lib/identityProof.js`: forge or cross-restore a backup, derive the identity from
something weaker than the seed, or break the domain separation that stops one identity's
proof from being replayed as another's.

---

## 4. Out of scope — known, disclosed, and not payable

The app already says these in plain words. Reporting them is not a finding. They are
listed so you do not spend a week on them:

- **The six residuals in README → *What Vanta does not hide*** — the Shield deposit is
  public; the default ring's spend identity is the fee payer and is reused; a small pool
  makes amounts correlatable; one fresh hop is not privacy; custody is a shared program
  vault with a live upgrade authority; the device wallet is the public depositor.
- **C3** — the in-app throwaway wallet's Ed25519 key sits plaintext in WebView
  `localStorage`. Disclosed in *Known limitations* and in the app's own footer.
- **`android:allowBackup="true"`**, and recovering that key with `adb backup`.
- **The Helius API key and `VITE_RELAYER_TOKEN` are in the bundle.** Both are documented
  as public and rate-limited; the token is abuse deterrence, not authentication, which is
  precisely why history is identity-signed.
- **The documented fail-open of the relayer's program allowlist on the ring path**
  (`docs/ring-v2.md`). Exploiting it as already written is not payable; showing impact
  *beyond* what that document describes is.
- **Dependency advisories already recorded** in `audits/RESPONSE-2026-10-02.md`
  (`bigint-buffer`, `uuid`, `stream-json`).
- **Everything in `audits/AUDIT-2026-09-27.md` already marked remediated** — C1, C2, H1–H6,
  M1–M6. Re-breaking one of them *is* payable (the fix was incomplete); re-stating it is not.
- **Devnet itself**: no mainnet path, no real funds, unaudited programs, Helius's alpha
  prover and SDK, the shared program vault and its upgrade authority.
- **Availability**: DDoS, spam, rate-limit exhaustion, resource exhaustion against the
  hosted relayer or faucet.
- **Social engineering**, physical access, lost or stolen devices, supply chain, and
  anything requiring a modified OS or a rooted phone.

---

## 5. Judging

1. **First valid report wins** the tier. Duplicates are graded by advisory timestamp.
2. A report must include: which claim (T1–T4) is contradicted, exact reproduction steps,
   the code or schema location, and — for anything on-chain — the devnet transaction
   signature. `scripts/e2e-zolana.mjs` shows how the repo produces signatures; follow it.
3. Reproducibility is judged against **this repository at the commit named in the
   advisory** and the deployed devnet relayer, using the harnesses in `scripts/`.
4. Reports that only restate documented behaviour are closed with a link to the README
   section that already says it.
5. We respond within **7 days**, pay within **14 days** of acceptance, and publish a
   written acknowledgement of every accepted finding — credited or anonymous, your call.
6. Safe harbour: test against devnet and the hosted devnet relayer only, no mainnet, no
   third-party services, no access to other users' data beyond what the vulnerability
   itself exposes, and a **7-day** window for us to fix before anything is disclosed
   publicly.

---

## 6. Reproducing

```bash
git clone https://github.com/geekman58748/vanta-mobile.git
cd vanta-mobile
pnpm install
cp .env.example .env.local   # builds with an empty file; fill in to hit live services
pnpm dev                     # http://localhost:5173
pnpm lint                    # oxlint
pnpm relayer                 # :3001, needs DATABASE_URL
pnpm faucet                  # :3003, needs a funded faucet keypair
```

Harnesses that already produce evidence — extend them rather than starting over:

| Script | What it establishes |
|---|---|
| `scripts/e2e-zolana.mjs` | full shield → shadow → ghost cycle with fresh identities |
| `scripts/linkability-report.mjs` | what an observer can derive from a Shadow send |
| `scripts/forensic-x.mjs` | tracing the spend identity across sends |
| `scripts/test2-anonymity.mjs` | controlled A/B of a Shadow send, both keys held |
| `scripts/who-signs-*.mjs` | what every account key of six reference transactions exposes |
| `scripts/mwa-wire-check.mjs` | the MWA v1 wire format, both encodings, wallet bounds checks |
| `scripts/mwa-signature-extract-check.mjs` | whether a wallet's reply is usable at all |
| `scripts/backup-check.mjs`, `scripts/history-store-check.mjs` | encrypted backup round trip, history at rest |
| `scripts/ring-check.mjs` | the deployed custom ring: program bytes, config, auditor pin |

Start at `src/lib/honesty.js`. It is the list of what the app promises; the bounty is the
distance between that file and reality.
