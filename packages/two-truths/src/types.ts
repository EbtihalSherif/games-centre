export type Statement = {
  text: string
  truth: boolean
}

export type BonusPhoto = {
  url: string
  caption: string
  /** Index of the statement this photo belongs to, or null for a standalone extra. */
  statement: number | null
}

export type Submission = {
  id: string
  round_id: string
  name: string
  photo_url: string
  statements: Statement[]
  bonus: BonusPhoto[]
  created_at: string
}

export type NewSubmission = Omit<Submission, 'id' | 'created_at'>

export type Round = {
  id: string
  name: string | null
  /** Order the players were shown in, recorded when the round is played. */
  player_ids: string[]
  shuffled: boolean
  lies_spotted: number
  lies_guessed: number
  created_at: string
  finished_at: string | null
}

export type RoundSummary = Round & { players: number }
