// Static reproduction of the portfolio reference (Screenshot 2026-11-22 at 00.48.10).
//
// Deliberately not wired to the wallet: this is a style frame, mounted at
// /frame/portfolio.html, so the direction can be judged against the reference
// before any of it touches App.jsx. Every number is the reference's own.

import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './portfolio.css'
import portrait from '../src/assets/portrait.webp'

/** Artboard the measurements were taken at; the stage scales it to the viewport. */
const ARTBOARD = { width: 563, height: 1127 }

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" className="chev" aria-hidden="true">
      <path d="M6 9.5 12 15.5 18 9.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconArrowIn() {
  return (
    <svg viewBox="0 0 24 24" className="act-icon" aria-hidden="true">
      <path d="M18 6 6.5 17.5M6.5 11v6.5H13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconArrowOut() {
  return (
    <svg viewBox="0 0 24 24" className="act-icon" aria-hidden="true">
      <path d="M6 18 17.5 6.5M11 6.5h6.5V13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus({ stroke = 2.4 }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  )
}

function IconVault() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.4" y="10.4" width="15.2" height="9.6" rx="3.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8.1 10.4V8.3a3.9 3.9 0 0 1 7.8 0v2.1" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="15.1" r="1.5" fill="currentColor" />
    </svg>
  )
}

function IconDots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5.5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}

function SolanaMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sol">
      <defs>
        <linearGradient id="solA" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <g fill="url(#solA)">
        <path d="M8 5.4h10.4l-3.8 3.4H4.2L8 5.4Z" />
        <path d="M11.4 10.2h10.4l-3.8 3.4H7.6l3.8-3.4Z" />
        <path d="M8 15h10.4l-3.8 3.4H4.2L8 15Z" />
      </g>
    </svg>
  )
}

function TetherMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="usdt">
      <circle cx="12" cy="12" r="12" fill="#26A17B" />
      <g transform="translate(12 12) scale(0.74) translate(-12 -12)">
        <path d="M13.1 10.5V8.9h4V6.6H6.9v2.3h4v1.6c-3.3.2-5.8.9-5.8 1.7 0 .8 2.5 1.5 5.8 1.7v5.7h2.2v-5.7c3.3-.2 5.8-.9 5.8-1.7 0-.8-2.5-1.5-5.8-1.7Zm0 2.6v-1.9c-.1 0-.5 0-1.1 0-.4 0-.8 0-1 0v1.9c-2.9-.2-5-.7-5-1.4 0-.6 2.1-1.2 5-1.3v1.4c.2 0 .6 0 1 0 .6 0 1 0 1.1 0V9.9c2.9.2 5 .7 5 1.3 0 .7-2.1 1.2-5 1.4Z" fill="#fff" />
      </g>
    </svg>
  )
}

function ChainMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="chain">
      <circle cx="12" cy="12" r="12" fill="#1F6BFF" />
      <path d="M12 6.2a5.8 5.8 0 1 0 5.72 6.8h-2.4A3.45 3.45 0 1 1 12 8.55V6.2Z" fill="#fff" />
      <circle cx="12" cy="12" r="1.9" fill="#fff" opacity="0.9" />
    </svg>
  )
}

/** Bottom tab mark, one path per tab so the nav reads as a set rather than clip art. */
function TabIcon({ name }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  return (
    <svg viewBox="0 0 24 24" className="tab-icon" aria-hidden="true">
      {name === 'stake' && (
        <>
          <circle cx="12" cy="12" r="7.4" {...common} />
          <path d="M12 4.6v14.8" {...common} />
        </>
      )}
      {name === 'portfolio' && (
        <g fill="currentColor">
          <circle cx="8.8" cy="8.8" r="2.7" />
          <circle cx="15.2" cy="8.8" r="2.7" />
          <circle cx="8.8" cy="15.2" r="2.7" opacity="0.55" />
          <circle cx="15.2" cy="15.2" r="2.7" opacity="0.55" />
        </g>
      )}
      {name === 'swap' && (
        <>
          <path d="M12 5v11" {...common} />
          <path d="M8 12.5 12 16.5 16 12.5" {...common} />
          <path d="M6.5 19h11" {...common} opacity="0.5" />
        </>
      )}
      {name === 'liquidity' && (
        <>
          <path d="M8 18V11" {...common} />
          <path d="M12 18V6.5" {...common} />
          <path d="M16 18v-4.5" {...common} />
        </>
      )}
      {name === 'settings' && (
        <path
          d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.55-1.9-3.3-2.38.96A7.5 7.5 0 0 0 15.2 6l-.36-2.53H10.9l-.36 2.53c-.74.24-1.43.6-2.05 1.06l-2.37-.95-1.9 3.3L6.2 11a7.6 7.6 0 0 0 0 2l-2 1.56 1.9 3.3 2.37-.96c.62.46 1.31.82 2.05 1.06L10.9 20.5h3.94l.36-2.53c.74-.24 1.43-.6 2.05-1.06l2.38.96 1.9-3.3-2.13-1.57ZM12 15.3a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6Z"
          fill="currentColor"
        />
      )}
    </svg>
  )
}

