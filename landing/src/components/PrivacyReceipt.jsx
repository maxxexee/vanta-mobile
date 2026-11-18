import { useRef, useState } from 'react'
import { Check, Alert, EyeOff, Copy } from './Marks.jsx'
import { SHADOW, GHOST, SHIELD, USER_SENDS } from '../data/evidence.js'
import { explorerUrl } from '../config.js'
import Reveal from './Reveal.jsx'
import useOnScreen from '../hooks/useOnScreen.js'
import SectionGlow from './SectionGlow.jsx'

/* The figure and its unit are rendered apart so the redaction bar covers only
   the digits: the unit staying readable is the point, it says the amount was
   there and is gone. */
const [AMOUNT_VALUE, AMOUNT_UNIT] = SHADOW.amountMoved.split(' ')

/* Bars are relative to the largest movement on screen, floored at 6% so a fee
   of five lamports still shows a mark. Digits are stripped because the data
   uses a typographic minus (U+2212), which Number() rejects. */
const MAX_DELTA = Math.max(
  ...SHADOW.deltas.map((d) => Number(d.delta.replace(/[^\d.]/g, '')))
)
const deltaShare = (delta) =>
  Math.max(6, Math.round((Number(delta.replace(/[^\d.]/g, '')) / MAX_DELTA) * 100))

/* ------------------------------------------------------------------ *
 * The loud idea — one per page (design.md law 11).
 *
 * Stealf markets what stays private. This shows the exact split between what
 * is hidden and what leaks, on a real devnet transaction, and lets the reader
 * flip to "observer mode" to see the page from an attacker's seat.
 * Nothing here is a mock-up: every row resolves to SHADOW.signature.
 * ------------------------------------------------------------------ */

function shortSig(sig) {
  return `${sig.slice(0, 8)}…${sig.slice(-8)}`
}

function Verdict({ finding, observer }) {
  const hidden = finding.verdict === 'hidden'
  const dimmed = observer && hidden

  return (
    <div
      className={`rounded-xl p-4 transition-all duration-500 ${
        dimmed
          ? 'bg-surface/40 opacity-35 saturate-0'
          : hidden
            ? 'bg-hidden-wash'
            : 'bg-exposed-wash'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-medium tracking-[-0.01em] text-ink-strong">
          {finding.claim}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
            dimmed
              ? 'bg-surface-3 text-ink-subtle'
              : hidden
                ? 'bg-hidden/15 text-hidden'
                : 'bg-exposed/15 text-exposed'
          }`}
        >
          {dimmed ? <EyeOff size={11} /> : hidden ? <Check size={11} /> : <Alert size={11} />}
          {dimmed ? 'not visible' : hidden ? 'hidden' : 'visible'}
        </span>
      </div>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-subtle">
        {dimmed ? 'A stranger cannot read this.' : finding.detail}
      </p>
    </div>
  )
}

