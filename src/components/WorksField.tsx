import { useEffect, useMemo, useRef, useState } from 'react'
import { works, type Work } from '../data/works'
import { useRafLoop } from '../hooks/useRafLoop'
import { clamp, damp, estimateVelocity, type VelocitySample } from '../lib/physics'
import { WorkCard } from './WorkCard'

// 「つくったもの」シーン: 作品カード+アヒル+準備中箱が
// ワイプの起点から飛び出して散らばり配置される。
// 各アイテムは掴んで動かせる(離すと慣性で滑って止まり、置いた場所に残る)。
// 連続モーションは共有rAFループが transform を直接書く。

type FieldItem = { kind: 'work'; work: Work } | { kind: 'duck' } | { kind: 'box' }

const items: FieldItem[] = [
  ...works.map((w): FieldItem => ({ kind: 'work', work: w })),
  { kind: 'duck' },
  { kind: 'box' },
]

function hash01(seed: number): number {
  let h = (seed + 1) * 2654435761
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  return ((h >>> 8) & 0xffff) / 0x10000
}

type Slot = { x: number; y: number }

function computeSlots(count: number): Slot[] {
  const W = window.innerWidth
  const H = window.innerHeight
  const cols = W > H ? 3 : 2
  const rows = Math.ceil(count / cols)
  // セーフエリア: 上は見出し、下と左右は少し余白
  const x0 = W * 0.08
  const x1 = W * 0.92
  const y0 = H * 0.2
  const y1 = H * 0.88
  const slots: Slot[] = []
  for (let r = 0; r < rows; r++) {
    const inRow = Math.min(cols, count - r * cols)
    for (let c = 0; c < inRow; c++) {
      const i = r * cols + c
      const jx = (hash01(i) - 0.5) * (x1 - x0) * 0.08
      const jy = (hash01(i + 17) - 0.5) * (y1 - y0) * 0.08
      slots.push({
        // 端数の最終行は中央寄せ
        x: x0 + ((c + 0.5 + (cols - inRow) / 2) / cols) * (x1 - x0) + jx,
        y: y0 + ((r + 0.5) / rows) * (y1 - y0) + jy,
      })
    }
  }
  return slots
}

type Body = {
  ox: number // スロット中心からのオフセット
  oy: number
  vx: number
  vy: number
  scale: number
  delay: number // 入場スタガー
  mode: 'enter' | 'free'
  baseTilt: number
  phase: number
  dragging: boolean
  dragStart: { px: number; py: number; ox: number; oy: number }
  samplesX: VelocitySample[]
  samplesY: VelocitySample[]
  dragDist: number
}

type Props = {
  reduced: boolean
  origin: { x: number; y: number } | null
  onSelect: (w: Work) => void
}

