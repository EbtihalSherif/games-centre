import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Every package reads the one .env at the repo root.
const rootDir = fileURLToPath(new URL('../..', import.meta.url))

// Builds twice over: a standalone app at index.html (handy for working on this
// game alone) and a federated remote the games centre loads at runtime.
export default defineConfig({
  envDir: rootDir,
  plugins: [
    react(),
    federation({
      name: 'two_truths',
      filename: 'remoteEntry.js',
      exposes: { './Game': './src/Game.tsx' },
      shared: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
    }),
  ],
  server: { port: 5174, cors: true },
  preview: { port: 4174, cors: true },
  // This repo lives in OneDrive, which locks files and makes Vite's dep cache fail to rename.
  cacheDir: join(tmpdir(), 'vite-games-centre', 'two-truths'),
  // Linked workspace package: exclude it from pre-bundling but pre-bundle what it pulls in,
  // otherwise Vite re-optimises mid-session and the page reload-loops.
  optimizeDeps: {
    exclude: ['@games/core'],
    include: ['@games/core/data > @supabase/supabase-js'],
  },
  // Required by vite-plugin-federation: the remote entry must stay unminified top-level await.
  build: { target: 'esnext', minify: false, cssCodeSplit: false },
})
