# Vanta bounty — social-ready text

Two formats: an **X thread** (each post ≤ 280 chars, verified by script) and a **Discord**
version (no tables — sigs in code blocks).

Prize wording used throughout: **$50, two winners ($25 each)** — change it in both places
if you meant $50 each.

---

## The tweet (X, one post, plain English, ready to send)

Explorer is **Orb Markets** (`orbmarkets.io`) — a Solana block explorer like Solscan.
Append `?cluster=devnet` or it shows mainnet and finds nothing.

--- tweet ---
we sent 0.01 SOL from a privacy wallet on solana devnet.

this one landed in a brand new wallet — open it and watch the money arrive:
https://orbmarkets.io/tx/xsT3E6NM5u2hMQF8WqNbPUYBmNs65baEnctLBSCv93oPSqX5rSTzojoCmyRDrvDZVnLcitx9M2qko82cpbsyWaQ?cluster=devnet

this one hid who got paid AND how much:
https://orbmarkets.io/tx/2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33?cluster=devnet

find both. $50, two winners → github.com/geekman58748/vanta-mobile

Both links resolve to the real transactions: the first is the **GHOST** (recipient and
amount public by design), the second is the **SHADOW** (neither on chain — that's the
prize). No addresses, no answers, nothing to supervise.

Alternates below — same links, different hooks.

--- single alt 1 ---
Vanta is a privacy wallet for Solana that shows you what every payment still leaks. We just put fresh payments on devnet. Find who got the hidden one — $50 to two people who crack it. Anyone can try: github.com/geekman58748/vanta-mobile

watch it: https://orbmarkets.io/tx/2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33?cluster=devnet
--- single alt 2 ---
your wallet probably leaks more than you think. ours prints a receipt saying what it hid AND what it didn't. we just sent real payments on devnet — the amount is what is hidden now. recover one, get $50. two winners: github.com/geekman58748/vanta-mobile

watch it: https://orbmarkets.io/tx/2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33?cluster=devnet
--- single alt 3 ---
same wallet, two payments. one you can see who got paid. one you can't. both are sitting on devnet right now. tell us how you'd unhide the second one — $50, two winners: github.com/geekman58748/vanta-mobile

the hidden one: https://orbmarkets.io/tx/2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33?cluster=devnet
--- single alt 4 ---
we built a privacy wallet that doesn't ask you to trust it — it shows you what every payment leaks. fresh payments are on devnet now. unmask the hidden one and take $50, two winners: github.com/geekman58748/vanta-mobile

watch it: https://orbmarkets.io/tx/2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33?cluster=devnet

---

## X thread

--- post 1 ---
Vanta is a privacy wallet for Solana that prints a receipt telling you what every payment still leaks.

We just put a fresh experiment on devnet. $50 to two people who can break it. 🧵
--- post 2 ---
What it does:

• Shield — public → private pool (deposit is public, we say so)
• Ghost — pay anyone, link cut, amount + recipient public
• Shadow — pay a Vanta user, amount hidden (the recipient is published as a view tag)
• Public — plain transfer

Every send prints a receipt: what it hid, what it didn't.
--- post 3 ---
The lab — brand new identities, registered from scratch, one run.

SHIELD 0.05 SOL
3S37YD1P7hVgNcvtLoivVpM8ouxVTbGWDJNteXrds2dnETSS7dw6azhtaCoCPgi99uR33yL8wQuHhs8CUGxm7cbK

https://explorer.solana.com/tx/3S37YD1P7hVgNcvtLoivVpM8ouxVTbGWDJNteXrds2dnETSS7dw6azhtaCoCPgi99uR33yL8wQuHhs8CUGxm7cbK?cluster=devnet
--- post 4 ---
GHOST 0.01 SOL → a brand new public wallet
xsT3E6NM5u2hMQF8WqNbPUYBmNs65baEnctLBSCv93oPSqX5rSTzojoCmyRDrvDZVnLcitx9M2qko82cpbsyWaQ

You can watch the recipient get paid. That's by design. What you shouldn't be able to do is tie it back to the shield.
--- post 5 ---
SHADOW 0.01 SOL
2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33

No recipient. No amount. Only a 5,000-lamport fee. That's the claim.
--- post 6 ---
Same app, token rails:

dUSDC GHOST — token balances show +1,000,000 raw (exactly 1 USDC) to the recipient. Public, by design.
dUSDC SHADOW — zero token balance entries. Pre AND post empty. The amount isn't in the transaction at all.

Full sig list in the repo.
--- post 7 ---
What to try:

1. Link the shield to the ghost payout, public data only
2. Recover the shadow recipient
3. Recover the shadow amount
4. Prove two spends are one person
5. Beat us on timing / amount correlation

Shadow recipients withheld — publishing them would give #2 away.
--- post 8 ---
Entry: private security advisory on github.com/geekman58748/vanta-mobile → Security → Report a vulnerability.

