import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material'
import { Link, palette } from '@games/core'
import { games } from '../games'

export default function Home() {
  return (
    <Box component="section" aria-labelledby="home-h">
      <Typography id="home-h" variant="h1" sx={{ mb: 3 }}>Pick a game</Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(260px, 1fr))' },
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
                <Typography sx={{ fontSize: '3.2rem', lineHeight: 1 }} aria-hidden>{g.emoji}</Typography>
                <Typography variant="h2">{g.title}</Typography>
                <Typography color="text.secondary">{g.blurb}</Typography>
              </Stack>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
