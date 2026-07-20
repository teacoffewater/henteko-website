import { useEffect, useMemo, useRef, useState } from 'react'
import { works, type Work } from '../data/works'
import { useRafLoop } from '../hooks/useRafLoop'
import { wrap, clamp, damp, estimateVelocity, type VelocitySample } from '../lib/physics'
import { WorkCard } from './WorkCard'

// コンベアベルト。React は構造だけ描画し、毎フレームの動きは
// 共有 rAF ループが各アイテムの ref に transform を直接書く。
// 掴んでドラッグ→慣性→アイドル流れ、の無限ループ。

const SLOT = 300 // 1アイテムが占める幅(px)
const IDLE_V = 14 // アイドル時の流れ速度(px/s)

type BeltItem =
  | { kind: 'work'; work: Work; wobble: number }
  | { kind: 'duck'; wobble: number }
  | { kind: 'box'; wobble: number }

const fillers: Array<'duck' | 'box'> = ['duck', 'box']
const baseItems: BeltItem[] = []
works.forEach((w, i) => {
  baseItems.push({ kind: 'work', work: w, wobble: 1 })
  const f = fillers[i % fillers.length]
  baseItems.push(f === 'duck' ? { kind: 'duck', wobble: 1.8 } : { kind: 'box', wobble: 2.6 })
})

type FallState = { y: number; vy: number; rot: number; vrot: number; delay: number; returnDelay: number }

type Props = {
  reduced: boolean
  paused: boolean
  spillSignal: number
  onSelect: (w: Work) => void
}

