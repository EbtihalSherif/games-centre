import type { Round } from '../types'

export function roundLabel(round: Round): string {
  if (round.name?.trim()) return round.name.trim()
  return `Round of ${new Date(round.created_at).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })}`
}