export function WorksField({ reduced, origin, onSelect }: Props) {
  const [slots, setSlots] = useState<Slot[]>(() => computeSlots(items.length))
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const bodies = useRef<Body[]>([])

  useEffect(() => {
    const update = () => setSlots(computeSlots(items.length))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const slotsRef = useRef(slots)
  slotsRef.current = slots

  // 入場初期化(マウント時に1回)
  useMemo(() => {
    bodies.current = items.map((_, i) => {
      const slot = computeSlots(items.length)[i] ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const from = origin && !reduced ? origin : null
      return {
        ox: from ? from.x - slot.x : 0,
        oy: from ? from.y - slot.y : 0,
        vx: 0,
        vy: 0,
        scale: from ? 0.15 : 1,
        delay: from ? i * 0.07 : 0,
        mode: from ? 'enter' : 'free',
        baseTilt: (hash01(i * 31) - 0.5) * 12,
        phase: hash01(i * 7) * 6,
        dragging: false,
        dragStart: { px: 0, py: 0, ox: 0, oy: 0 },
        samplesX: [],
        samplesY: [],
        dragDist: 0,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRafLoop((dt, t) => {
    const W = window.innerWidth
    const H = window.innerHeight
    for (let i = 0; i < items.length; i++) {
      const el = refs.current[i]
      const b = bodies.current[i]
      const slot = slotsRef.current[i]
      if (!el || !b || !slot) continue

      if (b.delay > 0) {
        b.delay -= dt
      } else if (b.dragging) {
        // オフセットはpointermoveで更新済み
      } else if (b.mode === 'enter') {
        // やや跳ねるばねでスロットへ(underdamped)
        const K = 80
        const C = 10
        b.vx += (-K * b.ox - C * b.vx) * dt
        b.vy += (-K * b.oy - C * b.vy) * dt
        b.ox += b.vx * dt
        b.oy += b.vy * dt
        if (Math.abs(b.ox) < 1 && Math.abs(b.oy) < 1 && Math.hypot(b.vx, b.vy) < 10) {
          b.mode = 'free'
          b.vx = 0
          b.vy = 0
        }
      } else {
        // 置き場所に残る。離した後は摩擦で減速
        b.vx = damp(b.vx, 0, 4, dt)
        b.vy = damp(b.vy, 0, 4, dt)
        b.ox += b.vx * dt
        b.oy += b.vy * dt
        // 画面外に飛ばさない
        const margin = 50
        const ax = slot.x + b.ox
        const ay = slot.y + b.oy
        if (ax < margin) {
          b.ox = margin - slot.x
          b.vx = 0
        } else if (ax > W - margin) {
          b.ox = W - margin - slot.x
          b.vx = 0
        }
        if (ay < margin) {
          b.oy = margin - slot.y
          b.vy = 0
        } else if (ay > H - margin) {
          b.oy = H - margin - slot.y
          b.vy = 0
        }
      }

      b.scale = damp(b.scale, 1, 7, dt)
      const bob = reduced ? 0 : Math.sin(t * 1.1 + b.phase) * 2.5
      const rot = b.baseTilt + clamp(b.vx * 0.02, -8, 8)
      el.style.transform = `translate(-50%, -50%) translate3d(${b.ox}px, ${bob + b.oy}px, 0) rotate(${rot}deg) scale(${b.scale})`
    }
  }, !reduced)

  const onPointerDown = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bodies.current[i]
    if (!b || b.mode === 'enter') return
    b.dragging = true
    b.dragDist = 0
    b.dragStart = { px: e.clientX, py: e.clientY, ox: b.ox, oy: b.oy }
    const now = performance.now()
    b.samplesX = [{ t: now, x: e.clientX }]
    b.samplesY = [{ t: now, x: e.clientY }]
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bodies.current[i]
    if (!b?.dragging) return
    const dx = e.clientX - b.dragStart.px
    const dy = e.clientY - b.dragStart.py
    b.dragDist = Math.max(b.dragDist, Math.hypot(dx, dy))
    b.ox = b.dragStart.ox + dx
    b.oy = b.dragStart.oy + dy
    const now = performance.now()
    b.samplesX.push({ t: now, x: e.clientX })
    b.samplesY.push({ t: now, x: e.clientY })
    if (b.samplesX.length > 8) {
      b.samplesX.shift()
      b.samplesY.shift()
    }
  }

  const onPointerUp = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bodies.current[i]
    if (!b?.dragging) return
    b.dragging = false
    b.vx = clamp(estimateVelocity(b.samplesX), -2000, 2000)
    b.vy = clamp(estimateVelocity(b.samplesY), -2000, 2000)
    if (b.dragDist < 8 && e.type !== 'pointercancel') {
      const item = items[i]
      if (item.kind === 'work') onSelect(item.work)
    }
  }

  return (
    <section className="scene works-field" aria-label="つくったもの">
      <h2 className="field-heading">つくったもの</h2>
      {items.map((item, i) => (
        <div
          key={i}
          className="field-item"
          style={{ left: slots[i]?.x ?? 0, top: slots[i]?.y ?? 0 }}
          ref={(el) => {
            refs.current[i] = el
          }}
          onPointerDown={onPointerDown(i)}
          onPointerMove={onPointerMove(i)}
          onPointerUp={onPointerUp(i)}
          onPointerCancel={onPointerUp(i)}
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
    </section>
  )
}

function Duck() {
  return (
    <div className="field-prop" aria-hidden="true">
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
    <div className="field-prop prep-box" aria-hidden="true">
      <span>（次のヘンテコを準備中）</span>
    </div>
  )
}
