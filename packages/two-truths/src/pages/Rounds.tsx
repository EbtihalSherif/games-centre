import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link, navigate, palette } from '@games/core'
import { createRound, listRounds } from '../lib/store'
import { roundLabel } from '../lib/round'
import type { Href } from '../Game'
import type { RoundSummary } from '../types'

export default function Rounds({ href }: { href: Href }) {
  const [rounds, setRounds] = useState<RoundSummary[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setRounds(null)
    setLoadError('')
    listRounds()
      .then(setRounds)
      .catch(() => setLoadError("We couldn't load your rounds. Check your connection and try again."))
  }
  useEffect(load, [])

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const round = await createRound(name)
      navigate(href(`/round/${round.round.id}`))
    } catch {
      setError("We couldn't start that round. Please try again.")
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'start',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.15fr)' },
      }}
    >
      <Paper component="form" onSubmit={create} aria-labelledby="new-h" sx={{ overflow: 'hidden' }}>
        <Box sx={{ height: 10, backgroundImage: `linear-gradient(90deg, ${palette.violet}, ${palette.pink}, ${palette.sunshine}, ${palette.mint})` }} />
        <Stack spacing={2} sx={{ p: { xs: 3, sm: 4 } }}>
          <Box>
            <Typography id="new-h" variant="h1">😈 Start a new round</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Name the round, then share the link with your players. Three or four people per round works best.
            </Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            id="round-name"
            label="Round name (optional)"
            placeholder="Friday team call"
            value={name}
            onChange={(e) => setName(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 80 } }}
          />
          <Button type="submit" size="large" disabled={busy} aria-busy={busy}>
            {busy ? 'Starting…' : 'Create round'}
          </Button>
        </Stack>
      </Paper>

      <Paper component="section" aria-labelledby="past-h" sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography id="past-h" variant="h2">Earlier rounds</Typography>
          <Button size="small" variant="outlined" onClick={load}>Refresh</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />

        {loadError && <Alert severity="error">{loadError}</Alert>}
        {!rounds && !loadError && (
          <Stack direction="row" spacing={1.5} alignItems="center" role="status" sx={{ py: 1 }}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Loading rounds…</Typography>
          </Stack>
        )}
        {rounds?.length === 0 && (
          <Typography color="text.secondary">No rounds yet. Your first one is above. 🎉</Typography>
        )}

        {rounds && rounds.length > 0 && (
          <List disablePadding sx={{ display: 'grid', gap: 1.5 }}>
            {rounds.map((r) => (
              <ListItem key={r.id} disablePadding>
                <ListItemButton
                  component={Link}
                  to={href(`/round/${r.id}`)}
                  sx={{ borderRadius: '16px', bgcolor: '#F6F1FF', py: 1.5, '&:hover': { bgcolor: '#EDE3FF' } }}
                >
                  <ListItemText
                    primary={roundLabel(r)}
                    secondary={`${r.players} ${r.players === 1 ? 'player' : 'players'}`}
                    slotProps={{ primary: { variant: 'subtitle1' } }}
                  />
                  <Chip
                    size="small"
                    color={r.finished_at ? 'success' : 'secondary'}
                    variant={r.finished_at ? 'filled' : 'outlined'}
                    label={r.finished_at ? `${r.lies_spotted}/${r.lies_guessed} lies spotted` : 'Not played yet'}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  )
}
