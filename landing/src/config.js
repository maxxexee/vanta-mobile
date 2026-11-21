/**
 * Single source of truth for every outbound link on the landing page.
 *
 * ⚠️ APK_URL is empty on purpose, and it points at the **dApp Store listing**,
 * not at the APK. The two are easy to confuse: the APK *is* served from this
 * site — `public/download/vanta.apk`, the direct download link on the
 * submission form, replaced and re-committed with every release — while Vanta
 * is not listed in the dApp Store yet, which is the only thing this badge
 * waits on. Set this to the store listing when it exists and the badge becomes
 * a real link (see StoreBadge.jsx) with no other change.
 */
export const APK_URL = ''

/**
 * Waitlist signup.
 *
 * Both placements open the on-page card (WaitlistModal.jsx) rather than leaving
 * the site, so there is no destination URL any more. The card POSTs here, and
 * the row lands in the relayer's Postgres alongside the tx history. Empty this
 * and the card's submit surfaces the failure instead of silently dropping a
 * signup.
 */
export const WAITLIST_ENDPOINT = 'https://p01--vanta-mobile--9ymc8tqmdxvj.code.run/waitlist'

export const GITHUB_URL = 'https://github.com/geekman58748/vanta-mobile'

/**
 * The wallet app itself, on this same origin.
 *
 * It is not a separate deployment: `npm run build:site` builds the app and drops
 * it at `dist/app/`, so one upload of `landing/dist` publishes the page and the
 * wallet together. Before that script existed the site was the marketing page
 * only, and a desktop visitor had nothing to click — the APK was the only way
 * into the product. Keep the trailing slash: the app is served as a directory.
 */
export const APP_URL = '/app/'

export const SOCIALS = [
  { label: 'GitHub', href: GITHUB_URL },
  { label: 'X', href: 'https://x.com/' },
]

/**
 * Every on-chain claim on this page resolves to one of these signatures.
 * Devnet. Verify any of them on Solana Explorer (devnet cluster).
 */
export const EXPLORER = 'https://explorer.solana.com/tx/'
export const EXPLORER_SUFFIX = '?cluster=devnet'

export const explorerUrl = (sig) => `${EXPLORER}${sig}${EXPLORER_SUFFIX}`
