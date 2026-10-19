import { Box } from '@mui/material'
import { keyframes } from '@emotion/react'
import { palette } from './theme'

const drift = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  33%      { transform: translate3d(5vw, -6vh, 0) scale(1.18); }
  66%      { transform: translate3d(-4vw, 5vh, 0) scale(.9); }
`

const twinkle = keyframes`
  0%, 100% { opacity: .35; }
  50%      { opacity: .75; }
`

type BlobProps = {
  color: string
  size: string
  top: string
  left: string
  duration: number
  delay?: number
}

function Blob({ color, size, top, left, duration, delay = 0 }: BlobProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${color} 0%, transparent 70%)`,
        filter: 'blur(40px)',
        opacity: 0.55,
        animation: `${drift} ${duration}s ease-in-out ${delay}s infinite`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    />
  )
}

/** Drifting colour blobs behind the whole app. Purely decorative. */
export function AppBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <Blob color={palette.pink} size="46vmax" top="-12vh" left="-10vw" duration={26} />
      <Blob color={palette.sky} size="38vmax" top="45vh" left="58vw" duration={32} delay={-6} />
      <Blob color={palette.sunshine} size="30vmax" top="62vh" left="-8vw" duration={28} delay={-12} />
      <Blob color={palette.mint} size="26vmax" top="4vh" left="62vw" duration={34} delay={-18} />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(255,255,255,.55) 1px, transparent 1px), radial-gradient(rgba(255,255,255,.35) 1px, transparent 1px)',
          backgroundSize: '120px 120px, 190px 190px',
          backgroundPosition: '0 0, 60px 80px',
          animation: `${twinkle} 7s ease-in-out infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.4 },
        }}
      />
    </Box>
  )
}
