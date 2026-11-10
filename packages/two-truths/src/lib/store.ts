import { db, isDemo, uploadImage } from '@games/core/data'
import type { NewSubmission, Round, RoundSummary, Submission } from '../types'

export { uploadImage }

const LOCAL_KEY = 'ttl-demo-submissions'
const LOCAL_ROUNDS_KEY = 'ttl-demo-rounds'
const HOST_CODES_KEY = 'ttl-host-codes'

// host_code is deliberately not selectable, so `*` would be rejected by Postgres.
const ROUND_COLUMNS = 'id, name, player_ids, shuffled, lies_spotted, lies_guessed, created_at, finished_at'

// No O/0/I/1 so the code survives being read aloud or copied off a screen.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function makeHostCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

function readCodes(): Record<string, string> {
  return JSON.parse(localStorage.getItem(HOST_CODES_KEY) || '{}') as Record<string, string>
}

/** The host's own copy, so they aren't asked for it again on this device. */
export function rememberedHostCode(roundId: string): string | null {
  return readCodes()[roundId] ?? null
}

export function rememberHostCode(roundId: string, code: string): void {
  localStorage.setItem(HOST_CODES_KEY, JSON.stringify({ ...readCodes(), [roundId]: code }))
}

function readLocal<T>(key: string): T[] {
  return JSON.parse(localStorage.getItem(key) || '[]') as T[]
}

function writeLocal<T>(key: string, rows: T[]): void {
  localStorage.setItem(key, JSON.stringify(rows))
}

/** Demo rounds live in localStorage, so they carry the code the server would normally hold. */
type DemoRound = Round & { host_code?: string | null }

function demoRound(roundId: string): DemoRound | undefined {
  return readLocal<DemoRound>(LOCAL_ROUNDS_KEY).find((r) => r.id === roundId)
}

export async function createRound(
  name: string,
  { requireCode }: { requireCode: boolean }
): Promise<{ round: Round; hostCode: string | null }> {
  const trimmed = name.trim()
  const hostCode = requireCode ? makeHostCode() : null
  if (isDemo) {
    const round: DemoRound = {
      id: crypto.randomUUID(),
      name: trimmed || null,
      player_ids: [],
      shuffled: false,
      lies_spotted: 0,
      lies_guessed: 0,
      created_at: new Date().toISOString(),
      finished_at: null,
      host_code: hostCode,
    }
    writeLocal(LOCAL_ROUNDS_KEY, [...readLocal<DemoRound>(LOCAL_ROUNDS_KEY), round])
    if (hostCode) rememberHostCode(round.id, hostCode)
    return { round, hostCode }
  }
  const { data, error } = await db()
    .from('rounds')
    .insert({ name: trimmed || null, host_code: hostCode })
    .select(ROUND_COLUMNS)
    .single()
  if (error) throw error
  const round = data as Round
  if (hostCode) rememberHostCode(round.id, hostCode)
  return { round, hostCode }
}

export async function hostCodeRequired(roundId: string): Promise<boolean> {
  if (isDemo) return !!demoRound(roundId)?.host_code
  const { data, error } = await db().rpc('round_needs_host_code', { p_round: roundId })
  if (error) throw error
  return data === true
}

export async function checkHostCode(roundId: string, code: string): Promise<boolean> {
  const entered = code.trim().toUpperCase()
  if (!entered) return false
  if (isDemo) return demoRound(roundId)?.host_code?.toUpperCase() === entered
  const { data, error } = await db().rpc('round_host_code_ok', { p_round: roundId, p_code: entered })
  if (error) throw error
  return data === true
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
    .select(`${ROUND_COLUMNS}, submissions(count)`)
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
  const { data, error } = await db().from('rounds').select(ROUND_COLUMNS).eq('id', id).maybeSingle()
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
