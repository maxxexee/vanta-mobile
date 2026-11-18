import { ChevronDown } from './Marks.jsx'
import Reveal from './Reveal.jsx'

/**
 * Native <details>/<summary> — keyboard and screen-reader behaviour for free
 * (design.md: complete keyboard paths, real semantics over custom widgets).
 * The answers are the same ones we put in the repo, including the unflattering bit.
 */
const FAQS = [
  {
    q: 'Is Vanta anonymous?',
    a: 'No, it is private. A send hides the amount and the recipient. It does not hide you: Vanta pays the fees, so your address shows on every send and never changes. Anyone who knows it can count and time your payments.',
  },
  {
    q: 'Where do my funds go when I shield?',
    a: 'Into one shared pool, held by a program, not by us. Your balance is an encrypted note inside it. Lose the keys and the note is gone.',
  },
  {
    q: 'Who controls the vault?',
    a: 'The pool program. It can still be upgraded, so whoever holds that authority key can change the rules. That is the biggest trust assumption here.',
  },
  {
    q: 'Is it audited? Is it on mainnet?',
    a: 'No and no. Devnet only, never audited. Do not use real money.',
  },
  {
    q: 'What if I lose my phone or my seed?',
    a: 'Your balance comes from your seed. Lose it and the notes are gone. No recovery, no support desk.',
  },
  {
    q: 'Does the relayer see my payments?',
    a: 'It sees the transactions it pays for, never the amounts. In this build it has no login, so it needs hardening before public use.',
  },
  {
    q: 'How do I run it today?',
    a: 'Clone the repo, run the build, point it at devnet. The prover can change under a working build, so the README tracks each version.',
  },
]

export default function Faq() {
  return (
    <section id="faq" className="relative border-t border-hairline py-20 sm:py-28">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          {/* Split header: sticky title on the left, list on the right */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
                  FAQ
                </p>
              </Reveal>
              <Reveal delay={70}>
                <h2 className="mt-4 font-display text-[clamp(1.9rem,1.3rem+2vw,2.75rem)] font-normal leading-[1.06] tracking-[-0.03em] text-ink-strong">
                  Questions we
                  <br />
                  would ask too.
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-5 text-[14px] leading-relaxed text-ink-subtle">
                  Including the ones with bad answers.
                </p>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-8">
            <Reveal delay={100}>
              <div className="divide-y divide-hairline border-y border-hairline">
                {FAQS.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left transition-colors [&::-webkit-details-marker]:hidden">
                      <span className="text-[16px] font-medium tracking-[-0.01em] text-ink-strong transition-colors group-hover:text-white">
                        {item.q}
                      </span>
                      <span className="shrink-0 text-ink-subtle transition-transform duration-300 group-open:rotate-180">
                        <ChevronDown size={16} />
                      </span>
                    </summary>
                    <div className="pb-6 pr-8">
                      <p className="measure text-[14px] leading-[1.7] text-ink-subtle">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
