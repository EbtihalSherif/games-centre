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
import { keyframes } from '@emotion/react'
import { confetti, Link, palette, shuffleSeeded } from '@games/core'
import { listPlayers, startPlay, finishRound } from '../lib/store'
import type { Href } from '../Game'
import type { Statement, Submission } from '../types'

type ShownStatement = Statement & { orig: number }
type Player = Submission & { shown: ShownStatement[] }

// Reveal palette, kept literal so the cards match the game's own look rather
// than the shared theme's softer success/error tones.
const card = { ink: '#2d3748', truth: '#2ecc71', lie: '#e74c3c' }
const reveal_bg = { idle: 'rgba(255,255,255,0.97)', chosen: 'rgba(255,255,255,0.97)', truth: card.truth, lie: card.lie }
const reveal_border = { idle: 'transparent', chosen: '#ff6ec7', truth: '#1e9e56', lie: '#c0392b' }
const letter_bg = { idle: '#7b2ff7', chosen: '#ff6ec7', truth: '#1e9e56', lie: '#c0392b' }

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
`
const spookyShake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px) rotate(-1deg); }
  40% { transform: translateX(6px) rotate(1deg); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
`
const popIn = keyframes`
  from { opacity: 0; transform: scale(.85); }
  to   { opacity: 1; transform: scale(1); }
`
const polaroidPop = keyframes`
  from { opacity: 0; transform: rotate(var(--tilt, -4deg)) scale(.6); }
  to   { opacity: 1; transform: rotate(var(--tilt, -4deg)) scale(1); }
`

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
        gridTemplateColumns: revealed && p.bonus?.length ? { xs: '1fr', md: 'minmax(0, 1.1fr) auto' } : '1fr',
      }}
    >
      <Paper component="section" aria-labelledby="who" sx={{ overflow: 'hidden', width: '100%', maxWidth: 680, mx: 'auto' }}>
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

          <Stack spacing={1.75} sx={{ width: '100%' }} component="ul" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {p.shown.map((s, i) => {
              const chosen = guess === i
              const state = revealed ? (s.truth ? 'truth' : 'lie') : chosen ? 'chosen' : 'idle'
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
                    px: 2.5,
                    py: 2.25,
                    borderRadius: '18px',
                    border: '3px solid transparent',
                    bgcolor: reveal_bg[state],
                    color: state === 'idle' || state === 'chosen' ? card.ink : '#fff',
                    borderColor: reveal_border[state],
                    boxShadow: '0 8px 22px rgba(0,0,0,0.22)',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '1.02rem',
                    lineHeight: 1.4,
                    animation: `${slideIn} .45s ease backwards`,
                    animationDelay: `${0.05 + i * 0.1}s`,
                    transition: 'transform .15s ease, border-color .2s ease, box-shadow .2s ease',
                    '&:hover': revealed ? undefined : { transform: 'translateY(-3px)', boxShadow: '0 12px 28px rgba(0,0,0,0.3)' },
                    '&.Mui-disabled': { opacity: 1, color: '#fff' },
                    ...(state === 'lie' && {
                      animation: `${spookyShake} .6s ease`,
                      boxShadow: '0 0 40px rgba(255, 110, 199, 0.7)',
                    }),
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      flex: '0 0 auto',
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: '.95rem',
                      color: '#fff',
                      bgcolor: letter_bg[state],
                    }}
                  >
                    {'ABC'[i]}
                  </Box>
                  <Box flex={1}>{s.text}</Box>
                  {revealed && (
                    <Box sx={{ fontSize: '1.3rem', ml: 'auto' }} aria-label={s.truth ? 'Truth' : 'Lie'}>
                      {s.truth ? '✅' : '😈'}
                    </Box>
                  )}
                </ButtonBase>
              )
            })}
          </Stack>

          {revealed && (
            <Box
              role="status"
              sx={{
                width: '100%',
                mt: 1,
                px: 2.5,
                py: 1.5,
                borderRadius: '16px',
                fontWeight: 800,
                fontSize: '1.15rem',
                color: '#fff',
                textShadow: '0 1px 4px rgba(0,0,0,0.25)',
                border: '2px solid',
                bgcolor: verdict === 'correct' ? card.truth : card.lie,
                borderColor: verdict === 'correct' ? '#1e9e56' : '#c0392b',
                animation: `${popIn} .4s ease`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            >
              {verdict === 'correct' && 'You got it! 🎯 '}
              {verdict === 'wrong' && 'Not this time. 🙈 '}
              The lie was: {p.shown[lieIdx]?.text}
            </Box>
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
        <Stack
          component="aside"
          aria-label={`Exhibits from ${p.name}`}
          alignItems="center"
          sx={{
            flexDirection: { xs: 'row', md: 'column' },
            flexWrap: 'wrap',
            justifyContent: 'center',
            rowGap: 3,
            columnGap: 3,
          }}
        >
          {p.bonus.map((b, i) => {
            // b.statement indexes the original order, but players see the shuffled one.
            const shownPos = b.statement === null ? -1 : p.shown.findIndex((s) => s.orig === b.statement)
            const caption = b.caption || (shownPos >= 0 ? `exhibit ${'ABC'[shownPos]}` : 'side quest')
            const tilt = `${(i % 2 === 0 ? -1 : 1) * (3 + ((i * 7) % 5))}deg`
            return (
              <Box
                component="figure"
                key={i}
                sx={{
                  m: 0,
                  bgcolor: '#fff',
                  p: '14px 14px 34px 14px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 26px rgba(0,0,0,0.45)',
                  position: 'relative',
                  '--tilt': tilt,
                  transform: 'rotate(var(--tilt))',
                  animation: `${polaroidPop} .5s cubic-bezier(.26,1.4,.44,1) backwards`,
                  animationDelay: `${i * 0.12}s`,
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
              >
                <Box
                  component="img"
                  src={b.url}
                  alt={b.caption || `Exhibit ${i + 1} from ${p.name}`}
                  sx={{
                    display: 'block',
                    width: 'auto',
                    height: 'auto',
                    maxWidth: { xs: 220, sm: 280 },
                    maxHeight: { xs: 300, sm: 380 },
                    objectFit: 'contain',
                    borderRadius: '4px',
                  }}
                />
                <Box
                  component="figcaption"
                  sx={{
                    position: 'absolute',
                    bottom: 6,
                    left: 0,
                    right: 0,
                    px: 1,
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '.8rem',
                    color: '#8a6a3d',
                    letterSpacing: '.02em',
                  }}
                >
                  {caption}
                </Box>
              </Box>
            )
          })}
        </Stack>
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
    <Paper component="section" aria-labelledby="setup-h" sx={{ overflow: 'hidden', width: '100%', maxWidth: 680, mx: 'auto' }}>
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
