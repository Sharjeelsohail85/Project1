import { createTheme } from '@mui/material/styles'

export const SIGNUP_UI_TOKENS = {
  HEADER_HEIGHT: 60,
  HEADER_BG: '#673ab7',

  OVERLAY_BG: '#678293',

  TITLE_FONT_SIZE: 46,
  TITLE_FONT_WEIGHT: 500,
  TITLE_LINE_HEIGHT: 1.15,
  TITLE_COLOR: '#f4f7fa',

  SUBTITLE_FONT_SIZE: 32,
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
  typography: {
    fontFamily: "'Roboto', Roboto, sans-serif",
    h2: {
      fontSize: `${SIGNUP_UI_TOKENS.TITLE_FONT_SIZE}px`,
      fontWeight: SIGNUP_UI_TOKENS.TITLE_FONT_WEIGHT,
      lineHeight: SIGNUP_UI_TOKENS.TITLE_LINE_HEIGHT,
      letterSpacing: 0,
    },
    body1: {
      fontSize: `${SIGNUP_UI_TOKENS.SUBTITLE_FONT_SIZE}px`,
      fontWeight: SIGNUP_UI_TOKENS.SUBTITLE_FONT_WEIGHT,
      lineHeight: SIGNUP_UI_TOKENS.SUBTITLE_LINE_HEIGHT,
      letterSpacing: 0,
    },
  },
  palette: {
    primary: {
      main: SIGNUP_UI_TOKENS.HEADER_BG,
    },
    background: {
      default: SIGNUP_UI_TOKENS.OVERLAY_BG,
      paper: SIGNUP_UI_TOKENS.CARD_BG,
    },
  },
})

export default signupTheme
