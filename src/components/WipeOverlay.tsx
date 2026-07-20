import { useEffect, useState } from 'react'

// シーン遷移の白ワイプ。タッチ点から clip-path: circle() が全画面へ拡大し、
// 覆い切ったら onCovered(シーン差し替え)→ opacityフェードで退場して onDone。

type Props = {
  x: number
  y: number
  phase: 'expand' | 'fade'
  onCovered: () => void
  onDone: () => void
}

export function WipeOverlay({ x, y, phase, onCovered, onDone }: Props) {
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    // マウント描画(半径0)を1フレーム挟んでから拡大を開始する
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  // タッチ点から最も遠い画面隅まで届く半径
  const r = Math.ceil(
    Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)),
  )

  return (
    <div
      className={`wipe wipe-${phase}`}
      style={{ clipPath: `circle(${grown ? r : 0}px at ${x}px ${y}px)` }}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget) return
        if (phase === 'expand' && e.propertyName === 'clip-path') onCovered()
        if (phase === 'fade' && e.propertyName === 'opacity') onDone()
      }}
      aria-hidden="true"
    />
  )
}
