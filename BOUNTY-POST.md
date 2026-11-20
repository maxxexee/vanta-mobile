# Vanta On-Chain Puzzle — $50 to two people

## First, what Vanta is

Vanta is a **privacy wallet for Solana**, built for the Seeker phone. It runs on devnet
(play-money SOL — nothing here is worth real money). The whole idea is simple:

> You raise money in public, then spend it in private.

Most privacy tools ask you to trust a black box. Vanta does the opposite. Every single
transaction renders a **receipt** telling you, in plain English, exactly what the payment
hid and what it *still* leaks. We publish our own weaknesses because a privacy claim you
can't check is just marketing.

That's where you come in.

## The four moves

| Move | What it does | What should be visible |
|---|---|---|
| **Shield** | Move SOL from your public wallet into the private pool | **Everything.** This is a deposit — who paid and how much are on chain, and we say so |
| **Ghost** | Pay anyone, private → public | **Recipient and amount are public.** Only the link back to you is cut |
| **Shadow** | Pay another Vanta user, private → private | **The amount, and only the amount.** The recipient's shielded signing key is published inline as a view tag, so the address decodes out of the instruction |
| **Public** | Plain transfer, included for contrast | Everything, obviously |

## Why we want on-chain analysts

Because this is exactly your sport, and we've made it easy for you.

You don't need to guess, you don't need access, and you don't need to trust our write-up.
We just put a complete, fresh, self-contained experiment on devnet — every address, every
signature, all public — and we're handing you the keys to what happened *so you can try to
deanonymise it*. Pull the transactions, follow the lamports, correlate the timing, chart
the graph. Do what you do best, for fun, on a real privacy system that's begging to be
broken.

If you find something, you get paid and we fix it. If you don't, we get to keep claiming
what we claim. Everybody wins — and it costs us $50 to find out we're right or wrong
either way.

**Prize: $50, awarded to two people ($25 each).** First valid report takes each slot.

---

# The lab: what we just put on chain

Two experiments, both run minutes ago. Block explorer link for any of them:

`https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet`

> **The Shadow recipients are withheld on purpose.** We know both addresses — we created
> them. Handing them to you would turn the hardest target in this document into a
> copy-paste. Everything you need to work them out is on chain; go get them.

## Experiment A — SOL: shield, then ghost, then shadow

Built from **brand-new identities, registered from scratch, in one run.**

**The players**

| Role | Address |
|---|---|
| Alice — depositor *and* spend identity | `HpU5N71ybktgzHgyJma73TVUo5JRsB1PoYd2eGVb62er` |
| **Shadow recipient** | **withheld — recovering it is target #2 below** |
| **Fresh public wallet** receiving the Ghost | `BhYZQj8KXDSX6qq4DFtyXHKE3sNnmNJJFmq4c25WBnkz` |
| The shielded pool | `sppU489D7A4U1exNo1oeMGZtLEofq3a6o2fR7UeoWB6` |
| The relayer (fee sponsor) | `FhV7cyfVAC8gyQqSRYiw5oKdC95GVw83ukvxhhu7uRk7` |

**The transactions, in order**

| # | What | Signature |
|---|---|---|
| 1 | Register Alice (new shielded identity) | `2D55AtYCLG4KCcm1xNtqrUt7hzyDfhN5XX1fpmMweiuuTaCybhqd8gwJD2XetUKWSkTQ3HEAHVXmUU8RbQLjsy5o` |
| 2 | Register a second fresh identity | *withheld — publishing it would name the recipient* |
| 3 | Relayer funds Alice (0.05 SOL float) | `2N7ZxM9ikBkDtkE7ZNKJrnC8mDohcsMC7LHxuyNuqH8J6Q1MpXxPwJXQvGBbAepLnpmcqSg4CKaH9aE5unyTcLgg` |
| 4 | **SHIELD** — 0.05 SOL, public → pool | `3S37YD1P7hVgNcvtLoivVpM8ouxVTbGWDJNteXrds2dnETSS7dw6azhtaCoCPgi99uR33yL8wQuHhs8CUGxm7cbK` |
| 5 | **GHOST** — 0.01 SOL, pool → fresh public wallet | `xsT3E6NM5u2hMQF8WqNbPUYBmNs65baEnctLBSCv93oPSqX5rSTzojoCmyRDrvDZVnLcitx9M2qko82cpbsyWaQ` |
| 6 | **SHADOW** — 0.01 SOL, Alice → Bob | `2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33` |

## Experiment B — dUSDC: shield, then ghost, then shadow, in a token

Same story in SPL-token form, because a token rail is where amount-hiding is easiest to
get wrong.

