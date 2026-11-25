// Getting into a wallet from a phone browser.
//
// A mobile browser has nothing to detect: Safari can't load extensions, and MWA
// only reaches a phone wallet from Android. So on iOS the connect screen used to
// offer nothing a user could actually complete — "Connect browser wallet" never
// rendered and "Connect device wallet" had no wallet to resolve.
//
// The wallet apps solve this themselves. Phantom publishes a *browse* universal
// link (docs.phantom.com/phantom-deeplinks/other-methods/browse) that reopens a
// URL inside Phantom's own in-app browser, and that browser injects a Wallet
// Standard provider. From there the normal browser-wallet path works, unchanged
// and with no session or encryption handshake of our own. The docs recommend
// exactly this: a web app that detects mobile prompting the user into it.
//
// Scope note: this opens the app in a wallet browser. It is not the deeplink
// connect/sign protocol, which would let a *plain* Safari tab sign without
// leaving — that needs a session, an x25519 channel and a signTransaction round
// trip, and is a separate piece of work.
const MOBILE_RE = /Android|iPhone|iPad|iPod|Mobile/i

export function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false
  if (MOBILE_RE.test(navigator.userAgent)) return true
  // iPadOS reports a desktop UA; a coarse pointer with multi-touch does not.
  return navigator.maxTouchPoints > 1 && window.matchMedia?.('(pointer: coarse)')?.matches
}

/**
 * Phantom's in-app browser link for `url` (default: this page).
 *
 * `ref` is the requesting app, which Phantom shows as the origin of the jump.
 */
export function phantomBrowseLink(url) {
  if (typeof window === 'undefined') return ''
  const target = encodeURIComponent(url ?? window.location.href)
  return `https://phantom.com/ul/browse/${target}?ref=${encodeURIComponent(window.location.origin)}`
}

export function openInPhantom(url) {
  const link = phantomBrowseLink(url)
  if (link) window.location.href = link
  return link
}
