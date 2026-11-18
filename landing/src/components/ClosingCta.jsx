import StoreBadge from './StoreBadge.jsx'
import WaitlistButton from './WaitlistButton.jsx'
import WalletScreen from './WalletScreen.jsx'
import Reveal from './Reveal.jsx'
import SectionGlow from './SectionGlow.jsx'

/**
 * The close.
 *
 * By this point every argument has been made, so the page stops arguing: one
 * panel, one action, and the product half in frame. The earlier version ended on
 * a contracts table and then a wordmark, which is a fine ending for a document
 * and a poor one for a product.
 *
 * The device is the same component the hero and the wallet section render, so
 * the last thing on the page is the same product as the first.
 */
export default function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-hairline py-20 sm:py-28">
      <SectionGlow className="left-1/2 top-[-4rem] h-[36rem] w-[54rem] -translate-x-1/2" alpha={0.16} />

      <div className="shell">
        <Reveal>
          <div className="closing-panel relative overflow-hidden rounded-[32px] border border-white/10 px-6 py-14 sm:px-12 sm:py-16 lg:py-20">
            <div className="relative z-10 max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
                Get the build
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.1rem,1.3rem+2.8vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.03em] text-ink-strong">
                Private amounts,
                <br />
                <span className="text-ink-subtle">from your phone.</span>
              </h2>
              <p className="measure mt-5 text-[16px] leading-relaxed text-ink">
                The devnet build is next. Join the waitlist and you will have it the day it
                installs.
              </p>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                <StoreBadge size="lg" />
                <WaitlistButton />
              </div>

              <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-subtle">
                Devnet only · not audited · do not use real money
              </p>
            </div>

            {/* Cropped by the panel on purpose: half a phone reads as "there is
                more of this" where a whole one reads as a screenshot. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-52 right-6 hidden w-[302px] rotate-[-2deg] lg:block xl:right-14"
            >
              <div className="rounded-[2.6rem] border border-hairline-strong bg-surface-2 p-2.5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.95)]">
                <div className="overflow-hidden rounded-[2.1rem]">
                  <WalletScreen />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
