import { Suspense } from 'react'
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { ErrorBoundary, Link, usePath } from '@games/core'
import { gameFor, type Game } from './games'
import Home from './pages/Home'

export default function App() {
  const path = usePath()
  const game = gameFor(path)

  return (
    <>
      <Box
        component="a"
        href="#main"
        sx={{
          position: 'absolute',
          left: 8,
          top: -60,
          zIndex: 'tooltip',
          px: 2,
          py: 1,
          borderRadius: '10px',
          bgcolor: '#fff',
          color: '#000',
          '&:focus': { top: 8 },
        }}
      >
        Skip to content
      </Box>

      <AppBar position="static" elevation={0} color="transparent">
        <Container maxWidth="lg" disableGutters>
          <Toolbar sx={{ gap: 2, flexWrap: 'wrap', px: { xs: 2, sm: 3 } }}>
            <Typography
              component={Link}
              to="/"
              variant="h2"
              sx={{ flexGrow: 1, color: '#fff', textDecoration: 'none' }}
            >
              🎲 Games Centre
            </Typography>
            {game && (
              <Stack direction="row" spacing={1} component="nav" aria-label="Main">
                <Button component={Link} to="/" variant="text" sx={{ color: '#fff' }}>
                  All games
                </Button>
                <Button component={Link} to={game.basePath} variant="contained" aria-current="page">
                  {game.title}
                </Button>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        component="main"
        id="main"
        tabIndex={-1}
        maxWidth="lg"
        sx={{ py: { xs: 2, md: 3 }, pb: { xs: 8, md: 10 }, outline: 'none' }}
      >
        {game ? (
          <ErrorBoundary key={game.id} fallback={<GameUnavailable game={game} />}>
            <Suspense fallback={<Loading title={game.title} />}>
              <game.load basePath={game.basePath} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <Home />
        )}
      </Container>
    </>
  )
}

function Loading({ title }: { title: string }) {
  return (
    <Stack alignItems="center" spacing={2} sx={{ py: 8 }} role="status">
      <CircularProgress sx={{ color: '#fff' }} />
      <Typography>Loading {title}…</Typography>
    </Stack>
  )
}

function GameUnavailable({ game }: { game: Game }) {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography sx={{ fontSize: '3.5rem' }} aria-hidden>🔌</Typography>
      <Typography variant="h1" gutterBottom>{game.title} isn't available</Typography>
      <Typography color="text.secondary">
        That game couldn't be loaded. It may be mid-deploy — try again in a moment.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
        <Button onClick={() => window.location.reload()}>Try again</Button>
        <Button component={Link} to="/" variant="outlined">Back to all games</Button>
      </Stack>
    </Paper>
  )
}
