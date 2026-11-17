import { useEffect, useState } from 'react'
import { Shadow } from './Marks.jsx'
import WalletScreen from './WalletScreen.jsx'

/**
 * The hero's phone: the same home screen the wallet section renders, with the
 * Shadow send sheet rising over it and the receipt landing.
 *
 * The first version was its own invention, a generic send form with none of the
 * app's chrome, which made the hero and the wallet section look like two
 * products. Now the screen is WalletScreen, so the balance, the topo field and
 * the transaction rows are identical in both places, and only the sheet on top
 * is hero-specific.
 */

const HOME = 'home'
const COMPOSE = 'compose'
const SENDING = 'sending'
const SENT = 'sent'

const RECIPIENT_TAG = 'vanta:7f3a…c19'

export default function HeroPhone() {
  const [phase, setPhase] = useState(HOME)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(query.matches)
    const onChange = (event) => setReduceMotion(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    // Reduced motion: land on the receipt and stay there. It is the frame that
    // carries the argument, and nothing needs to move for it to work.
    if (reduceMotion) {
      setPhase(SENT)
      return
    }

    let cancelled = false
    let timer = null
    const wait = (ms) =>
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms)
      })

    const cycle = async () => {
      while (!cancelled) {
        setPhase(HOME)
        await wait(1500)
        if (cancelled) break
        setPhase(COMPOSE)
        await wait(2000)
        if (cancelled) break
        setPhase(SENDING)
        await wait(1100)
        if (cancelled) break
        setPhase(SENT)
        await wait(5000)
      }
    }

    cycle()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [reduceMotion])

  const sheetUp = phase === COMPOSE || phase === SENDING
  const sent = phase === SENT

  return (
    <div className="relative mx-auto w-[340px] shrink-0">
      <div className="relative rounded-[2.7rem] border border-hairline-strong bg-surface-2 p-2.5 shadow-[0_50px_90px_-40px_rgba(0,0,0,0.95)]">
        <div className="relative overflow-hidden rounded-[2.2rem] bg-canvas">
          <div aria-hidden="true">
            <WalletScreen />
          </div>

          {/* Dim the home screen while the sheet is up, the way a real sheet does. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 z-20 bg-black/50 transition-opacity duration-300 ${
              sheetUp || sent ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* ---- Send sheet ---- */}
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 z-30 rounded-t-[26px] border-t border-hairline bg-surface px-4 pb-4 pt-2.5 transition-transform duration-500 ease-out ${
              sheetUp ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-3" />

            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-ink-strong">Send</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-subtle">
                shadow
              </span>
            </div>

            <div className="mt-3 rounded-[16px] border border-hairline bg-canvas px-3 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-subtle">
                to
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-wash text-[10px] text-accent">
                  v
                </span>
                <span className="font-mono text-[11px] text-ink">{RECIPIENT_TAG}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-[16px] border border-hairline bg-canvas px-3 py-2.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-subtle">
                amount
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="tnum text-[22px] leading-none tracking-tight text-ink-strong">
                  0.100
                </span>
                <span className="text-[11px] text-ink-subtle">SOL</span>
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 px-1 text-[10px] text-ink-subtle">
              <Shadow size={11} />
              Vanta to Vanta · the amount never reaches the chain
            </div>

            <div className="relative mt-3 overflow-hidden rounded-[14px] bg-accent">
              <div
                className={`absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-1000 ease-linear ${
                  phase === SENDING ? 'w-full' : 'w-0'
                }`}
              />
              <p className="relative py-2.5 text-center text-[12px] font-medium text-white">
                {phase === SENDING ? 'Hiding amount…' : 'Send privately'}
              </p>
            </div>
          </div>

          {/* ---- Receipt ---- */}
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 z-30 rounded-t-[26px] border-t border-hairline bg-surface px-4 pb-5 pt-2.5 transition-transform duration-500 ease-out ${
              sent ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-3" />

            <div className="flex items-center gap-2 text-[11px] text-hidden">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-hidden-wash text-[9px]">
                ✓
              </span>
              Shadow sent
            </div>

            <div className="mt-3 rounded-[16px] border border-hairline bg-canvas">
              {[
                ['Amount', 'hidden', 'hidden'],
                ['Recipient', 'vanta:7f3a…c19', 'exposed'],
                ['Sender', 'public', 'exposed'],
              ].map(([label, value, tone]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-hairline px-3 py-2.5 last:border-b-0"
                >
                  <span className="text-[11px] text-ink-subtle">{label}</span>
                  <span
                    className={`flex items-center gap-1.5 font-mono text-[10px] ${
                      tone === 'hidden' ? 'text-hidden' : 'text-exposed'
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${
                        tone === 'hidden' ? 'bg-hidden' : 'bg-exposed'
                      }`}
                    />
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-2.5 break-hash px-1 font-mono text-[9px] leading-relaxed text-ink-subtle">
              4xNp…9Qe · slot 419,882,113
            </p>
          </div>

          {/* Home indicator */}
          <div className="absolute inset-x-0 bottom-1.5 z-40 flex justify-center" aria-hidden="true">
            <span className="h-1 w-16 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
