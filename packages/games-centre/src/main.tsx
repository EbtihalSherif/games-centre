import React from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { AppBackground, theme } from '@games/core'
import '@games/core/styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBackground />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
