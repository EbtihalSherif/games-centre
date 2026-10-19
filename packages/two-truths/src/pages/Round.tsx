import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link, palette } from '@games/core'
import { getRound, listPlayers } from '../lib/store'
import { roundLabel } from '../lib/round'
import type { Href } from '../Game'
import type { Round as RoundType, Submission } from '../types'

export default function Round({ href, roundId }: { href: Href; roundId: string }) {
  const [round, setRound] = useState<RoundType | null>(null)
  const [players, setPlayers] = useState<Submission[] | null>(null)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)

  function load() {
    setError('')
    Promise.all([getRound(roundId), listPlayers(roundId)])
      .then(([r, p]) => {
        if (!r) return setMissing(true)
        setRound(r)
        setPlayers(p)
      })
      .catch(() => setError("We couldn't load this round. Check your connection and try again."))
  }
  useEffect(load, [roundId])

  if (missing)
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '3.5rem' }} aria-hidden>🤔</Typography>
        <Typography variant="h1" gutterBottom>That round is gone</Typography>
        <Typography color="text.secondary">We couldn't find a round with that link.</Typography>
        <Button component={Link} to={href('/')} sx={{ mt: 3 }}>All rounds</Button>
      </Paper>
    )

  if (error)
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={load}>Try again</Button>
      </Paper>
    )

  if (!round || !players)
    return (
      <Stack alignItems="center" spacing={2} sx={{ py: 6 }} role="status">
        <CircularProgress />
        <Typography>Loading round…</Typography>
      </Stack>
    )

  const ready = players.length >= 2
  const inviteUrl = window.location.origin + href(`/round/${roundId}`)

  return (
    <Paper component="section" aria-labelledby="round-h" sx={{ overflow: 'hidden' }}>
      <Box sx={{ height: 10, backgroundImage: `linear-gradient(90deg, ${palette.sky}, ${palette.violet}, ${palette.pink})` }} />
      <Stack spacing={3} sx={{ p: { xs: 3, sm: 4 } }}>
        <Box>
          <Button component={Link} to={href('/')} variant="text" size="small" sx={{ ml: -1.5, mb: 1 }}>
            ← All rounds
          </Button>
          <Typography id="round-h" variant="h1">{roundLabel(round)}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
            <Chip color="primary" label={`${players.length} ${players.length === 1 ? 'player' : 'players'}`} />
            {round.finished_at && (
              <Chip color="success" label={`${round.lies_spotted} of ${round.lies_guessed} lies spotted`} />
            )}
          </Stack>
        </Box>

        <Invite url={inviteUrl} />

        {players.length === 0 ? (
          <Typography color="text.secondary">
            No players yet — send the invite link and they can add themselves. 👆
          </Typography>
        ) : (
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {players.map((p) => (
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
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button component={Link} to={href(`/round/${roundId}/add`)} size="large" fullWidth>
            Add yourself
          </Button>
          <Button
            component={Link}
            to={href(`/round/${roundId}/play`)}
            size="large"
            fullWidth
            color="secondary"
            disabled={!ready}
            sx={ready ? undefined : { pointerEvents: 'none' }}
            aria-disabled={!ready}
          >
            {round.finished_at ? 'Play again' : 'Play this round'}
          </Button>
        </Stack>
        {!ready && (
          <Typography color="text.secondary" variant="body2" textAlign="center">
            Add at least two players to start playing.
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}

function Invite({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Clipboard can be blocked; the field stays selectable as a fallback.
    }
  }

  return (
    <Box sx={{ bgcolor: '#F6F1FF', borderRadius: 4, p: 2.5 }}>
      <Typography variant="h3" gutterBottom>🔗 Invite link</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
        Send this to your players so they can add themselves to this round.
      </Typography>
      <TextField
        id="invite-url"
        aria-label="Invite link"
        value={url}
        onFocus={(e) => e.target.select()}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={copy} aria-label="Copy invite link" edge="end">
                  📋
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Link copied"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
