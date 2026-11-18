import { useCallback, useRef, useState } from 'react'

/**
 * Press ripples for a button or link.
 *
 * Spread `onPointerDown` on the element, render one `<span className="tap-ripple">`
 * per entry in `ripples` with the given `x`/`y` inline, and drop it on
 * `onAnimationEnd`. The element needs `relative overflow-hidden` for the ring to
 * clip to its own corners.
 *
 * Declines under prefers-reduced-motion, and on secondary clicks: a
 * right-click should not leave a ring behind.
 */
export default function useTapRipple() {
  const [ripples, setRipples] = useState([])
  const nextId = useRef(0)

  const onPointerDown = useCallback((event) => {
    if (event.button !== 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const box = event.currentTarget.getBoundingClientRect()
    const id = nextId.current++
    setRipples((prev) => [
      ...prev,
      { id, x: event.clientX - box.left, y: event.clientY - box.top },
    ])
  }, [])

  const onRippleEnd = useCallback((id) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
  }, [])

  return { ripples, onPointerDown, onRippleEnd }
}
