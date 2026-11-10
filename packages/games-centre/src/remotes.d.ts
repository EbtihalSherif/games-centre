// Games are loaded at runtime over Module Federation, so TypeScript needs the shape up front.
declare module 'two_truths/Game' {
  import type { ComponentType } from 'react'

  const Game: ComponentType<{ basePath?: string }>
  export default Game
}
