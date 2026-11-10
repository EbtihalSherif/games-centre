import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Every package reads the one .env at the repo root.
const rootDir = fileURLToPath(new URL('../..', import.meta.url))

// Each game is deployed on its own origin. Point the shell at them with env vars
// (Vercel > shell project > Environment Variables); the defaults are the local
// `npm run dev` ports.
const remote = (origin: string) => `${origin.replace(/\/+$/, '')}/assets/remoteEntry.js`

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')
  return {
    envDir: rootDir,
    plugins: [
      react(),
      federation({
        name: 'games_centre',
        remotes: {
          two_truths: remote(env.VITE_GAME_TWO_TRUTHS_URL || 'http://localhost:4174'),
        },
        shared: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
      }),
    ],
    server: { port: 5173 },
    preview: { port: 4173 },
    // This repo lives in OneDrive, which locks files and makes Vite's dep cache fail to rename.
    cacheDir: join(tmpdir(), 'vite-games-centre', 'centre'),
    optimizeDeps: { exclude: ['@games/core'] },
    build: { target: 'esnext', minify: false as const, cssCodeSplit: false },
  }
})
