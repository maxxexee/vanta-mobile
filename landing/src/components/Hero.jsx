import { useRef } from 'react'
import { Github, ArrowUpRight } from './Marks.jsx'
import { APP_URL, GITHUB_URL } from '../config.js'
import StoreBadge from './StoreBadge.jsx'
import Reveal from './Reveal.jsx'
import HeroPhone from './HeroPhone.jsx'
import useOnScreen from '../hooks/useOnScreen.js'
import useScrollExit from '../hooks/useScrollExit.js'
import SectionGlow from './SectionGlow.jsx'

/** How far the page scrolls while the hero is leaving. Jupiter measured 700px
 * for the same move; this hero is shorter, so the exit compresses to 560. */
const EXIT_DISTANCE_PX = 560

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
  const ref = useRef(null)
  const onScreen = useOnScreen(ref)
  useScrollExit(ref, EXIT_DISTANCE_PX)

  return (
    <section
      id="top"
      ref={ref}
      data-motion={onScreen ? undefined : 'off'}
      className="hero-seq relative overflow-hidden pb-16 pt-32 sm:pt-36 sm:pb-20"
    >
      {/* One medium only: accent falloff behind the device, well below the copy. */}
      <SectionGlow
        className="left-1/2 top-[-18rem] h-[44rem] w-[56rem] -translate-x-1/2"
        alpha={0.2}
      />
      <div
        aria-hidden="true"
        className="rails pointer-events-none absolute inset-0 mx-auto max-w-[1280px]"
      />

      <div className="shell relative">
        <div className="hero-copy mx-auto flex max-w-3xl flex-col items-center text-center">
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
          <Reveal delay={60}>
            <h1 className="mt-7 font-display text-[clamp(2.9rem,1.5rem+4.6vw,5.25rem)] font-normal leading-[0.96] tracking-[-0.035em] text-ink-strong">
              Privacy that
              <br />
              <span className="text-ink-subtle">shows its work.</span>
            </h1>
          </Reveal>

          {/* One sentence. The detail lives in the sections below, and the
              receipt section shows the thing this sentence promises. */}
          <Reveal delay={120}>
            <p className="measure mt-6 text-[17px] leading-[1.6] text-ink sm:text-[19px]">
              A private wallet for your phone. Amounts stay hidden, and every send
              leaves you a receipt.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
              <StoreBadge size="lg" className="w-full max-w-[260px] justify-center sm:w-auto" />
              {/* The web app, in the quiet chrome the page already uses for a
                  second action (see WaitlistButton.jsx: accent is spent on the
                  mark and key data, never on a slab beside the store badge).
                  Same 64px height as the badge, and the same width when the row
                  stacks on a phone, so the column has one edge.
                  Served from this origin by `npm run build:site` (APP_URL). */}
              <a
                href={APP_URL}
                className="group inline-flex h-16 w-full max-w-[260px] items-center justify-center gap-2 rounded-xl border border-hairline bg-canvas px-5 text-[15px] font-medium text-ink-strong transition-colors duration-200 hover:border-hairline-strong hover:bg-surface-2 active:scale-[0.98] sm:w-auto"
              >
                Open the app
                <span className="text-accent transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight size={13} />
                </span>
              </a>
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

        {/* The product, moving. Everything above is setup for this. Centred,
            because the offset it used to carry existed to make room for the two
            state cards, which now live beside the wallet section's device. */}
        <Reveal delay={260} className="hero-device">
          <div className="hero-lift relative mx-auto mt-14 w-full max-w-[340px] sm:mt-16">
            {/* Light the device throws on the floor. Without it the phone floats. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-6 bottom-[-2.5rem] h-16 rounded-[50%] bg-accent-strong opacity-25 blur-2xl"
            />
            <HeroPhone />
          </div>
        </Reveal>

        {/* The honest caveats, one line, still above the fold on a laptop. */}
        <Reveal delay={320}>
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
