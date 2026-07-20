import { useMemo } from 'react'
import type { Work } from '../data/works'
import { asset } from '../lib/asset'

// ベルトに載る作品カード。画像がない作品には id をシードにした
// ヨレ線の「?」ドゥードルを描く(毎回同じ形になる)。
// ポインタでの選択は Belt 側の pointerup で処理するため、
// ここの onClick はキーボード操作(e.detail === 0)のときだけ反応する。

function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h, 1103515245) + 12345
    return ((h >>> 8) & 0xffff) / 0x10000
  }
}

function wobblyRectPath(seed: string): string {
  const rand = seededRandom(seed)
  const pts: [number, number][] = []
  const w = 180
  const h = 130
  const m = 14
  const per = 6 // 各辺の分割数
  const jitter = () => (rand() - 0.5) * 7
  for (let i = 0; i <= per; i++) pts.push([m + (w - 2 * m) * (i / per) + jitter(), m + jitter()])
  for (let i = 1; i <= per; i++) pts.push([w - m + jitter(), m + (h - 2 * m) * (i / per) + jitter()])
  for (let i = 1; i <= per; i++) pts.push([w - m - (w - 2 * m) * (i / per) + jitter(), h - m + jitter()])
  for (let i = 1; i < per; i++) pts.push([m + jitter(), h - m - (h - 2 * m) * (i / per) + jitter()])
  return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')}Z`
}

export function WorkCard({ work, onSelect }: { work: Work; onSelect: (w: Work) => void }) {
  const doodle = useMemo(() => (work.image ? null : wobblyRectPath(work.id)), [work.id, work.image])

  return (
    <button
      type="button"
      className="work-card"
      data-work={work.id}
      onClick={(e) => {
        if (e.detail === 0) onSelect(work) // キーボード(Enter/Space)経由のみ
      }}
    >
      <span className="work-thumb">
        {work.image ? (
          <img src={asset(work.image)} alt="" width={180} height={130} loading="lazy" decoding="async" />
        ) : (
          <svg viewBox="0 0 180 130" aria-hidden="true">
            <path d={doodle!} className="doodle-line" />
            <text x="90" y="78" className="doodle-q">
              ?
            </text>
          </svg>
        )}
      </span>
      <span className="work-title">{work.title}</span>
    </button>
  )
}
