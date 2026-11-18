import { EyeOff, Alert } from './Marks.jsx'
import Reveal from './Reveal.jsx'

/**
 * Stealf's equivalent section is a two-card split. Vanta has three real flows
 * and — unlike a two-card story — each one discloses its own visibility.
 * That per-flow disclosure is the differentiator, not decoration.
 *
 * Card anatomy follows jup.ag/mobile's Earn cards, studied rather than copied:
 * a 344x430 card with a 32px radius, one organic gradient behind it and a stack
 * of translucent pills over it. Their gradient turns out to be a single SVG
 * radial gradient with a transform matrix, not an image, and their pills are
 * white at 10% with 18px radius. That is a cheap recipe, so this uses it with
 * our own ramp: violet for Shield, deeper violet for the flagship, steel for
 * Ghost. Their "6.05% APY" pill becomes our visibility row, which is the same
 * shape of fact: a label on the left, a value on the right.
 */
const FLOWS = [
  {
    id: 'shield',
    name: 'Shield',
    route: 'Public → private',
    flagship: false,
    body: 'Move SOL into the private pool. The deposit itself is public. After that, nothing is.',
    gradient:
      'radial-gradient(130% 110% at 84% 2%, #3f3a5e 0%, #211d38 46%, #0b0a12 100%)',
    visibility: [
      { label: 'Amount', state: 'public' },
      { label: 'Recipient', state: 'n/a' },
      { label: 'Sender', state: 'visible' },
    ],
  },
  {
    id: 'shadow',
    name: 'Shadow',
    route: 'Vanta → Vanta',
    flagship: true,
    body: 'Send to another Vanta. The amount never touches the chain. The recipient shows only as a view tag.',
    gradient:
      'radial-gradient(130% 110% at 14% 0%, #4e4478 0%, #2a2348 46%, #0c0b14 100%)',
    visibility: [
      { label: 'Amount', state: 'hidden' },
      { label: 'Recipient', state: 'visible' },
      { label: 'Sender', state: 'visible' },
    ],
  },
  {
    id: 'ghost',
    name: 'Ghost',
    route: 'Private → any address',
    flagship: false,
    body: 'Cash out to any Solana wallet. The amount is public again, on purpose.',
    gradient:
      'radial-gradient(130% 110% at 72% 4%, #38414f 0%, #1f2630 48%, #090b0f 100%)',
    visibility: [
      { label: 'Amount', state: 'public' },
      { label: 'Recipient', state: 'public' },
      { label: 'Sender', state: 'visible' },
    ],
  },
]

/**
 * Monochrome by earlier request, then re-tuned for a coloured card: the value is
 * white, and `hidden` is the only one that gets full strength because it is the
 * claim the product rests on.
 */
const STATE_STYLE = {
  hidden: { text: 'text-white', dot: 'bg-white', label: 'hidden' },
  public: { text: 'text-white/70', dot: 'bg-white/70', label: 'public' },
  visible: { text: 'text-white/70', dot: 'bg-white/70', label: 'visible' },
  'n/a': { text: 'text-white/45', dot: 'bg-white/35', label: 'n/a' },
}

function VisibilityRow({ label, state }) {
  const s = STATE_STYLE[state]
  return (
    <li className="flow-pill flex items-center justify-between px-4 py-3.5">
      <span className="text-[14px] text-white/95">{label}</span>
      {/* State is never colour alone: dot plus word. */}
      <span className={`flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] ${s.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    </li>
  )
}

export default function Flows() {
  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="shell">
        <div className="max-w-2xl">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
              How it works
            </p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-4 font-display text-[clamp(2.1rem,1.4rem+2.4vw,3.25rem)] font-normal leading-[1.04] tracking-[-0.03em] text-ink-strong">
              Three ways to move money.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="measure mt-5 text-[16px] leading-relaxed text-ink-subtle">
              Each one says what stays private and what does not.
            </p>
          </Reveal>
        </div>

        <div className="flow-deck mt-14 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {FLOWS.map((flow, i) => (
            <Reveal key={flow.id} delay={i * 90}>
              <article
                className="flow-card relative flex h-full flex-col p-6 sm:p-7"
                style={{ backgroundImage: flow.gradient }}
              >
                {flow.flagship && (
                  <span className="absolute right-6 top-6 rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white">
                    Flagship
                  </span>
                )}

                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                  {flow.route}
                </p>
                <h3 className="mt-2 text-[24px] font-normal leading-[1.18] tracking-[-0.01em] text-white">
                  {flow.name}
                </h3>
                <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-white/70">
                  {flow.body}
                </p>

                <ul className="mt-6 flex flex-col gap-2">
                  {flow.visibility.map((v) => (
                    <VisibilityRow key={v.label} {...v} />
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Legend: explain the two states so the words are never ambiguous */}
        <Reveal delay={200}>
          <div className="mt-10 flex flex-col gap-3 text-[12px] text-ink-subtle sm:flex-row sm:items-center sm:gap-6">
            <span className="flex items-center gap-2">
              <EyeOff size={13} />
              <span>
                <span className="text-ink-strong">hidden</span>: the chain does not show it
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Alert size={13} />
              <span>
                <span className="text-ink-strong">visible</span>: anyone can read it
              </span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
