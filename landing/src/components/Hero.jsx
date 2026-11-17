import { Github, ArrowUpRight } from './Marks.jsx'
import { GITHUB_URL } from '../config.js'
import StoreBadge from './StoreBadge.jsx'
import Reveal from './Reveal.jsx'
import HeroPhone from './HeroPhone.jsx'

/**
 * The hero was four paragraphs and three warning cells above the fold. It is now
 * a headline, one sentence, one action, and the product doing its thing.
 *
 * The caveats did not disappear, they moved down to a single line of small
 * print. Devnet only, not audited, sender public: still the first screen, still
 * before anyone downloads anything, but no longer competing with the one idea
 * a stranger is going to remember.
 */
export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-32 sm:pt-36 sm:pb-20">
      {/* One medium only: accent falloff behind the device, well below the copy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-18rem] h-[44rem] w-[54rem] -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl"
        style={{
          background: 'radial-gradient(closest-side, var(--color-accent-strong), transparent 78%)',
        }}
      />
      <div
        aria-hidden="true"
        className="rails pointer-events-none absolute inset-0 mx-auto max-w-[1280px]"
      />

      <div className="shell relative">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal>
            <span className="inline-flex h-8 items-center gap-2.5 rounded-lg border border-hairline bg-surface/60 px-3">
              <span className="pulse-dot" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle">
                Live on devnet
              </span>
            </span>
          </Reveal>

          {/* Two-tone display line. Accent stays out of it on purpose: it belongs
              to the brand mark and the primary action. */}
          <Reveal delay={70}>
            <h1 className="mt-7 font-display text-[clamp(2.9rem,1.5rem+4.6vw,5.25rem)] font-normal leading-[0.96] tracking-[-0.035em] text-ink-strong">
              Privacy that
              <br />
              <span className="text-ink-subtle">shows its work.</span>
            </h1>
          </Reveal>

          {/* One sentence. The detail lives in the sections below, and the
              receipt section shows the thing this sentence promises. */}
          <Reveal delay={140}>
            <p className="measure mt-6 text-[17px] leading-[1.6] text-ink sm:text-[19px]">
              A private wallet for your phone. Amounts stay hidden, and every send
              leaves you a receipt.
            </p>
          </Reveal>

          <Reveal delay={210}>
            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
              <StoreBadge size="lg" />
              <a
                href="#receipt"
                className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-ink transition-colors hover:text-ink-strong"
              >
                See a real receipt
                <span className="text-ink-subtle transition-transform duration-200 group-hover:translate-y-0.5">
                  ↓
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {/* The product, moving. Everything above is setup for this. */}
        <Reveal delay={280}>
          <div className="mt-14 flex justify-center sm:mt-16">
            <HeroPhone />
          </div>
        </Reveal>

        {/* The honest caveats, one line, still above the fold on a laptop. */}
        <Reveal delay={340}>
          <p className="mt-10 text-center text-[12px] text-ink-subtle">
            Devnet only. Not audited. Do not use real money. The sender is public.{' '}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-ink-subtle underline-offset-4 transition-colors hover:text-ink-strong hover:underline"
            >
              <Github size={12} />
              Source
              <ArrowUpRight size={9} />
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
