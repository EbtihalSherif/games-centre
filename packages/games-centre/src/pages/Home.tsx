import { Box, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material'
import { Link, palette } from '@games/core'
import { games } from '../games'

const STEPS = [
  { emoji: '🎲', title: 'Pick a game', text: 'Everything runs in the browser — nothing to install.' },
  { emoji: '🔗', title: 'Share the link', text: 'Send it round and everyone adds themselves.' },
  { emoji: '🎉', title: 'Play together', text: 'Reveal the answers on a call or a big screen.' },
]

export default function Home() {
  return (
    <Stack spacing={4} component="section" aria-labelledby="home-h">
      <Box>
        <Typography id="home-h" variant="h1">Pick a game</Typography>
        <Typography sx={{ mt: 1, maxWidth: 560, opacity: 0.85 }}>
          Quick party games for team calls and get-togethers. No accounts, no installs — just share a link.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            // auto-fit so a lone game stretches instead of hugging the left edge
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(240px, 1fr))' },
          }}
        >
          {games.map((g) => (
            <Card
              key={g.id}
              sx={{
                overflow: 'hidden',
                transition: 'transform .18s ease, box-shadow .18s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 22px 50px rgba(0,0,0,.4)' },
                '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
              }}
            >
              <Box sx={{ height: 8, backgroundImage: `linear-gradient(90deg, ${palette.violet}, ${palette.pink}, ${palette.sunshine})` }} />
              <CardActionArea component={Link} to={g.basePath} sx={{ p: 3, height: '100%' }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <Typography sx={{ fontSize: '3.4rem', lineHeight: 1 }} aria-hidden>{g.emoji}</Typography>
                  <Typography variant="h2">{g.title}</Typography>
                  <Typography color="text.secondary">{g.blurb}</Typography>
                  <Chip label="Play now" color="secondary" sx={{ mt: 1 }} />
                </Stack>
              </CardActionArea>
            </Card>
          ))}

          <Box
            aria-hidden
            sx={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 220,
              p: 3,
              textAlign: 'center',
              borderRadius: '26px',
              border: '2px dashed rgba(255,255,255,.35)',
              color: 'rgba(255,255,255,.75)',
            }}
          >
            <Box>
              <Typography sx={{ fontSize: '2.4rem', lineHeight: 1 }}>✨</Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>More games soon</Typography>
            </Box>
          </Box>
        </Box>

        <Box
          component="aside"
          aria-label="How it works"
          sx={{
            bgcolor: 'rgba(255,255,255,.12)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.22)',
            borderRadius: '26px',
            p: 3,
          }}
        >
          <Typography variant="h2" sx={{ mb: 2 }}>How it works</Typography>
          <Stack spacing={2.5} component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {STEPS.map((s, i) => (
              <Stack key={s.title} component="li" direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  aria-hidden
                  sx={{
                    flex: '0 0 auto',
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '1.15rem',
                    bgcolor: 'rgba(255,255,255,.18)',
                  }}
                >
                  {s.emoji}
                </Box>
                <Box>
                  <Typography fontWeight={800}>{i + 1}. {s.title}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{s.text}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Stack>
  )
}