**The players**

| Role | Address |
|---|---|
| X — sender identity | `BtFpsMFDmZw7XbKVHmc5amcHjvCURAjTuLFe1zMikdmY` |
| **Fresh public wallet** receiving the dUSDC Ghost | `DvmPDAXmF92RJPUyWxRA7eQ1n3nDFG7BvvxDQpipGC4p` |
| **Shadow recipient's identity** | **withheld — recovering it is target #2 below** |
| dUSDC mint | `4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7` |

**The transactions, in order**

| # | What | Signature |
|---|---|---|
| 1 | 1,000 dUSDC claimed from the upstream faucet | `2zEcnxMnVUQDXaSjxuJf726Ec35kDtHABSReW66e4FPPQtVrgsh9NUriDoUBih3swBH7TqaNXKbdCpS4pqpL5YzR` |
| 2 | X's token account created | `5b7baraoM6hMrSJxBrShyTSdH1jzYuCCq9kzG9YDwjULZ9UR5KbZqmSKqDAT5qaH7wPzHofoxGQNzgFaVrmSo4Ep` |
| 3 | Register X (new shielded identity) | `4uUq6nSqPxVwG6Rs1vos1CAErEsFfxyEMJK1CcwW9angZ6y4RghMNnSt71QFYjx9CNTxtgF6YfxeToj4xo3QHK6k` |
| 4 | **SHIELD** — 10 dUSDC, public → pool | `mnazapZ58fBcKTXy9M9k3aFRn4bEhSyKPdSRFwg6DmKUwvwGJabVhJGTzCDuoyYsSPaDLJXSTJLpPYw473A4hAG` |
| 5 | **GHOST** — 1 dUSDC, pool → fresh public wallet | `5NposqgSTb25wXqaaYPSzk3qwS31MoupWJGwgsgiqViXPEsGjch92GbWFEn7CWJEGP31DQfjnoRykKxhnCq2atZf` |
| 6 | Register the Shadow recipient | *withheld — publishing it would name the recipient* |
| 7 | **SHADOW** — dUSDC, X → new identity | `3n7MUho5T4ZyetNhp5sRKdEUNhXRQ7bacqZ1YcMMNsUooEiex3i2fgnnTQKGLPMi7589BznNPALQFrjEztU5CqrR` |

---

# The prize

| | |
|---|---|
| **Amount** | **$50 total — two winners. First valid report takes each slot.** |
| **Prize-pool wallet** | `PASTE_YOUR_PRIZE_WALLET_ADDRESS` — check the balance yourself before you trust anyone |
| **Paid to** | whichever address you include in your report, within 14 days of us accepting it |
| **Payout chain** | mainnet. The payouts are real even though the puzzle is devnet. |
| **Response time** | 7 days, every submission, accepted or not |

> Replace that placeholder with the funded wallet before you post. A bounty that names
> the pot is a bounty people believe.

## Every transaction, one click

Same link shape for all of them —
`https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet`:

**SOL set**

- Register Alice — https://explorer.solana.com/tx/2D55AtYCLG4KCcm1xNtqrUt7hzyDfhN5XX1fpmMweiuuTaCybhqd8gwJD2XetUKWSkTQ3HEAHVXmUU8RbQLjsy5o?cluster=devnet
- Shield 0.05 SOL — https://explorer.solana.com/tx/3S37YD1P7hVgNcvtLoivVpM8ouxVTbGWDJNteXrds2dnETSS7dw6azhtaCoCPgi99uR33yL8wQuHhs8CUGxm7cbK?cluster=devnet
- Ghost 0.01 SOL — https://explorer.solana.com/tx/xsT3E6NM5u2hMQF8WqNbPUYBmNs65baEnctLBSCv93oPSqX5rSTzojoCmyRDrvDZVnLcitx9M2qko82cpbsyWaQ?cluster=devnet
- Shadow 0.01 SOL — https://explorer.solana.com/tx/2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33?cluster=devnet
- Relayer funds Alice — https://explorer.solana.com/tx/2N7ZxM9ikBkDtkE7ZNKJrnC8mDohcsMC7LHxuyNuqH8J6Q1MpXxPwJXQvGBbAepLnpmcqSg4CKaH9aE5unyTcLgg?cluster=devnet

**dUSDC set**

