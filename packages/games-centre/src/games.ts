import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type Game = {
  id: string
  title: string
  emoji: string
  blurb: string
  basePath: string
  load: LazyExoticComponent<ComponentType<{ basePath?: string }>>
}

// Adding a game: build it as a federated remote, declare it in vite.config.ts
// and src/remotes.d.ts, then add one entry here.
export const games: Game[] = [
  {
    id: 'two-truths',
    title: 'Two Truths & a Lie',
    emoji: '😈',
    blurb: 'Everyone adds two truths and a lie about themselves. Can you spot the lie?',
    basePath: '/two-truths',
    load: lazy(() => import('two_truths/Game')),
  },
]

export const gameFor = (path: string): Game | undefined =>
  games.find((g) => path === g.basePath || path.startsWith(g.basePath + '/'))
