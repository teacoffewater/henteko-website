import { useEffect, useState } from 'react'
import { profile } from '../data/profile'

// 「つくっているひと」シーン: 工場の機械に貼ってある製造者銘板(ネームプレート)風カード。
// ワイプの起点から飛び出して定位置に収まる(ワンショットなのでCSS transitionで良い)。

type Props = {
  reduced: boolean
  origin: { x: number; y: number } | null
}

export function AboutScene({ reduced, origin }: Props) {
  const [placed, setPlaced] = useState(reduced || !origin)

  useEffect(() => {
    if (placed) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPlaced(true)))
    return () => cancelAnimationFrame(id)
  }, [placed])

  // 起点から中央への飛び出しの初期transform
  const fromStyle =
    origin && !placed
      ? {
          transform: `translate(${origin.x - window.innerWidth / 2}px, ${origin.y - window.innerHeight / 2}px) scale(0.15) rotate(-6deg)`,
          opacity: 0.6,
        }
      : undefined

  return (
    <section className="scene about-scene" aria-label="つくっているひと">
      <h2 className="field-heading">つくっているひと</h2>
      <div className="nameplate" style={fromStyle}>
        <span className="screw screw-tl" />
        <span className="screw screw-tr" />
        <span className="screw screw-bl" />
        <span className="screw screw-br" />
        <p className="np-title">製造者情報</p>
        <dl className="np-rows">
          <div className="np-row">
            <dt>名称</dt>
            <dd>{profile.name}</dd>
          </div>
          <div className="np-row">
            <dt>中の人</dt>
            <dd>{profile.operator}</dd>
          </div>
          <div className="np-row">
            <dt>ひとこと</dt>
            <dd>{profile.bio}</dd>
          </div>
          <div className="np-row">
            <dt>道具</dt>
            <dd>{profile.tools.join(' / ')}</dd>
          </div>
          <div className="np-row">
            <dt>連絡先</dt>
            <dd>
              <a href={`mailto:${profile.contact}`}>{profile.contact}</a>
            </dd>
          </div>
          <div className="np-row">
            <dt>設立</dt>
            <dd>{profile.established}</dd>
          </div>
        </dl>
        <p className="np-note">このサイトもヘンテコのひとつです。</p>
      </div>
    </section>
  )
}
