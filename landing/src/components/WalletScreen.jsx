import { Shield, Shadow, Ghost, Copy } from './Marks.jsx'

/**
 * The wallet's home screen, as the app renders it.
 *
 * Extracted from AppPreview so the hero and the wallet section cannot drift
 * apart again: one component, two frames. Everything here is a reconstruction
 * of src/App.jsx's home view, block for block and mark for mark, because a
 * landing page whose phone looks like a different product is worse than no
 * phone at all.
 *
 * `children` renders above the screen content, which is how the hero puts the
 * send sheet and the receipt on top of the same home screen.
 */

const ACTIONS = [
  { name: 'Shield', hint: 'Set amount', Icon: Shield },
  { name: 'Send', hint: 'Shadow', Icon: Ghost },
]

/** The three flows, exactly as the app's rows mark them. */
const TXNS = [
  {
    title: 'Shield 0.300 SOL',
    meta: 'Today 12:04 · private',
    amount: '+0.300',
    income: true,
    Icon: Shield,
  },
  {
    title: 'Shadow to 7xKq…',
    meta: 'Today 11:02 · private',
    amount: '0.100',
    income: false,
    Icon: Shadow,
  },
  {
    title: 'Ghost to 4pR9…',
    meta: 'Yesterday 09:11 · public',
    amount: '0.050',
    income: false,
    Icon: Ghost,
  },
]

/**
 * The topographic field, drawn from the same path data as `TopoWaves` in the
 * app's App.jsx. Thirteen hairlines, each a hair brighter than the last, masked
 * out toward the bottom so they never reach the balance figure. It is the single
 * thing that makes the app's home screen look like Vanta rather than like a
 * generic dark dashboard.
 */
function TopoWaves() {
  return (
    <svg
      className="mock-topo"
      viewBox="0 0 400 350"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[
        'M50 0 C 150 40, 250 10, 400 80',
        'M30 0 C 140 50, 240 20, 400 100',
        'M10 0 C 130 60, 230 30, 400 120',
        'M0 10 C 120 70, 220 40, 400 140',
        'M0 30 C 110 80, 210 50, 400 160',
        'M0 50 C 100 90, 200 60, 400 180',
        'M0 70 C 90 100, 190 70, 400 200',
        'M0 90 C 80 110, 180 80, 400 220',
        'M0 110 C 70 120, 170 90, 400 240',
        'M0 130 C 60 130, 160 100, 400 260',
        'M0 150 C 50 140, 150 110, 400 280',
        'M0 170 C 40 150, 140 120, 400 300',
        'M0 190 C 30 160, 130 130, 400 320',
      ].map((d, i) => (
        <path
          key={d}
          d={d}
          stroke="white"
          strokeOpacity={(0.08 + i * 0.004).toFixed(3)}
          strokeWidth="1.2"
        />
      ))}
    </svg>
  )
}