export default function PrivacyReceipt() {
  const [observer, setObserver] = useState(false)
  const [settling, setSettling] = useState(false)
  const receiptRef = useRef(null)
  const receiptOnScreen = useOnScreen(receiptRef)
  const [copied, setCopied] = useState(false)

  /* The class has to come off again or the animation never replays: CSS only
     restarts a keyframe run when the declaration goes from absent to present. */
  const flipObserver = (next) => {
    setObserver(next)
    setSettling(true)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHADOW.signature)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable — the explorer link still works */
    }
  }

  return (
    <section
      id="receipt"
      className="relative overflow-hidden border-t border-hairline py-20 sm:py-28"
    >
      {/* The receipt is the loud idea, so it gets the widest, lowest light on
          the page: enough to separate the card from the canvas, not enough to
          tint the text inside it. */}
      <SectionGlow className="left-1/2 top-1/3 h-[40rem] w-[54rem] -translate-x-1/2" alpha={0.11} />
      <div className="shell">
        {/* Section header — split: title left, lede right (design.md editorial rhythm) */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
                The receipt
              </p>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-4 font-display text-[clamp(2.1rem,1.4rem+2.6vw,3.5rem)] font-normal leading-[1.03] tracking-[-0.03em] text-ink-strong">
                See what your
                <br />
                transaction shows.
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={120}>
              <p className="text-[15px] leading-relaxed text-ink-subtle">
                This is a real devnet transaction. Every number below comes from the chain.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal delay={160}>
          <div
            ref={receiptRef}
            data-motion={receiptOnScreen ? undefined : 'off'}
            className="ring-card relative mt-12 overflow-hidden rounded-3xl bg-surface"
          >
            {/* The one ambient loop on the page. Paused once the receipt scrolls away. */}
            <div className="sweep" aria-hidden="true" />

            {/* ---- Receipt header ---- */}
            <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-hairline px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-accent-wash px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                  {SHADOW.kind}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-subtle">
                  {SHADOW.route}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-subtle">
                  moved
                </span>
                <span className="tnum text-[15px] font-medium text-ink-strong">
                  {SHADOW.amountMoved}
                </span>
              </div>
            </div>

            {/* ---- Body ---- */}
            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
              {/* Left: the verdicts */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
                  What it reveals
                </h3>

                {/* The section's loud moment. Same two facts as the sentence it
                    replaced, said as a picture: the amount at display size with a
                    solid bar over the digits, because a bar is literally what the
                    chain shows. The bar is canvas-coloured so it reads as missing
                    text, not as a highlight. */}
                <div className="mt-5">
                  <div className="flex items-baseline gap-2.5">
                    <span className="relative inline-block">
                      <span className="tnum font-display text-[clamp(2.75rem,1.6rem+3.2vw,4rem)] font-normal leading-[0.9] tracking-[-0.04em] text-ink-strong">
                        {AMOUNT_VALUE}
                      </span>
                      {/* Full cap height, not a strike: a bar across the middle
                          reads as a rendering fault, a solid block reads as
                          something removed. The faint ring keeps it from
                          dissolving into the page. */}
                      <span
                        aria-hidden="true"
                        className="absolute -left-2 -right-2 top-[3%] h-[94%] -rotate-[0.7deg] rounded-[3px] bg-canvas shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]"
                      />
                    </span>
                    <span className="text-[15px] text-ink-subtle">{AMOUNT_UNIT}</span>
                  </div>
                  <p className="mt-4 text-[14px] leading-relaxed text-ink">
                    Moved. Search the transaction: the number is not there.
                  </p>
                </div>

                <div
                  className={`mt-5 flex flex-col gap-3 ${settling ? 'receipt-settle' : ''}`}
                  onAnimationEnd={() => setSettling(false)}
                >
                  {SHADOW.findings.map((f) => (
                    <Verdict key={f.claim} finding={f} observer={observer} />
                  ))}
                </div>
              </div>

              {/* Right: the raw chain deltas */}
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
                  Accounts that changed
                </h3>

                <div className="mt-4 overflow-hidden rounded-xl bg-canvas ring-1 ring-hairline">
                  <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-subtle">
                      account
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-subtle">
                      Δ SOL
                    </span>
                  </div>
                  {SHADOW.deltas.map((d) => {
                    const isLeak = d.tone === 'exposed'
                    const muted = observer && !isLeak
                    return (
                      <div
                        key={d.short}
                        className={`relative flex items-center justify-between gap-4 border-b border-hairline px-4 py-3 transition-opacity duration-500 last:border-0 ${
                          muted ? 'opacity-30' : ''
                        } ${isLeak && observer ? 'bg-exposed-wash' : ''}`}
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-[12px] text-ink-strong">{d.short}</div>
                          <div className="mt-0.5 truncate text-[11px] text-ink-subtle">
                            {d.role}
                          </div>
                        </div>
                        {/* Magnitude as a bar: nine decimals of mono are exact
                            and unreadable at a glance. Placed as its own column
                            rather than as an underline, which read as a broken
                            border. Hidden on narrow screens, where the value
                            already needs the whole row. */}
                        <span
                          aria-hidden="true"
                          className="hidden h-1 w-14 shrink-0 overflow-hidden rounded-full bg-white/[0.07] sm:block"
                        >
                          <span
                            className={`block h-full rounded-full ${
                              isLeak ? 'bg-exposed' : 'bg-white/35'
                            }`}
                            style={{ width: `${deltaShare(d.delta)}%` }}
                          />
                        </span>
                        <span
                          className={`tnum shrink-0 font-mono text-[12px] ${
                            isLeak ? 'text-exposed' : 'text-ink-subtle'
                          }`}
                        >
                          {d.delta}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <p className="mt-4 text-[12.5px] leading-relaxed text-ink-subtle">
                  The two note accounts hold an encrypted claim. They are a fixed size, so the
                  amount cannot be guessed from them.
                </p>
              </div>
            </div>

            {/* ---- Observer mode + footer ---- */}
            <div className="relative border-t border-hairline bg-canvas/40 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Switch (design.md selection-control spec: 24×14 track, 10px thumb) */}
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={observer}
                    onChange={(e) => flipObserver(e.target.checked)}
                  />
                  <span className="relative inline-block h-3.5 w-6 shrink-0 rounded-full bg-hairline-strong transition-colors duration-150 peer-checked:bg-accent-strong peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                    <span
                      className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform duration-150 ${
                        observer ? 'translate-x-3' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                  <span className="text-[13px] text-ink">
                    Observer mode: {' '}
                    <span className="text-ink-subtle">see what a stranger sees</span>
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <code className="break-hash font-mono text-[11px] text-ink-subtle">
                    {shortSig(SHADOW.signature)}
                  </code>
                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex h-7 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-[11px] text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink-strong"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={explorerUrl(SHADOW.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-[11px] text-accent transition-colors hover:bg-surface-2"
                  >
                    Verify on Explorer ↗
                  </a>
                </div>
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-ink-subtle">
                What it cannot hide: you pay the fees, so anyone who knows your address can
                count and time your sends.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ---- The rest of the evidence, as plain links ---- */}
        <Reveal delay={200}>
          <div className="mt-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
              More proof
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: `${GHOST.kind}: withdraw ${GHOST.amountMoved}`, sig: GHOST.signature },
                { label: `${SHIELD.kind}: deposit ${SHIELD.amountMoved}`, sig: SHIELD.signature },
                ...USER_SENDS.map((s, i) => ({
                  label: `Live send ${i + 1}: ${s.time}`,
                  sig: s.signature,
                })),
              ].map((item) => (
                <li key={item.sig}>
                  <a
                    href={explorerUrl(item.sig)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-hairline transition-colors duration-200 hover:bg-surface-2 hover:ring-hairline-strong"
                  >
                    <span className="truncate text-[13px] text-ink">{item.label}</span>
                    <span className="shrink-0 text-ink-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
