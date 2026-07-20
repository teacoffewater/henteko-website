// ベルトやアニメーション全般で使う小さな数学ユーティリティ

/** x を [0, len) に折り返す(負値対応の剰余) */
export function wrap(x: number, len: number): number {
  return ((x % len) + len) % len
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

/**
 * フレームレート非依存の指数減衰。current を target へ寄せる。
 * rate が大きいほど速く収束する。
 */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * dt)
}

export type VelocitySample = { t: number; x: number }

/** 直近 ~100ms のサンプルから速度(px/s)を推定する */
export function estimateVelocity(samples: VelocitySample[]): number {
  if (samples.length < 2) return 0
  const last = samples[samples.length - 1]
  const cutoff = last.t - 100
  let first = samples[0]
  for (const s of samples) {
    if (s.t >= cutoff) {
      first = s
      break
    }
  }
  const dt = (last.t - first.t) / 1000
  if (dt <= 0) return 0
  return (last.x - first.x) / dt
}
