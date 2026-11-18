/**
 * The page's one lighting medium: a blurred radial in a single accent, kept
 * under 20% alpha, never behind body copy.
 *
 * Each section places its own because position is composition, but the colour
 * and the falloff come from here, so five sections cannot drift into five
 * different purples. Rendered as a sibling with `pointer-events-none` and
 * `aria-hidden`: it exists to make the dark feel lit, not to be read.
 */
export default function SectionGlow({
  className = '',
  color = 'var(--color-accent-strong)',
  alpha = 0.16,
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ opacity: alpha, background: `radial-gradient(closest-side, ${color}, transparent 76%)` }}
    />
  )
}
