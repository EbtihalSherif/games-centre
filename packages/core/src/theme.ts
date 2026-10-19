import { createTheme } from '@mui/material'

const display = "'Baloo 2', 'Poppins', system-ui, sans-serif"
const body = "'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

/** Playful confetti palette, reused by the shell and every game. */
export const palette = {
  violet: '#8B5CF6',
  grape: '#5B1F8F',
  midnight: '#2A1458',
  pink: '#FF4FC3',
  coral: '#FF6B6B',
  sunshine: '#FFC933',
  mint: '#2DD4A7',
  sky: '#38BDF8',
}

export const theme = createTheme({
  palette: {
    primary: { main: palette.violet, dark: '#6D28D9', light: '#A98BFF', contrastText: '#fff' },
    secondary: { main: palette.pink, contrastText: '#fff' },
    success: { main: '#0FA678' },
    warning: { main: palette.sunshine },
    error: { main: '#F43F5E' },
    info: { main: '#0EA5E9' },
    background: { paper: '#fff', default: palette.midnight },
    text: { primary: '#1D1530', secondary: '#6B6286' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: body,
    h1: { fontFamily: display, fontWeight: 800, fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', lineHeight: 1.12 },
    h2: { fontFamily: display, fontWeight: 700, fontSize: '1.3rem' },
    h3: { fontFamily: display, fontWeight: 700, fontSize: '1.1rem' },
    button: { fontFamily: display, fontWeight: 700, textTransform: 'none', fontSize: '1rem' },
    subtitle1: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          color: '#fff',
          background: `radial-gradient(1200px 800px at 10% -10%, ${palette.grape} 0%, transparent 55%),
                       radial-gradient(900px 700px at 110% 10%, #3B1D7A 0%, transparent 60%),
                       linear-gradient(165deg, ${palette.midnight} 0%, #3C1670 55%, #571A96 100%)`,
          backgroundAttachment: 'fixed',
        },
        '::selection': { background: palette.sunshine, color: palette.midnight },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 26 },
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { variant: 'contained', disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 48,
          paddingInline: 26,
          transition: 'transform .15s ease, box-shadow .15s ease, filter .15s ease',
          '&:hover': { transform: 'translateY(-2px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        contained: { boxShadow: '0 10px 24px rgba(91, 31, 143, .32)' },
        containedPrimary: {
          backgroundImage: `linear-gradient(135deg, ${palette.violet} 0%, ${palette.pink} 100%)`,
          '&:hover': { filter: 'brightness(1.06)', transform: 'translateY(-2px)' },
        },
        containedSecondary: {
          backgroundImage: `linear-gradient(135deg, ${palette.pink} 0%, ${palette.coral} 100%)`,
        },
        outlined: { borderWidth: 2, '&:hover': { borderWidth: 2 } },
        sizeLarge: { minHeight: 56, fontSize: '1.08rem' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700, borderRadius: 999 } },
    },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          background: '#FBF9FF',
          '& fieldset': { borderWidth: 2, borderColor: '#DED3F5' },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 16, fontWeight: 600 } } },
    MuiCheckbox: { defaultProps: { color: 'secondary' } },
    MuiRadio: { defaultProps: { color: 'secondary' } },
    MuiLinearProgress: { styleOverrides: { root: { height: 10, borderRadius: 999 } } },
  },
})
