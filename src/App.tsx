import { useState } from 'react'
import { Hero } from './components/Hero'
import { WorksField } from './components/WorksField'
import { AboutScene } from './components/AboutScene'
import { FloatingMenu, type Scene } from './components/FloatingMenu'
import { WipeOverlay } from './components/WipeOverlay'
import { WorkDetail } from './components/WorkDetail'
import { useReducedMotion } from './hooks/useReducedMotion'
import type { Work } from './data/works'

// スクロールなしの1画面シーン制。
// 浮遊メニューをタッチ → その点から白ワイプが広がる → シーン差し替え →
// 新シーンのコンテンツがタッチ点から飛び出して配置される。

type Wipe = { x: number; y: number; to: Scene; phase: 'expand' | 'fade' }

export default function App() {
  const reduced = useReducedMotion()
  const [scene, setScene] = useState<Scene>('home')
  const [wipe, setWipe] = useState<Wipe | null>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const [selected, setSelected] = useState<Work | null>(null)

  const navigate = (to: Scene, x: number, y: number) => {
    if (wipe || to === scene) return
    setSelected(null)
    if (reduced) {
      setScene(to)
      setOrigin(null)
      return
    }
    setWipe({ x, y, to, phase: 'expand' })
  }

  const onCovered = () => {
    if (!wipe) return
    setScene(wipe.to)
    setOrigin({ x: wipe.x, y: wipe.y })
    setWipe({ ...wipe, phase: 'fade' })
  }

  return (
    <div className={reduced ? 'app reduced' : 'app'}>
      {scene === 'home' && <Hero reduced={reduced} />}
      {scene === 'works' && <WorksField reduced={reduced} origin={origin} onSelect={setSelected} />}
      {scene === 'about' && <AboutScene reduced={reduced} origin={origin} />}
      <FloatingMenu scene={scene} reduced={reduced} onNavigate={navigate} />
      {selected && <WorkDetail work={selected} onClose={() => setSelected(null)} />}
      {wipe && (
        <WipeOverlay
          x={wipe.x}
          y={wipe.y}
          phase={wipe.phase}
          onCovered={onCovered}
          onDone={() => setWipe(null)}
        />
      )}
    </div>
  )
}