export function Belt({ reduced, paused, spillSignal, onSelect }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])
  const lineRef = useRef<HTMLDivElement>(null)

  // 画面幅に対してベルト1周が足りないときはアイテム列を繰り返す
  const [repeat, setRepeat] = useState(1)
  useEffect(() => {
    const update = () =>
      setRepeat(Math.max(1, Math.ceil((window.innerWidth + 2 * SLOT) / (baseItems.length * SLOT))))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const instances = useMemo(() => {
    const out: BeltItem[] = []
    for (let r = 0; r < repeat; r++) out.push(...baseItems)
    return out
  }, [repeat])

  // ---- エンジン状態(すべて ref。フレーム毎の React 再レンダはゼロ) ----
  const offset = useRef(0)
  const vel = useRef(IDLE_V)
  const tilt = useRef(0)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, offset: 0 })
  const dragDist = useRef(0)
  const samples = useRef<VelocitySample[]>([])
  const pressedWork = useRef<string | null>(null)
  const mode = useRef<'normal' | 'fall' | 'return'>('normal')
  const fall = useRef<FallState[]>([])
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  // イースターエッグ: 全アイテムがベルトから落ちて、1つずつ戻ってくる
  useEffect(() => {
    if (spillSignal === 0 || reduced || mode.current !== 'normal') return
    mode.current = 'fall'
    vel.current = 0
    fall.current = instances.map((_, i) => ({
      y: 0,
      vy: -60 - Math.random() * 160, // 最初にほんの少し跳ね上がる
      rot: 0,
      vrot: (Math.random() - 0.5) * 240,
      delay: Math.random() * 0.35,
      returnDelay: i * 0.13,
    }))
  }, [spillSignal, reduced, instances])

  // セクションが画面外のときは rAF の仕事を止める
  const [active, setActive] = useState(true)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useRafLoop((dt, t) => {
    const vw = window.innerWidth
    const total = instances.length
    const L = total * SLOT

    // ---- 速度と位置 ----
    if (dragging.current) {
      vel.current = clamp(estimateVelocity(samples.current), -3000, 3000)
    } else if (mode.current === 'normal') {
      const target = pausedRef.current || reduced ? 0 : IDLE_V
      vel.current = damp(vel.current, target, 2.2, dt)
      offset.current += vel.current * dt
    }

    // 静止しきった reduced モードでは書き込み自体をスキップ
    if (reduced && !dragging.current && Math.abs(vel.current) < 0.5 && mode.current === 'normal') return

    // ---- 傾き(ベルトの加減速でカードが傾く) ----
    const targetTilt = clamp(-vel.current * 0.012, -8, 8)
    tilt.current = damp(tilt.current, targetTilt, 8, dt)

    // ---- 落下/帰還モードの物理 ----
    if (mode.current === 'fall') {
      const vh = window.innerHeight
      let allGone = true
      for (const f of fall.current) {
        f.delay -= dt
        if (f.delay <= 0 && f.y < vh + 100) {
          f.vy += 2600 * dt
          f.y += f.vy * dt
          f.rot += f.vrot * dt
        }
        if (f.y < vh + 100) allGone = false
      }
      if (allGone) mode.current = 'return'
    } else if (mode.current === 'return') {
      let allBack = true
      for (const f of fall.current) {
        f.returnDelay -= dt
        if (f.returnDelay <= 0) {
          f.y = damp(f.y, 0, 5, dt)
          f.rot = damp(f.rot, 0, 5, dt)
        }
        if (Math.abs(f.y) > 0.5 || Math.abs(f.rot) > 0.3) allBack = false
      }
      if (allBack) {
        mode.current = 'normal'
        fall.current = []
      }
    }

    // ---- 破線(ベルトの筋)も一緒に流す ----
    if (lineRef.current) {
      const DASH = 36
      lineRef.current.style.transform = `translate3d(${wrap(offset.current, DASH) - DASH}px, 0, 0)`
    }

    // ---- 各アイテムの transform 書き込み ----
    for (let i = 0; i < total; i++) {
      const el = nodesRef.current[i]
      if (!el) continue
      const x = wrap(i * SLOT + offset.current, L) - SLOT
      if (x < -SLOT || x > vw) {
        el.style.visibility = 'hidden'
        continue
      }
      el.style.visibility = 'visible'
      let y = 0
      let rot = tilt.current
      const item = instances[i]
      if (!reduced) {
        const speedBoost = 1 + Math.abs(vel.current) / 500
        y = Math.sin(t * 1.3 + i * 1.7) * 2.5 * item.wobble
        rot += Math.sin(t * 0.8 + i * 2.3) * 1.1 * item.wobble * speedBoost
      }
      const f = fall.current[i]
      if (f) {
        y += f.y
        rot += f.rot
      }
      el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`
    }
  }, active)

  // ---- ドラッグ(Pointer Events でマウス/タッチ統一) ----
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode.current !== 'normal') return
    dragging.current = true
    dragDist.current = 0
    dragStart.current = { x: e.clientX, offset: offset.current }
    samples.current = [{ t: performance.now(), x: e.clientX }]
    pressedWork.current =
      (e.target as HTMLElement).closest('[data-work]')?.getAttribute('data-work') ?? null
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    dragDist.current = Math.max(dragDist.current, Math.abs(dx))
    offset.current = dragStart.current.offset + dx
    samples.current.push({ t: performance.now(), x: e.clientX })
    if (samples.current.length > 8) samples.current.shift()
  }

  const endDrag = (cancelled: boolean) => {
    if (!dragging.current) return
    dragging.current = false
    vel.current = clamp(estimateVelocity(samples.current), -3000, 3000)
    if (!cancelled && dragDist.current < 8 && pressedWork.current) {
      const w = works.find((w) => w.id === pressedWork.current)
      if (w) onSelect(w)
    }
    pressedWork.current = null
  }

  return (
    <section ref={sectionRef} className="belt-section" aria-label="作品ギャラリー">
      <h2 className="belt-heading">つくったもの</h2>
      <div
        className="belt-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => endDrag(false)}
        onPointerCancel={() => endDrag(true)}
      >
        {instances.map((item, i) => (
          <div
            key={i}
            className="belt-item"
            ref={(el) => {
              nodesRef.current[i] = el
            }}
          >
            {item.kind === 'work' ? (
              <WorkCard work={item.work} onSelect={onSelect} />
            ) : item.kind === 'duck' ? (
              <Duck />
            ) : (
              <PrepBox />
            )}
          </div>
        ))}
        <div className="belt-line-clip" aria-hidden="true">
          <div ref={lineRef} className="belt-line" />
        </div>
      </div>
      <p className="belt-hint">つかんで流せます</p>
    </section>
  )
}

function Duck() {
  return (
    <div className="belt-prop" aria-hidden="true">
      <svg viewBox="0 0 90 80" className="duck">
        <path
          className="doodle-line"
          d="M28,52 C14,52 10,40 16,32 C21,25 30,26 33,31 C34,20 46,14 55,20 C62,24 63,32 59,38 C70,37 78,42 77,52 C76,62 64,68 48,68 C38,68 32,62 28,52 Z"
        />
        <circle cx="49" cy="26" r="2.4" fill="currentColor" />
        <path className="doodle-line" d="M58,24 L70,27 L58,31" />
      </svg>
    </div>
  )
}

function PrepBox() {
  return (
    <div className="belt-prop prep-box" aria-hidden="true">
      <span>（次のヘンテコを準備中）</span>
    </div>
  )
}
