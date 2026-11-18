import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-reveal primitive — the page's only entrance motion.
 *
 * design.md motion rules: one authored moment per page plus interaction
 * feedback; explain, never decorate; respect prefers-reduced-motion.
 * The authored moment is the receipt, but sections use the same rise so the
 * pacing stays consistent. Travel, curve and the heading blur live in
 * index.css; stagger via the `delay` prop (ms).
 */
export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Honour reduced motion: show immediately, never observe.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }

    let frame = 0

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        // Two frames before revealing. An observer that fires during mount
        // otherwise resolves in the same rendering opportunity as the first
        // paint, so the hidden state never renders and the block appears at
        // full opacity with no transition. Measured on the hero: the copy
        // snapped while the device below it animated.
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => setShown(true))
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )

    io.observe(node)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
