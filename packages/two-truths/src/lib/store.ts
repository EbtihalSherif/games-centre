import { db, isDemo, uploadImage } from '@games/core/data'
import type { NewSubmission, Round, RoundSummary, Submission } from '../types'

export { uploadImage }

const LOCAL_KEY = 'ttl-demo-submissions'
const LOCAL_ROUNDS_KEY = 'ttl-demo-rounds'

function readLocal<T>(key: string): T[] {
  return JSON.parse(localStorage.getItem(key) || '[]') as T[]
}

function writeLocal<T>(key: string, rows: T[]): void {
  localStorage.setItem(key, JSON.stringify(rows))
}

export async function createRound(name: string): Promise<Round> {
  const trimmed = name.trim()
  if (isDemo) {
    const round: Round = {
      id: crypto.randomUUID(),
      name: trimmed || null,
      player_ids: [],
      shuffled: false,
      lies_spotted: 0,
      lies_guessed: 0,
      created_at: new Date().toISOString(),
      finished_at: null,
    }
    writeLocal(LOCAL_ROUNDS_KEY, [...readLocal<Round>(LOCAL_ROUNDS_KEY), round])
    return round
  }
  const { data, error } = await db()
    .from('rounds')
    .insert({ name: trimmed || null })
    .select('*')
    .single()
  if (error) throw error
  return data as Round
}

export async function listRounds(): Promise<RoundSummary[]> {
  if (isDemo) {
    const subs = readLocal<Submission>(LOCAL_KEY)
    return readLocal<Round>(LOCAL_ROUNDS_KEY)
      .map((r) => ({ ...r, players: subs.filter((s) => s.round_id === r.id).length }))
      .reverse()
  }
  const { data, error } = await db()
    .from('rounds')
    .select('*, submissions(count)')
    .order('created_at', { ascending: false })
  if (error) throw error
  type Row = Round & { submissions?: { count: number }[] }
  return ((data ?? []) as Row[]).map(({ submissions, ...round }) => ({
    ...round,
    players: submissions?.[0]?.count ?? 0,
  }))
}

export async function getRound(id: string): Promise<Round | null> {
  if (isDemo) return readLocal<Round>(LOCAL_ROUNDS_KEY).find((r) => r.id === id) ?? null
  const { data, error } = await db().from('rounds').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Round | null) ?? null
}

export async function listPlayers(roundId: string): Promise<Submission[]> {
  if (isDemo) return readLocal<Submission>(LOCAL_KEY).filter((s) => s.round_id === roundId)
  const { data, error } = await db()
    .from('submissions')
    .select('*')
    .eq('round_id', roundId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Submission[]
}

export async function addSubmission(sub: NewSubmission): Promise<void> {
  if (isDemo) {
    const all = readLocal<Submission>(LOCAL_KEY)
    all.push({ ...sub, id: crypto.randomUUID(), created_at: new Date().toISOString() })
    writeLocal(LOCAL_KEY, all)
    return
  }
  const { error } = await db().from('submissions').insert(sub)
  if (error) throw error
}

function patchLocalRound(id: string, patch: Partial<Round>): void {
  writeLocal(
    LOCAL_ROUNDS_KEY,
    readLocal<Round>(LOCAL_ROUNDS_KEY).map((r) => (r.id === id ? { ...r, ...patch } : r))
  )
}

/** Records the order players were shown in, so a played round stays reproducible. */
export async function startPlay(
  roundId: string,
  { playerIds, shuffled }: { playerIds: string[]; shuffled: boolean }
): Promise<void> {
  const patch = { player_ids: playerIds, shuffled, finished_at: null }
  if (isDemo) return patchLocalRound(roundId, patch)
  const { error } = await db().from('rounds').update(patch).eq('id', roundId)
  if (error) throw error
}

export async function finishRound(
  roundId: string,
  { liesSpotted, liesGuessed }: { liesSpotted: number; liesGuessed: number }
): Promise<void> {
  const patch = {
    lies_spotted: liesSpotted,
    lies_guessed: liesGuessed,
    finished_at: new Date().toISOString(),
  }
  if (isDemo) return patchLocalRound(roundId, patch)
  const { error } = await db().from('rounds').update(patch).eq('id', roundId)
  if (error) throw error
}
