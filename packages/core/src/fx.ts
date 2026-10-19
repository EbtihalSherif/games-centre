const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Deterministic shuffle so a person's statements keep the same order on every screen.
export function shuffleSeeded<T>(arr: readonly T[], seed: string | number): T[] {
  let h = 2166136261
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9), ((h >>> 0) % 10000) / 10000)
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function confetti(): void {
  if (reduced()) return
  const colors = ['#ff6bd6', '#ffd23f', '#3ddc97', '#4cc9f0', '#ff6b6b']
  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.className = 'confetti-layer'
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i')
    p.style.left = Math.random() * 100 + 'vw'
    p.style.background = colors[i % colors.length]!
    p.style.animationDelay = Math.random() * 0.4 + 's'
    p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's'
    p.style.transform = `rotate(${Math.random() * 360}deg)`
    layer.appendChild(p)
  }
  document.body.appendChild(layer)
  setTimeout(() => layer.remove(), 3600)
}
