import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import * as React from 'react';
import BingoLogo from '../Componets/BingoLogo';
import { loginService } from '../Services/auth.service';
import { useNavigate } from 'react-router-dom';

const gold = '#d6bf7b';

// Inputs estilo casino oscuro
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(10,4,0,0.9)',
    borderRadius: 2.5,
    color: '#fcead0',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(214,191,123,0.65)',
      borderWidth: 2,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: gold,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#c79b36',
      boxShadow: '0 0 0 3px rgba(214,172,75,0.18)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#a89563',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#c79b36',
  },
  '& input': {
    color: '#fcead0',
  },
  '& input::placeholder': {
    color: '#b9a873',
    opacity: 1,
  },
};

export default function Login() {
  const [values, setValues] = React.useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string | false>>(
    {}
  );
  const [serverError, setServerError] = React.useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((s) => ({ ...s, [name]: value }));
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const validate = () => {
    const errs: Record<string, string | false> = {};
    if (!values.email.trim()) errs.email = 'Correo requerido';
    else if (!validateEmail(values.email)) errs.email = 'Correo inválido';

    if (!values.password) errs.password = 'Contraseña requerida';
    else if (values.password.length < 8)
      errs.password = 'Mínimo 8 caracteres';

    setErrors(errs);
    return Object.values(errs).every((v) => !v);
  };

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setServerError(null);

  // si tienes una función validate() como antes, úsala
  if (!validate()) return;

  try {
    setLoading(true);

    // Llamada al servicio de login
    const { user, token } = await loginService(values.email, values.password);

    console.log('Usuario logueado:', user, token);

    // Aquí ya tienes todo guardado en localStorage (lo hace loginService)
    // Opcional: redirigir al home / salas / perfil
    navigate('/');  // o '/rooms', '/profile', etc.

  } catch (err: any) {
    console.error('Error en login:', err);
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      'Error al iniciar sesión';
    setServerError(msg);
  } finally {
    setLoading(false);
  }
};
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
        px: 2,
        background:
          'radial-gradient(1000px 600px at 50% 0, rgba(255,220,140,0.12), transparent 60%), linear-gradient(180deg, #1a0e05 0%, #100804 45%, #090302 100%)',
      }}
    >
      {/* Logo + título */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <BingoLogo size={150} />
      </Box>

      <Typography
        sx={{
          fontSize: { xs: 24, sm: 28 },
          fontWeight: 800,
          color: '#fcead0',
          mb: 1,
          textShadow: '0 0 10px rgba(0,0,0,0.8)',
        }}
      >
        Iniciar sesión
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.65)',
          mb: 3,
        }}
      >
        Entra para unirte a las salas de Bingo PAO
      </Typography>

      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            bgcolor: 'rgba(10,4,0,0.92)',
            border: '1px solid rgba(255,214,0,0.18)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Stack component="form" spacing={3} onSubmit={handleSubmit} noValidate>
            {serverError && (
              <Typography color="error" textAlign="center">
                {serverError}
              </Typography>
            )}

            <TextField
              name="email"
              label="Correo electrónico"
              type="email"
              value={values.email}
              onChange={onChange}
              fullWidth
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email || ' '}
              sx={textFieldSx}
            />

            <TextField
              name="password"
              label="Contraseña"
              type={showPw ? 'text' : 'password'}
              value={values.password}
              onChange={onChange}
              fullWidth
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password || 'Mínimo 8 caracteres'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      sx={{ color: '#c0a15a' }}
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={textFieldSx}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.4,
                fontWeight: 800,
                borderRadius: 999,
                textTransform: 'none',
                fontSize: '1.05rem',
                background:
                  'linear-gradient(180deg, #ffd96e 0%, #f2c045 40%, #d6a43b 100%)',
                color: '#3a2305',
                boxShadow:
                  '0 10px 26px rgba(214,172,75,0.4), 0 0 18px rgba(255,220,140,0.45)',
                '&:hover': {
                  background:
                    'linear-gradient(180deg, #ffe48a 0%, #f7c956 40%, #c9952f 100%)',
                  boxShadow:
                    '0 12px 30px rgba(214,172,75,0.55), 0 0 22px rgba(255,230,160,0.6)',
                },
              }}
            >
              {loading ? 'Ingresando...' : 'Entrar'}
            </Button>

            <Divider
              sx={{
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            />

            <Typography
              textAlign="center"
              sx={{ color: 'rgba(255,255,255,0.75)' }}
            >
              ¿No tienes cuenta?{' '}
              <Link href="/register" underline="hover" sx={{ color: '#f1ca66' }}>
                Regístrate
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
