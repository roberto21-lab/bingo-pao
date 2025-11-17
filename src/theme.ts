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
      main: '#d4af37', // Oro clásico
      light: '#f4d03f', // Oro brillante
      dark: '#b8941f', // Oro oscuro
    },
    secondary: {
      main: '#8b6f5f', // Marrón madera medio
      light: '#a0826d', // Marrón madera claro
      dark: '#5a3a2a', // Marrón madera oscuro
    },
    background: {
      default: '#1a1008', // Fondo madera vieja y oscura
      paper: '#1f1309', // Papel madera envejecida
    },
    text: {
      primary: '#f5e6d3', // Crema/beige para texto sobre madera
      secondary: 'rgba(245, 230, 211, 0.8)',
    },
    // Colores personalizados para la cabaña
    success: {
      main: '#d4af37', // Oro para elementos exitosos
    },
    warning: {
      main: '#ffd700', // Oro brillante para advertencias
    },
    error: {
      main: '#c9a85a', // Bronce para errores
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)',
          color: '#1a0f0a',
          boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #f4d03f 0%, #ffd700 50%, #f4d03f 100%)',
            boxShadow: '0 6px 20px rgba(212, 175, 55, 0.6)',
          },
        },
      },
    },
  },
});

export default theme;
