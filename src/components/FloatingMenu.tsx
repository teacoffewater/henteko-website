import { useEffect, useRef } from 'react'
import { useRafLoop } from '../hooks/useRafLoop'

// 画面内を漂うメニューピル。現在のシーン以外の行き先を表示する。
// rAFで translate3d を直接書き、ゆっくり漂流+サイン波の揺れ+画面端で反射。
// reduced motion 時は右上に静止スタックで表示(CSS側)。

export type Scene = 'home' | 'works' | 'about'

const MENU: Record<Scene, { to: Scene; label: string }[]> = {
  home: [
    { to: 'works', label: 'つくったもの' },
    { to: 'about', label: 'つくっているひと' },
  ],
  works: [
    { to: 'home', label: 'ヘンテコ製作所' },
    { to: 'about', label: 'つくっているひと' },
  ],
  about: [
    { to: 'home', label: 'ヘンテコ製作所' },
    { to: 'works', label: 'つくったもの' },
  ],
}

type Body = { x: number; y: number; vx: number; vy: number; phase: number }

const EDGE = 12 // 画面端マージン

function spawn(index: number): Body {
  const W = window.innerWidth
  const H = window.innerHeight
  // ロゴ(中央)を避けて、1つ目は左上寄り・2つ目は右下寄りに湧く
  const x = index === 0 ? W * (0.06 + Math.random() * 0.1) : W * (0.55 + Math.random() * 0.15)
  const y = index === 0 ? H * (0.1 + Math.random() * 0.1) : H * (0.72 + Math.random() * 0.12)
  const speed = 16 + Math.random() * 10
  const dir = Math.random() * Math.PI * 2
  return { x, y, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, phase: Math.random() * 6 }
}

type Props = {
  scene: Scene
  reduced: boolean
  onNavigate: (to: Scene, x: number, y: number) => void
}

export function FloatingMenu({ scene, reduced, onNavigate }: Props) {
  const items = MENU[scene]
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const bodies = useRef<Body[]>([])
  const sizes = useRef<{ w: number; h: number }[]>([])

  useEffect(() => {
    bodies.current = items.map((_, i) => spawn(i))
    sizes.current = refs.current.map((el) => (el ? { w: el.offsetWidth, h: el.offsetHeight } : { w: 170, h: 46 }))
  }, [items])

  useRafLoop((dt, t) => {
    const W = window.innerWidth
    const H = window.innerHeight
    for (let i = 0; i < items.length; i++) {
      const el = refs.current[i]
      const b = bodies.current[i]
      const s = sizes.current[i]
      if (!el || !b || !s) continue
      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.x < EDGE && b.vx < 0) b.vx = -b.vx
      if (b.x + s.w > W - EDGE && b.vx > 0) b.vx = -b.vx
      if (b.y < EDGE && b.vy < 0) b.vy = -b.vy
      if (b.y + s.h > H - EDGE && b.vy > 0) b.vy = -b.vy
      const bob = Math.sin(t * 0.9 + b.phase) * 5
      const rot = Math.sin(t * 0.7 + b.phase * 2) * 3
      el.style.transform = `translate3d(${b.x}px, ${b.y + bob}px, 0) rotate(${rot}deg)`
    }
  }, !reduced)

  return (
    <nav className="floating-menu" aria-label="メニュー">
      {items.map((item, i) => (
        <button
          key={item.to}
          type="button"
          ref={(el) => {
            refs.current[i] = el
          }}
          className="menu-pill"
          onClick={(e) => {
            let { clientX: x, clientY: y } = e
            if (x === 0 && y === 0) {
              // キーボード操作: ボタン中心をワイプ起点にする
              const r = e.currentTarget.getBoundingClientRect()
              x = r.left + r.width / 2
              y = r.top + r.height / 2
            }
            onNavigate(item.to, x, y)
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