- Register X — https://explorer.solana.com/tx/4uUq6nSqPxVwG6Rs1vos1CAErEsFfxyEMJK1CcwW9angZ6y4RghMNnSt71QFYjx9CNTxtgF6YfxeToj4xo3QHK6k?cluster=devnet
- Shield 10 dUSDC — https://explorer.solana.com/tx/mnazapZ58fBcKTXy9M9k3aFRn4bEhSyKPdSRFwg6DmKUwvwGJabVhJGTzCDuoyYsSPaDLJXSTJLpPYw473A4hAG?cluster=devnet
- Ghost 1 dUSDC — https://explorer.solana.com/tx/5NposqgSTb25wXqaaYPSzk3qwS31MoupWJGwgsgiqViXPEsGjch92GbWFEn7CWJEGP31DQfjnoRykKxhnCq2atZf?cluster=devnet
- Shadow dUSDC — https://explorer.solana.com/tx/3n7MUho5T4ZyetNhp5sRKdEUNhXRQ7bacqZ1YcMMNsUooEiex3i2fgnnTQKGLPMi7589BznNPALQFrjEztU5CqrR?cluster=devnet

---

# What we already see (check our work — then beat it)

Read these three first so you know what the baseline claim is:

- **Shield #4** — depositor `HpU5N71y…` is debited −0.05 SOL straight into the pool. Yes,
  it's public. That's the deal: the deposit is visible and we say so.
- **Ghost #5** — the fresh wallet `BhYZQj8…` receives exactly +0.01 SOL, clearly visible.
  Recipient and amount are public *by design*. The only thing we claim is that nothing in
  that transaction ties back to `HpU5N71y…`.
- **Shadow #6** — no recipient account, no amount anywhere. Only a 5,000-lamport fee and
  a rent move of 701,040 lamports. We claim nobody can recover either field.

Token versions are the sharpest test:

- **dUSDC Ghost #5** — token balance deltas are right there: `DvmPDAXm…` **+1,000,000
  raw (exactly 1.000000 dUSDC)**, source −1,000,000. Public, by design.
- **dUSDC Shadow #7** — **zero token-balance entries. Pre *and* post are empty.** The
  amount does not exist anywhere in the transaction, and neither does the recipient. That
  is the claim under test.

## What we want you to do

Try to break it. Concretely, in rough order of how much we'd fear it:

1. **Link the Shield to the Ghost.** Take `HpU5N71y…` and the deposit, then walk the graph
   to the 0.01 that landed in `BhYZQj8…`. If you can connect them using *only* public
   data, that's the top prize.
2. ~~**Unmask the Shadow recipient.**~~ **Retired before posting.** It is free: from
   `2FC2WVVA…` (SOL) or `3n7MUho…` (dUSDC) the recipient's shielded signing key sits inline
   at byte 221 of the `transact` data, so the address is one base58 decode away. The claim
   this target was written from was wrong, and the README now says so. Every other target
   below stands on its own.
3. **Recover the Shadow amount.** Nothing on chain states it. Derive it from timing, from
   pool balances, from anything else — and show your working.
4. **Join two spends to one person.** Alice pays twice (Ghost #5, Shadow #6). Show that
   they're the same actor using public data alone, beyond what we already admit.
5. **Correlate on timing or amount.** Small pool, tiny amounts — if sequence and timing
   give it away, that's a real finding and we want it.

## What does NOT count

We already publish these, so finding them again isn't a win — read the README's
*"What Vanta does not hide"*:

- the Shield deposit is public and ties your wallet to a pool inflow (that's #1 above's
  starting point, not its answer)
- the spend identity pays the fee and is reused across sends — visible as `HpU5N71y…`
  on both #5 and #6
- the Ghost recipient and amount are public by design
- a small pool makes amount and timing guessable in the abstract — we need you to show it
  *on these transactions*
- the in-app fallback key sits in WebView `localStorage`, and the API key ships in the APK

Full scope, tiers, safe-harbour rules and the complete no-payout list are in
[`SECURITY-BOUNTY.md`](SECURITY-BOUNTY.md).

## How to enter

1. Take any signature above and pull it with
   `getTransaction(sig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 1 })`.
   (That last flag matters — these are v1 transactions and the RPC refuses to decode them
   without it.)
2. Follow the money. Show your graph, your query, your code — whatever you used.
3. Submit a **private** security advisory on
   [`github.com/geekman58748/vanta-mobile`](https://github.com/geekman58748/vanta-mobile)
   → *Security* → *Report a vulnerability*. Say which claim you broke, how to reproduce,
   and the signatures involved.

**Two slots, $50 total ($25 each), first valid report wins each.** We reply within 7 days.

Testing rules: **devnet only.** No mainnet, no real funds, no attacking other users, no
third-party services. 7 days for us to fix before you publish.

*Everything above is devnet play-money. Vanta is unaudited and should not hold real funds.*
