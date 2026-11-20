import { useRef } from 'react'
import { Lock } from './Marks.jsx'
import StoreBadge from './StoreBadge.jsx'
import WaitlistButton from './WaitlistButton.jsx'
import Reveal from './Reveal.jsx'
import WalletScreen from './WalletScreen.jsx'
import useOnScreen from '../hooks/useOnScreen.js'
import SectionGlow from './SectionGlow.jsx'
import { GITHUB_URL } from '../config.js'

/**
 * design.md law 7: "Show the real thing. Real product UI rendered in HTML beats
 * stock illustration." The screen itself lives in WalletScreen, because the hero
 * renders the same one and two copies drift.
 */
export default function AppPreview() {
  const phoneRef = useRef(null)
  const phoneOnScreen = useOnScreen(phoneRef)

  return (
    <section id="wallet" className="tone-lift relative overflow-hidden border-t border-hairline py-20 sm:py-28">
      {/* Light sits under the device rather than the copy: the phone is the
          subject of this section, the text is the caption. */}
      <SectionGlow
        className="right-[-8rem] top-1/4 h-[36rem] w-[40rem] lg:right-[6%]"
        alpha={0.15}
      />
      <div className="shell">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* ---- Copy ---- */}
          <div>
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
                The wallet
              </p>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-4 font-display text-[clamp(2rem,1.4rem+2.2vw,3rem)] font-normal leading-[1.05] tracking-[-0.03em] text-ink-strong">
                Know what every
                <br />
                send does.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="measure mt-5 text-[16px] leading-relaxed text-ink-subtle">
                One private balance. Three ways to move it. A receipt for every send.
              </p>
            </Reveal>

            <Reveal delay={170}>
              <ul className="mt-8 flex flex-col gap-3">
                {[
                  'Your keys stay on your phone',
                  'We pay the fees, never touch the amount',
                  'Every send leaves a receipt',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3 text-[14px] text-ink">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-wash text-accent">
                      <Lock size={11} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={220}>
              <div className="mt-9 flex flex-col items-start gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* The waitlist is the primary action here on purpose: this is
                      the section that shows the product, so it is where the
                      intent to try it actually forms. The store badge sits next
                      to it for the people who want the APK the moment it exists. */}
                  <WaitlistButton size="lg" />
                  <StoreBadge size="lg" />
                </div>
                <p className="text-[12px] text-ink-subtle">
                  No APK yet. Until then,{' '}
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    build it from source
                  </a>
                  .
                </p>
              </div>
            </Reveal>
          </div>

          {/* ---- Phone ---- */}
          {/* min-w-0 on the grid item, not just the frame: a grid item keeps
              min-width:auto otherwise and lets the mockup's 300px min-content
              widen the column past the shell at 320px. */}
          <Reveal delay={140} className="min-w-0">
            <div className="relative mx-auto w-full max-w-[302px]">
              {/* 302px is the design width. Below a 340px viewport the mockup's own
                  min-content width (300px) beat `w-full`, so the frame hung 2px
                  past the shell and the section clipped its bezel. min-w-0 lets the
                  frame compress and the decorative screen reflow inside it. */}
              <div
                ref={phoneRef}
                data-motion={phoneOnScreen ? undefined : 'off'}
                className="relative w-full min-w-0 rounded-[2.6rem] border border-hairline-strong bg-surface-2 p-2.5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]"
              >
                <WalletScreen />
              </div>

              {/* Two cards carry real app state (amount hidden, recipient public)
                  and drift beside the device, so the section's argument is on
                  screen in two words each. They sit on opposite sides because the
                  split is the claim: the hidden half stays with the phone and its
                  keys, the public half is out past the bezel where anyone could
                  read it. Measured in the browser at 1280, 1440 and 1600: the left
                  card is held by the copy-to-device gap, the right card sits 168px
                  past the bezel with 173px of room there (125px of column slack
                  plus the shell padding), so it ends 4px inside the viewport at
                  1280 and 84px inside at 1440. Both overlap the frame by about
                  17px, which is the bezel, not the screen. The right card is still
                  gated on xl because that 4px is all the room there is below it. */}
              <div
                aria-hidden="true"
                className="absolute left-[-12rem] top-[9%] hidden w-[12.5rem] -rotate-2 xl:block"
              >
                <div className="float-card rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/50">
                      Shield
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-hidden">
                      <span className="h-1 w-1 rounded-full bg-hidden" />
                      hidden
                    </span>
                  </div>
                  {/* Not the balance: the phone beside this card already shows
                      0.300 SOL, and repeating it in a floating duplicate reads as
                      an error rather than as an annotation. */}
                  <p className="mt-3 font-display text-[24px] leading-none tracking-[-0.03em] text-ink-strong">
                    Not on chain
                  </p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                    no amount in the send
                  </p>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="absolute right-[-10.5rem] top-[58%] hidden w-[11.5rem] -rotate-[1.5deg] xl:block"
              >
                <div className="float-card float-card--slow rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/50">
                      Recipient
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-exposed">
                      <span className="h-1 w-1 rounded-full bg-exposed" />
                      public
                    </span>
                  </div>
                  <p className="mt-3 font-mono text-[12px] leading-none text-ink">vanta:7f3a…c19</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                    visible to anyone
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
