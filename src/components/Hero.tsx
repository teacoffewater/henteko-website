import { useEffect, useRef, useState } from 'react'
import { asset } from '../lib/asset'

// ヒーロー: ロゴが3Dプリントされる導入アニメーション(レイヤー合成版)。
//   print: 文字+サポートが下から積層され、ガイドレール+ノズルが境界と一緒に上昇。
//          ノズルは左右にスキャンする
//   snap : プリント完了の小さな振動
//   done : ガントリーが上に退場し、サポート(+ビルドプレート)が下に外れて落ち、
//          文字だけが残ってロゴ完成
// reduced motion 時は最初から done(完成ロゴのみ)。
// 完成後にロゴを3秒以内に5連打すると onSpill(ベルトから全部落ちる)。

type Phase = 'print' | 'snap' | 'done'

export function Hero({ reduced, onSpill }: { reduced: boolean; onSpill: () => void }) {
  const [phase, setPhase] = useState<Phase>(reduced ? 'done' : 'print')
  const clicks = useRef<number[]>([])
  const [pop, setPop] = useState(0)

  useEffect(() => {
    if (reduced) {
      setPhase('done')
      return
    }
    // プリント終了 = アニメーション遅延0.2s + 5.2s = 5.4s
    const t1 = setTimeout(() => setPhase('snap'), 5500)
    const t2 = setTimeout(() => setPhase('done'), 5820)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [reduced])

  const handleClick = () => {
    if (phase !== 'done') return
    const now = performance.now()
    clicks.current = [...clicks.current.filter((t) => now - t < 3000), now]
    if (!reduced) setPop((p) => p + 1)
    if (clicks.current.length >= 5) {
      clicks.current = []
      onSpill()
    }
  }

  return (
    <header className={`hero phase-${phase}`}>
      <h1 className="logo" onClick={handleClick} aria-label="ヘンテコ製作所" title="ヘンテコ製作所">
        <span className={pop ? 'logo-box popping' : 'logo-box'} key={pop}>
          <img
            className="logo-supports"
            src={asset('/logo-supports.png')}
            alt=""
            width={1323}
            height={639}
            decoding="async"
          />
          <img
            className="logo-letters"
            src={asset('/logo.png')}
            alt=""
            width={1323}
            height={639}
            decoding="async"
          />
          <span className="gantry" aria-hidden="true">
            <img className="gantry-rail" src={asset('/logo-rail.png')} alt="" width={1323} height={67} />
            <img className="gantry-nozzle" src={asset('/logo-nozzle.png')} alt="" width={234} height={277} />
          </span>
        </span>
      </h1>
      <p className="tagline">
        役に立つかは、つくってから考える<span className="maru">。</span>
      </p>
      <div className="scroll-hint" aria-hidden="true">
        ↓
      </div>
    </header>
  )
}
