import { useEffect, useState } from 'react'

// prefers-reduced-motion か ?static=1 のとき true。
// true の間は自動流れ・揺れ・小ネタを全て止め、機能だけ残す。

function computeStatic(): boolean {
  if (new URLSearchParams(location.search).has('static')) return true
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(computeStatic)

  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(computeStatic())
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
