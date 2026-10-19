import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback: ReactNode }

// A game is a separately deployed bundle, so it can fail to load on its own.
// This keeps the rest of the games centre usable when that happens.
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}
