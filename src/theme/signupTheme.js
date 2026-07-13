import { createTheme } from '@mui/material/styles'

export const SIGNUP_UI_TOKENS = {
  HEADER_HEIGHT: 60,
  HEADER_BG: '#673ab7',

  OVERLAY_BG: '#678293',

  TITLE_FONT_SIZE: 15,
  TITLE_FONT_WEIGHT: 500,
  TITLE_LINE_HEIGHT: 1.15,
  TITLE_COLOR: '#f4f7fa',

  SUBTITLE_FONT_SIZE: 8,
  SUBTITLE_FONT_WEIGHT: 400,
  SUBTITLE_LINE_HEIGHT: 1.3,
  SUBTITLE_COLOR: 'rgba(236, 243, 247, 0.90)',

  CARD_WIDTH: 450,
  CARD_HEIGHT: 58,
  CARD_BG: '#ececef',
  CARD_RADIUS: 2,
  CARD_SHADOW: '0 2px 5px rgba(0, 0, 0, 0.16)',

  INPUT_ICON_SIZE: 28,
  INPUT_ICON_COLOR: '#5f7183',
  INPUT_FONT_SIZE: 29,
  INPUT_TEXT_COLOR: '#5f7183',

  AUTH_ICON_SIZE: 56,
  AUTH_ICON_COLOR: '#f4f7fa',
  AUTH_DIVIDER_WIDTH: 2,
  AUTH_DIVIDER_HEIGHT: 62,
  AUTH_DIVIDER_COLOR: 'rgba(244, 247, 250, 0.66)',

  CLOSE_NEXT_ICON_SIZE: 40,
}

const signupTheme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: "'Roboto', Roboto, sans-serif",
    h1: { fontSize: '2.5rem', fontWeight: 500, lineHeight: 1.2 },
    h2: {
      fontSize: `${SIGNUP_UI_TOKENS.TITLE_FONT_SIZE}px`,
      fontWeight: SIGNUP_UI_TOKENS.TITLE_FONT_WEIGHT,
      lineHeight: SIGNUP_UI_TOKENS.TITLE_LINE_HEIGHT,
      letterSpacing: 0,
    },
    h3: { fontSize: '1.75rem', fontWeight: 500, lineHeight: 1.25 },
    h4: { fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.3 },
    h5: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.33 },
    h6: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.4 },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.43 },
    button: { textTransform: 'none', fontWeight: 500, fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.33 },
    overline: { fontSize: '0.6875rem', fontWeight: 500, letterSpacing: 0.08333 },
  },
  palette: {
    primary: {
      main: SIGNUP_UI_TOKENS.HEADER_BG,
      light: '#9575cd',
      dark: '#311b92',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#03dac6',
      light: '#66fff8',
      dark: '#00a3a0',
      contrastText: '#000000',
    },
    error: {
      main: '#b00020',
      light: '#f44336',
      dark: '#7f0000',
      contrastText: '#ffffff',
    },
    background: {
      default: SIGNUP_UI_TOKENS.OVERLAY_BG,
      paper: SIGNUP_UI_TOKENS.CARD_BG,
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: "'Roboto', sans-serif",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'background-color 200ms ease, box-shadow 200ms ease',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: SIGNUP_UI_TOKENS.HEADER_BG,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
  },
})

export default signupTheme
