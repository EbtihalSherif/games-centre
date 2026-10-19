import React from 'react'
import { createRoot } from 'react-dom/client'
import { Container, CssBaseline, ThemeProvider } from '@mui/material'
import { AppBackground, theme } from '@games/core'
import '@games/core/styles.css'
import Game from './Game'

// Standalone mode: this game served on its own, so it owns the whole URL.
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBackground />
      <Container component="main" id="main" tabIndex={-1} maxWidth="md" sx={{ py: 4, outline: 'none' }}>
        <Game basePath="/" />
      </Container>
    </ThemeProvider>
  </React.StrictMode>
)