function AssetCard({ mark, name, amount, ticker, usd }) {
  return (
    <article className="asset">
      <div className="asset-top">
        <span className="asset-mark">{mark}</span>
        <h2>{name}</h2>
        <button className="more" type="button" aria-label={`${name} options`}>
          <IconDots />
        </button>
      </div>
      <p className="asset-amount">
        <b>{amount}</b>
        <span>{ticker}</span>
      </p>
      <p className="asset-usd">{usd}</p>
      <button className="asset-cta" type="button">
        <span className="cta-icon">
          <IconVault />
        </span>
        Add to Vault
      </button>
    </article>
  )
}

function Frame() {
  const stage = useRef(null)

  // The artboard is fixed so the layout is judged at the reference's own
  // measurements. Scaling it keeps that true on any window instead of letting
  // the design reflow and quietly stop matching.
  useEffect(() => {
    const fit = () => {
      const el = stage.current
      if (!el) return
      const scale = Math.min(
        window.innerWidth / ARTBOARD.width,
        window.innerHeight / ARTBOARD.height,
      )
      el.style.setProperty('--fit', String(scale))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="stage" ref={stage}>
      <div className="artboard">
        <header className="top">
          <button className="me" type="button" aria-label="Profile">
            <img src={portrait} alt="" />
            <span className="badge">8</span>
          </button>
          <button className="account" type="button">
            <ChainMark />
            <span className="addr">0xfK07...8336</span>
            <ChevronDown />
          </button>
        </header>

        <aside className="peek" aria-hidden="true">
          <div className="lock">
            <span className="lock-shackle" />
            <span className="lock-body" />
          </div>
          <span className="peek-help">?</span>
        </aside>

        <section className="portfolio">
          <h1>Portfolio</h1>
          <p className="balance">
            <span className="num">35,292.29</span>
            <span className="unit">TEA</span>
          </p>
          <p className="usd">35,292.29 USD</p>
        </section>

        <div className="actions">
          <button className="act act-left" type="button">
            <IconArrowIn />
            Receive
          </button>
          <button className="act act-right" type="button">
            Send
            <IconArrowOut />
          </button>
          <span className="notch">
            <span className="ring" aria-hidden="true" />
            <span className="ring-core">
              <IconPlus />
            </span>
          </span>
        </div>

        <button className="vault" type="button">
          <span className="vault-well">
            <IconVault />
          </span>
          <span className="vault-labels">
            <span className="vault-label">Vault</span>
            <strong className="vault-value">$34,209</strong>
          </span>
          <span className="vault-add">
            <IconPlus />
          </span>
        </button>

        <section className="assets" aria-label="Assets">
          <AssetCard
            mark={<SolanaMark />}
            name="Solana"
            amount="34,209"
            ticker="SOL"
            usd="6,534.95 USD"
          />
          <AssetCard
            mark={<TetherMark />}
            name="Tether"
            amount="1,087"
            ticker="USDT"
            usd="1,134.95 USD"
          />
        </section>

        <nav className="tabs" aria-label="Primary">
          {[
            ['stake', 'Stake'],
            ['portfolio', 'Portfolio'],
            ['swap', 'Swap'],
            ['liquidity', 'Liquidity'],
            ['settings', 'Settings'],
          ].map(([id, label]) => (
            <a
              key={id}
              href="#"
              className={`tab${id === 'portfolio' ? ' is-active' : ''}`}
              aria-current={id === 'portfolio' ? 'page' : undefined}
            >
              <span className="tab-well">
                <TabIcon name={id} />
              </span>
              <span className="tab-label">{label}</span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

createRoot(document.getElementById('frame-root')).render(
  <StrictMode>
    <Frame />
  </StrictMode>,
)
