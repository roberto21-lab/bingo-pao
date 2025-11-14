// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Montserrat',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 900,
    },
    h2: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
    },
    h3: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 700,
    },
    h5: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 600,
    },
    h6: {
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: 600,
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#e3bf70',
      light: '#f0d08a',
      dark: '#c9a85a',
    },
    background: {
      default: '#1a1d2e',
      paper: '#1f2233',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
});

export default theme;
