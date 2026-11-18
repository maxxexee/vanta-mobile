import { useEffect } from 'react'

/**
 * Writes 0..1 scroll progress into `--exit` on the referenced element while the
 * first `distance` pixels of the page scroll past.
 *
 * The value goes to a CSS variable, so a scroll frame costs one style write and
 * no React render. CSS defaults the variable to 0, which means a component that
 * never gets this hook (or a browser that refuses to run it) still renders at
 * its resting position.
 *
 * Nothing is written under prefers-reduced-motion: the variable stays 0, so the
 * element does not move. Parallax is exactly what that preference asks to skip.
 */
export default function useScrollExit(ref, distance) {
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const apply = () => {
      frame = 0
      const progress = Math.min(1, Math.max(0, window.scrollY / distance))
      node.style.setProperty('--exit', progress.toFixed(3))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      cancelAnimationFrame(frame)
    }
  }, [ref, distance])
}
