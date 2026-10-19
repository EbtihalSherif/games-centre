import { Alert, Stack, ThemeProvider } from '@mui/material'
import { theme, useSubPath } from '@games/core'
import { isDemo } from '@games/core/data'
import Rounds from './pages/Rounds'
import Round from './pages/Round'
import Submit from './pages/Submit'
import Play from './pages/Play'

/** Builds a URL inside this game, whether it is mounted in the shell or served standalone. */
export type Href = (to: string) => string

// The games centre mounts this; `basePath` is the slice of the URL this game owns.
export default function Game({ basePath = '/two-truths' }: { basePath?: string }) {
  const sub = useSubPath(basePath)
  const href: Href = (to) => (basePath === '/' ? to : basePath + (to === '/' ? '' : to))
  const match = /^\/round\/([^/]+)(?:\/(add|play))?$/.exec(sub)
  const roundId = match?.[1]
  const view = match?.[2]

  // Re-applied here so the game is themed even when loaded as a standalone remote.
  return (
    <ThemeProvider theme={theme}>
      <Stack spacing={3}>
        {isDemo && (
          <Alert severity="warning" variant="filled">
            Demo mode: no Supabase keys found, so everything is saved in this browser only.
          </Alert>
        )}
        {!roundId && <Rounds href={href} />}
        {roundId && view === 'add' && <Submit href={href} roundId={roundId} />}
        {roundId && view === 'play' && <Play href={href} roundId={roundId} />}
        {roundId && !view && <Round href={href} roundId={roundId} />}
      </Stack>
    </ThemeProvider>
  )
}