$50, two slots, first valid report wins each. Devnet only, no real funds, no attacking others. 7 days for us to fix before you publish.

Scope: SECURITY-BOUNTY.md
---

## Discord

**Message 1**

**Vanta security bounty — $50 to two people** 🧵

Vanta is a privacy wallet for Solana. Every send prints a receipt saying what the payment hid *and* what it still leaks — because a privacy claim you can't check is just marketing.

Four moves:
• **Shield** — public → private pool. The deposit is public. We say so.
• **Ghost** — pay anyone, link to you cut, amount + recipient public.
• **Shadow** — pay a Vanta user, amount hidden. The recipient is published as a view tag;
the receipt says so.
• **Public** — plain transfer, included for contrast.

We just ran a fresh, self-contained experiment on devnet and we're handing you every address and signature. Pull the transactions, follow the lamports, try to deanonymise it. If you break it, you get paid and we fix it. If you don't, we get to keep claiming what we claim.

**Message 2**

**The lab** — new identities, registered from scratch, one run.
Explorer: `https://explorer.solana.com/tx/<SIG>?cluster=devnet`

SOL set:
```
register Alice   2D55AtYCLG4KCcm1xNtqrUt7hzyDfhN5XX1fpmMweiuuTaCybhqd8gwJD2XetUKWSkTQ3HEAHVXmUU8RbQLjsy5o
register 2nd id  withheld — decoding it would hand you the Shadow recipient
SHIELD 0.05 SOL  3S37YD1P7hVgNcvtLoivVpM8ouxVTbGWDJNteXrds2dnETSS7dw6azhtaCoCPgi99uR33yL8wQuHhs8CUGxm7cbK
GHOST  0.01 SOL  xsT3E6NM5u2hMQF8WqNbPUYBmNs65baEnctLBSCv93oPSqX5rSTzojoCmyRDrvDZVnLcitx9M2qko82cpbsyWaQ
SHADOW 0.01 SOL  2FC2WVVAH1mb8EpXK7QqqgRNASTSkEKFsDYaSy4Kw2HxBZ5LUDHNTn4j1bx4SawEbuuZg87ADvHgbfq8e6qQAN33
```
Players: depositor/spend identity `HpU5N71ybktgzHgyJma73TVUo5JRsB1PoYd2eGVb62er` · **shadow recipient withheld** · fresh ghost wallet `BhYZQj8KXDSX6qq4DFtyXHKE3sNnmNJJFmq4c25WBnkz` · pool `sppU489D7A4U1exNo1oeMGZtLEofq3a6o2fR7UeoWB6`

**Message 3**

Token rails (dUSDC, mint `4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7`):
```
SHIELD 10 dUSDC  mnazapZ58fBcKTXy9M9k3aFRn4bEhSyKPdSRFwg6DmKUwvwGJabVhJGTzCDuoyYsSPaDLJXSTJLpPYw473A4hAG
GHOST  1  dUSDC  5NposqgSTb25wXqaaYPSzk3qwS31MoupWJGwgsgiqViXPEsGjch92GbWFEn7CWJEGP31DQfjnoRykKxhnCq2atZf
SHADOW (amt?)    3n7MUho5T4ZyetNhp5sRKdEUNhXRQ7bacqZ1YcMMNsUooEiex3i2fgnnTQKGLPMi7589BznNPALQFrjEztU5CqrR
```
The whole puzzle is visible in two transactions:
• **Ghost** — token balances show `DvmPDAXm…` **+1,000,000 raw = exactly 1.000000 dUSDC**. Recipient and amount, right there. Public by design.
• **Shadow** — **zero token balance entries, pre and post both empty.** No recipient, no amount, only a 5,000-lamport fee. That's the claim under test.

**Message 4**

**What to attack**
1. Link the shield deposit to the ghost payout — public data only. Top prize.
2. Recover the shadow recipient from `2FC2WVVA…` (SOL) or `3n7MUho…` (dUSDC).
3. Recover the shadow amount — it's stated nowhere on chain.
4. Prove the two spends (ghost + shadow) are the same actor, beyond what we admit.
5. Beat us on timing / amount correlation.

**Doesn't count** (already published in the README's *What Vanta does not hide*): the deposit is public, the spend identity pays fees and is reused, ghost recipient/amount are public by design, small pool = guessable timing, the fallback key sits in `localStorage`, the API key ships in the APK.

**Enter** → private security advisory on `github.com/geekman58748/vanta-mobile` → Security → Report a vulnerability. Include which claim you broke, how to reproduce, and the signatures.

$50, two slots, first valid report wins each. Devnet only, no real funds, no attacking others, no third parties. 7 days for us to fix before you publish. Full rules in `SECURITY-BOUNTY.md`.
