import { useEffect, useState } from 'react'

/**
 * Whether the element behind `ref` is currently intersecting the viewport.
 *
 * Starts `true` and only flips on an observer callback, so a browser without
 * IntersectionObserver, or a node that never reports, keeps whatever motion it
 * already had. The caller uses this to pause ambient loops, which is a cost
 * saving: pausing late is harmless, freezing forever is not.
 *
 * Threshold 0 means any visible pixel counts, so a loop resumes before the
 * element has fully re-entered.
 */
export default function useOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    io.observe(node)
    return () => io.disconnect()
  }, [ref])

  return onScreen
}
