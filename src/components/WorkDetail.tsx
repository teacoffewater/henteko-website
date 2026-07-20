import { useEffect, useRef } from 'react'
import type { Work } from '../data/works'
import { asset } from '../lib/asset'

// 作品詳細オーバーレイ。transform/opacity のみで出現し、
// Esc・背景クリック・×で閉じる。開閉時にフォーカスを行き来させる。

export function WorkDetail({ work, onClose }: { work: Work; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus({ preventScroll: true })
    }
  }, [onClose])

  const images = work.images ?? (work.image ? [work.image] : [])

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className="detail-card"
        role="dialog"
        aria-modal="true"
        aria-label={work.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="detail-close" onClick={onClose} aria-label="閉じる">
          ×
        </button>
        {images.length > 0 && (
          <div className="detail-images">
            {images.map((src) => (
              <img key={src} src={asset(src)} alt={work.title} width={800} height={800} decoding="async" />
            ))}
          </div>
        )}
        <div className="detail-head">
          <h3>{work.title}</h3>
          <span className="detail-year">{work.year}</span>
        </div>
        <ul className="detail-tags">
          {work.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <p className="detail-desc">{work.description}</p>
        {work.link ? (
          <a className="detail-link" href={work.link} target="_blank" rel="noreferrer">
            見にいく →
          </a>
        ) : (
          <p className="detail-note">※現地(ローカル)でのみ稼働中</p>
        )}
      </div>
    </div>
  )
}
