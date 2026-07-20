import { useState } from 'react'
import { Hero } from './components/Hero'
import { Belt } from './components/Belt'
import { Footer } from './components/Footer'
import { WorkDetail } from './components/WorkDetail'
import { useReducedMotion } from './hooks/useReducedMotion'
import type { Work } from './data/works'

export default function App() {
  const reduced = useReducedMotion()
  const [selected, setSelected] = useState<Work | null>(null)
  const [spillSignal, setSpillSignal] = useState(0)

  return (
    <div className={reduced ? 'app reduced' : 'app'}>
      <Hero reduced={reduced} onSpill={() => setSpillSignal((s) => s + 1)} />
      <Belt
        reduced={reduced}
        paused={selected !== null}
        spillSignal={spillSignal}
        onSelect={setSelected}
      />
      <Footer />
      {selected && <WorkDetail work={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
