import { useEffect, useRef } from 'react'

// アプリ全体で共有する単一の requestAnimationFrame ループ。
// 購読者がいる間だけ回り、タブが非表示になると自動停止する。

export type FrameFn = (dt: number, t: number) => void

const subscribers = new Set<FrameFn>()
let rafId = 0
let running = false
let last = 0

function tick(now: number) {
  // タブ復帰直後などの巨大な dt はクランプして物理の暴発を防ぐ
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  for (const fn of subscribers) fn(dt, now / 1000)
  if (subscribers.size > 0) {
    rafId = requestAnimationFrame(tick)
  } else {
    running = false
  }
}

function ensureRunning() {
  if (running || subscribers.size === 0 || document.hidden) return
  running = true
  last = performance.now()
  rafId = requestAnimationFrame(tick)
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId)
      running = false
    } else {
      ensureRunning()
    }
  })
}

/** 共有 rAF ループにコールバックを登録する。enabled=false で一時停止できる。 */
export function useRafLoop(fn: FrameFn, enabled = true) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled) return
    const wrapper: FrameFn = (dt, t) => fnRef.current(dt, t)
    subscribers.add(wrapper)
    ensureRunning()
    return () => {
      subscribers.delete(wrapper)
    }
  }, [enabled])
}