export default function WalletScreen({ children }) {
  return (
    <div className="relative overflow-hidden rounded-[2.1rem] bg-canvas">
      {/* The app's own background, ported: two soft neutral spotlights behind
          the header and the topographic field across the top. Scaled for a
          302px bezel (see .mock-topo / .mock-spot in index.css). */}
      <div aria-hidden="true" className="mock-spot mock-spot-l" />
      <div aria-hidden="true" className="mock-spot mock-spot-r" />
      <TopoWaves />

      <div className="relative z-10">
        {/* status bar — the app is edge to edge; this is the system strip */}
        <div className="flex items-center justify-between px-5 pt-3.5 pb-1">
          <span className="font-mono text-[10px] text-ink-subtle">9:41</span>
          <span className="h-1 w-16 rounded-full bg-surface-3" />
          <span className="font-mono text-[10px] text-ink-subtle">devnet</span>
        </div>

        {/* app header: QR (Receive) left, engine status + profile right */}
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-hairline bg-surface text-ink">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="3" width="7" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="3" y="14" width="7" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <rect x="14" y="14" width="7" height="7" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              <circle cx="6.5" cy="17.5" r="1" fill="currentColor" />
              <circle cx="17.5" cy="17.5" r="1" fill="currentColor" />
            </svg>
          </span>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-1 py-2">
              <span className="pulse-dot text-accent" />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-subtle">
                Shielded
              </span>
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-full border border-hairline bg-surface text-[13px] font-medium text-ink-strong">
              V
            </span>
          </div>
        </div>

        {/* primary balance: bare on the canvas, address + DEVNET under it */}
        <div className="relative mt-5 px-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-subtle">
            Private balance
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-[38px] font-normal leading-none tracking-[-0.035em] text-ink-strong">
              0.300
            </span>
            <span className="text-[17px] text-ink">SOL</span>
          </div>
          <div className="mt-3.5 flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-subtle">
              CmPCvP42…HQT
              <Copy size={11} />
            </span>
            <span className="rounded-full border border-accent/30 bg-accent-wash px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
              Devnet
            </span>
          </div>

          <div className="absolute right-4 top-0 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-surface text-ink-subtle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0 1 14-2M20 15a8 8 0 0 1-14 2" />
              </svg>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-hairline bg-surface text-ink-subtle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.4A10.4 10.4 0 0 1 12 5c4.5 0 8.3 2.9 9.5 7a10.6 10.6 0 0 1-2.3 3.6M6.1 6.9A10.5 10.5 0 0 0 2.5 12c1.2 4.1 5 7 9.5 7a10.6 10.6 0 0 0 4-.8" />
              </svg>
            </span>
          </div>
        </div>

        {/* action row: Shield, Send, then Receive as a round icon button */}
        <div className="mt-5 grid grid-cols-[1fr_1fr_auto] gap-2.5 px-4">
          {ACTIONS.map(({ name, hint, Icon }) => (
            <span
              key={name}
              className="flex items-center gap-2.5 rounded-[20px] border border-hairline bg-surface px-3 py-3.5"
            >
              <Icon size={16} />
              <span className="flex flex-col leading-none">
                <span className="text-[13px] font-medium text-ink-strong">{name}</span>
                <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-subtle">
                  {hint}
                </span>
              </span>
            </span>
          ))}
          <span className="grid w-[58px] place-items-center rounded-[20px] border border-hairline bg-surface text-ink">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 4v14M12 18l-5-5M12 18l5-5" />
            </svg>
          </span>
        </div>

        {/* send mode card: the app's Shadow/Ghost switch */}
        <div className="mx-4 mt-3 flex items-center justify-between rounded-[18px] border border-accent/30 bg-accent-wash px-3.5 py-3">
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/20 text-accent">
              <Shadow size={15} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[13px] font-medium text-ink-strong">Shadow send</span>
              <span className="mt-1 text-[10px] text-ink-subtle">
                Vanta to Vanta · amount hidden
              </span>
            </span>
          </span>
          <span className="flex h-6 w-11 shrink-0 items-center rounded-full bg-accent px-0.5">
            <span className="ml-auto h-5 w-5 rounded-full bg-white" />
          </span>
        </div>

        {/* transactions: real rows, real marks, "time · private" meta */}
        <div className="mt-5 px-4 pb-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink-subtle">Transactions</span>
            <span className="text-[11px] font-medium text-accent">View all</span>
          </div>
          <div className="mt-2 divide-y divide-hairline">
            {TXNS.map(({ title, meta, amount, income, Icon }) => (
              <div key={title} className="flex items-center justify-between py-2.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-hairline bg-surface ${
                      income ? 'text-accent' : 'text-ink-subtle'
                    }`}
                  >
                    <Icon size={14} />
                  </span>
                  <span className="flex min-w-0 flex-col leading-none">
                    <span className="truncate text-[12px] font-medium text-ink-strong">
                      {title}
                    </span>
                    <span className="mt-1 text-[10px] text-ink-subtle">{meta}</span>
                  </span>
                </span>
                <span
                  className={`tnum shrink-0 text-[12px] font-medium ${
                    income ? 'text-accent' : 'text-ink'
                  }`}
                >
                  {amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}
