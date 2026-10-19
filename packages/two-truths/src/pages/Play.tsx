import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { confetti, Link, palette, shuffleSeeded } from '@games/core'
import { listPlayers, startPlay, finishRound } from '../lib/store'
import type { Href } from '../Game'
import type { Statement, Submission } from '../types'

type ShownStatement = Statement & { orig: number }
type Player = Submission & { shown: ShownStatement[] }

export default function Play({ href, roundId }: { href: Href; roundId: string }) {
  const [people, setPeople] = useState<Submission[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [players, setPlayers] = useState<Player[] | null>(null) // null = setup screen
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ right: 0, guessed: 0 })
  const [finished, setFinished] = useState(false)

  function load() {
    setPeople(null)
    setLoadError('')
    listPlayers(roundId)
      .then(setPeople)
      .catch(() => setLoadError("We couldn't load the players. Check your connection and try again."))
  }
  useEffect(load, [roundId])

  function start(shuffle: boolean) {
    const chosen = shuffle ? shuffleSeeded(people ?? [], Date.now()) : (people ?? [])
    setPlayers(
      chosen.map((p) => ({
        ...p,
        // statements shown in a stable random order so the lie isn't always in the same slot
        shown: shuffleSeeded([0, 1, 2], p.id).map((i) => ({ ...p.statements[i]!, orig: i })),
      }))
    )
    setIdx(0)
    setGuess(null)
    setRevealed(false)
    setScore({ right: 0, guessed: 0 })
    setFinished(false)

    // History only; a failure here must never stop people playing.
    startPlay(roundId, { playerIds: chosen.map((p) => p.id), shuffled: shuffle }).catch(() => {})
  }

  // ---------- setup ----------
  if (!players) {
    if (loadError)
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>
          <Button onClick={load}>Try again</Button>
        </Paper>
      )
    if (!people)
      return (
        <Stack alignItems="center" spacing={2} sx={{ py: 6 }} role="status">
          <CircularProgress />
          <Typography>Loading players…</Typography>
        </Stack>
      )
    if (!people.length)
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '3.5rem' }} aria-hidden>👻</Typography>
          <Typography variant="h1" gutterBottom>No one has joined this round</Typography>
          <Typography color="text.secondary">Add some players first, then come back and play.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button component={Link} to={href(`/round/${roundId}/add`)}>Add a player</Button>
            <Button variant="outlined" onClick={load}>Refresh</Button>
          </Stack>
        </Paper>
      )
    return <Setup people={people} onStart={start} onRefresh={load} href={href} roundId={roundId} />
  }

  if (finished)
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '4rem' }} aria-hidden>🏆</Typography>
        <Typography variant="h1" gutterBottom>That's everyone!</Typography>
        {score.guessed > 0 && (
          <Chip
            color="secondary"
            sx={{ fontSize: '1.1rem', py: 2.5, px: 1 }}
            label={`You spotted ${score.right} of ${score.guessed} lies`}
          />
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Button onClick={() => setPlayers(null)}>Play again</Button>
          <Button component={Link} to={href(`/round/${roundId}`)} variant="outlined">Back to the round</Button>
        </Stack>
      </Paper>
    )

  const p = players[idx]!
  const lieIdx = p.shown.findIndex((s) => !s.truth)
  const verdict = revealed && guess !== null ? (guess === lieIdx ? 'correct' : 'wrong') : null

  function reveal() {
    setRevealed(true)
    if (guess !== null) setScore((s) => ({ right: s.right + (guess === lieIdx ? 1 : 0), guessed: s.guessed + 1 }))
    confetti()
  }
  function next() {
    if (idx + 1 >= players!.length) {
      finishRound(roundId, { liesSpotted: score.right, liesGuessed: score.guessed }).catch(() => {})
      return setFinished(true)
    }
    setIdx(idx + 1)
    setGuess(null)
    setRevealed(false)
    window.scrollTo(0, 0)
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'start',
        gridTemplateColumns: revealed && p.bonus?.length ? { xs: '1fr', md: '1.1fr 1fr' } : '1fr',
      }}
    >
      <Paper component="section" aria-labelledby="who" sx={{ overflow: 'hidden' }}>
        <LinearProgress
          variant="determinate"
          value={((idx + 1) / players.length) * 100}
          sx={{ borderRadius: 0 }}
        />
        <Stack spacing={2} sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }} alignItems="center">
          <Typography color="text.secondary" variant="body2">
            Player {idx + 1} of {players.length}
          </Typography>
          <Avatar
            src={p.photo_url}
            alt={`Photo of ${p.name}`}
            sx={{ width: 150, height: 150, border: '5px solid', borderColor: 'primary.light' }}
          />
          <Typography id="who" variant="h1">{p.name}</Typography>
          <Typography color="text.secondary">
            {revealed ? 'Here is the truth.' : 'Which one is the lie? Tap a statement.'}
          </Typography>

          <Stack spacing={1.5} sx={{ width: '100%' }} component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {p.shown.map((s, i) => {
              const chosen = guess === i
              const bg = revealed
                ? s.truth
                  ? 'success.main'
                  : 'error.main'
                : chosen
                  ? 'primary.main'
                  : '#F6F1FF'
              const fg = revealed || chosen ? '#fff' : 'text.primary'
              return (
                <ButtonBase
                  key={i}
                  component="li"
                  onClick={() => !revealed && setGuess(i)}
                  aria-pressed={chosen}
                  disabled={revealed}
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    p: 2,
                    borderRadius: 4,
                    bgcolor: bg,
                    color: fg,
                    textAlign: 'left',
                    fontWeight: 600,
                    transition: 'transform .15s ease',
                    '&:hover': { transform: revealed ? 'none' : 'translateY(-2px)' },
                    '&.Mui-disabled': { opacity: 1, color: fg },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      flex: '0 0 auto',
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      bgcolor: revealed || chosen ? 'rgba(255,255,255,.25)' : '#fff',
                    }}
                  >
                    {'ABC'[i]}
                  </Box>
                  <Box flex={1}>{s.text}</Box>
                  {revealed && (
                    <Box sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{s.truth ? '✅ Truth' : '😈 Lie'}</Box>
                  )}
                </ButtonBase>
              )
            })}
          </Stack>

          {revealed && (
            <Alert
              severity={verdict === 'correct' ? 'success' : verdict === 'wrong' ? 'error' : 'info'}
              sx={{ width: '100%' }}
              role="status"
            >
              {verdict === 'correct' && 'You got it! 🎯 '}
              {verdict === 'wrong' && 'Not this time. 🙈 '}
              The lie was: {p.shown[lieIdx]?.text}
            </Alert>
          )}

          {!revealed ? (
            <Button size="large" fullWidth onClick={reveal}>Reveal the lie!</Button>
          ) : (
            <Button size="large" fullWidth color="secondary" onClick={next} autoFocus>
              {idx + 1 >= players.length ? 'See results' : 'Next player'}
            </Button>
          )}
        </Stack>
      </Paper>

      {revealed && p.bonus?.length > 0 && (
        <Box
          component="aside"
          aria-label={`Bonus photos from ${p.name}`}
          sx={{ bgcolor: 'rgba(255,255,255,.14)', borderRadius: 6, p: 3, backdropFilter: 'blur(6px)' }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>Bonus photos</Typography>
          {p.bonus.map((b, i) => (
            <Box component="figure" key={i} sx={{ m: 0, mb: 2 }}>
              <Box
                component="img"
                src={b.url}
                alt={b.caption || `Bonus photo ${i + 1} from ${p.name}`}
                sx={{
                  width: '100%',
                  maxHeight: 480,
                  objectFit: 'contain',
                  borderRadius: 4,
                  bgcolor: 'rgba(0,0,0,.25)',
                  display: 'block',
                }}
              />
              {(b.caption || b.statement !== null) && (
                <Typography component="figcaption" sx={{ mt: 1, fontWeight: 700 }}>
                  {b.caption}
                  {b.caption && b.statement !== null && ' · '}
                  {b.statement !== null && (
                    <Typography component="span" sx={{ color: '#E1D6F7', fontWeight: 400 }}>
                      about: “{p.statements[b.statement]?.text}”
                    </Typography>
                  )}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

type SetupProps = {
  people: Submission[]
  onStart: (shuffle: boolean) => void
  onRefresh: () => void
  href: Href
  roundId: string
}

function Setup({ people, onStart, onRefresh, href, roundId }: SetupProps) {
  const [shuffle, setShuffle] = useState(true)
  return (
    <Paper component="section" aria-labelledby="setup-h" sx={{ overflow: 'hidden' }}>
      <Box sx={{ height: 10, backgroundImage: `linear-gradient(90deg, ${palette.sunshine}, ${palette.coral}, ${palette.pink})` }} />
      <Stack spacing={3} sx={{ p: { xs: 3, sm: 4 } }}>
        <Box>
          <Button component={Link} to={href(`/round/${roundId}`)} variant="text" size="small" sx={{ ml: -1.5, mb: 1 }}>
            ← Back to the round
          </Button>
          <Typography id="setup-h" variant="h1">Ready to play? 🎯</Typography>
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography color="text.secondary">
            {people.length} {people.length === 1 ? 'player is' : 'players are'} in this round.
          </Typography>
          <Button size="small" variant="outlined" onClick={onRefresh}>Refresh list</Button>
        </Stack>

        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {people.map((p) => (
            <Stack
              key={p.id}
              component="li"
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ bgcolor: '#F6F1FF', borderRadius: 999, pl: 0.75, pr: 2, py: 0.75 }}
            >
              <Avatar src={p.photo_url} alt="" sx={{ width: 40, height: 40 }} />
              <Typography fontWeight={700}>{p.name}</Typography>
            </Stack>
          ))}
        </Stack>

        <FormControlLabel
          control={<Switch checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />}
          label="Shuffle the order of players"
        />
        <Button size="large" onClick={() => onStart(shuffle)}>Start the game</Button>
      </Stack>
    </Paper>
  )
}
