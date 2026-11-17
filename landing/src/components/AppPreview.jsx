import { Lock } from './Marks.jsx'
import StoreBadge from './StoreBadge.jsx'
import WaitlistButton from './WaitlistButton.jsx'
import Reveal from './Reveal.jsx'
import WalletScreen from './WalletScreen.jsx'
import { GITHUB_URL } from '../config.js'

/**
 * design.md law 7: "Show the real thing. Real product UI rendered in HTML beats
 * stock illustration." The screen itself lives in WalletScreen, because the hero
 * renders the same one and two copies drift.
 */
export default function AppPreview() {
  return (
    <section id="wallet" className="relative border-t border-hairline py-24 sm:py-32">
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
          <Reveal delay={140}>
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[302px] shrink-0 rounded-[2.6rem] border border-hairline-strong bg-surface-2 p-2.5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
                <WalletScreen />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
