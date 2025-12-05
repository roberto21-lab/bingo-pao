import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import HomeIcon from '@mui/icons-material/Home';
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
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// const gold = '#d6bf7b';

// Inputs estilo glassmorphism mejorado
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(31, 19, 9, 0.6)',
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    borderRadius: '12px',
    color: '#f5e6d3',
    transition: 'all 0.3s ease',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(212, 175, 55, 0.3)',
      borderWidth: 2,
      transition: 'all 0.3s ease',
    },
    '&:hover': {
      bgcolor: 'rgba(31, 19, 9, 0.7)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(212, 175, 55, 0.5)',
        boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.1)',
      },
    },
    '&.Mui-focused': {
      bgcolor: 'rgba(31, 19, 9, 0.8)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(212, 175, 55, 0.7)',
        boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.15), 0 0 20px rgba(212, 175, 55, 0.2)',
      },
    },
    '&.Mui-error': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(244, 67, 54, 0.6)',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(245, 230, 211, 0.7)',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'rgba(212, 175, 55, 0.9)',
    fontWeight: 600,
  },
  '& .MuiInputLabel-root.Mui-error': {
    color: 'rgba(244, 67, 54, 0.8)',
  },
  '& input': {
    color: '#f5e6d3',
    fontWeight: 500,
    '&::placeholder': {
      color: 'rgba(245, 230, 211, 0.5)',
      opacity: 1,
    },
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(245, 230, 211, 0.6)',
    fontSize: '0.75rem',
    '&.Mui-error': {
      color: 'rgba(244, 67, 54, 0.8)',
    },
  },
};

export default function Login() {
  const [values, setValues] = React.useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string | false>>(
    {}
  );
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Verificar si el usuario viene de registrarse
  React.useEffect(() => {
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('¡Cuenta creada exitosamente! Por favor inicia sesión.');
      // Limpiar el parámetro de la URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('registered');
      navigate(`/login?${newSearchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Redirigir si el usuario ya está autenticado
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Si hay un parámetro de redirección, ir allí, sino al home
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, navigate, searchParams]);

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

      // Marcar que el usuario acaba de hacer login para mostrar el toaster de bienvenida
      sessionStorage.setItem("justLoggedIn", "true");

      // Si hay un parámetro de redirección, ir allí, sino al home
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect, { replace: true });
      } else {
        navigate('/', { replace: true });
      }

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
  // No mostrar el formulario si el usuario está autenticado o se está cargando
  if (authLoading || isAuthenticated) {
    return null; // O podrías mostrar un spinner aquí
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'transparent',
        color: '#f5e6d3',
        paddingBottom: '80px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
        px: 2,
      }}
    >
      {/* Botón Ir a Inicio */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1,
        }}
      >
        <Button
          onClick={() => navigate('/')}
          startIcon={<HomeIcon />}
          variant="text"
          sx={{
            color: '#fcead0',
            fontWeight: 600,
            fontSize: '14px',
            textTransform: 'none',
            borderRadius: '8px',
            px: 2,
            py: 1,
            bgcolor: 'transparent',
            background: 'none',
            backgroundImage: 'none',
            border: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: 'transparent',
              background: 'none',
              backgroundImage: 'none',
              boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.3)',
              transform: 'translateY(-1px)',
              '& .MuiButton-startIcon': {
                color: '#d4af37',
              },
            },
            '& .MuiButton-startIcon': {
              color: '#fcead0',
              transition: 'color 0.3s ease',
            },
          }}
        >
          Ir a Inicio
        </Button>
      </Box>

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
            borderRadius: "24px",
            backgroundColor: "rgba(31, 19, 9, 0.92)",
            backdropFilter: "blur(40px) saturate(150%)",
            WebkitBackdropFilter: "blur(40px) saturate(150%)",
            border: "2px solid rgba(212, 175, 55, 0.3)",
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                rgba(31, 19, 9, 0.92) 0px,
                rgba(35, 22, 11, 0.94) 1px,
                rgba(40, 25, 13, 0.92) 2px,
                rgba(35, 22, 11, 0.94) 3px,
                rgba(31, 19, 9, 0.92) 4px,
                rgba(31, 19, 9, 0.92) 12px,
                rgba(35, 22, 11, 0.94) 13px,
                rgba(40, 25, 13, 0.92) 14px,
                rgba(35, 22, 11, 0.94) 15px,
                rgba(31, 19, 9, 0.92) 16px
              ),
              linear-gradient(
                90deg,
                rgba(31, 19, 9, 0.92) 0%,
                rgba(35, 22, 11, 0.93) 25%,
                rgba(40, 25, 13, 0.92) 50%,
                rgba(35, 22, 11, 0.93) 75%,
                rgba(31, 19, 9, 0.92) 100%
              ),
              radial-gradient(ellipse 400px 300px at 30% 40%, rgba(50, 30, 15, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 350px 250px at 70% 60%, rgba(45, 28, 14, 0.12) 0%, transparent 60%)
            `,
            backgroundSize: `
              100% 32px,
              200% 100%,
              100% 100%,
              100% 100%
            `,
            boxShadow: `
              0 0 30px rgba(255, 255, 255, 0.06),
              0 0 60px rgba(255, 255, 255, 0.04),
              0 0 90px rgba(255, 255, 255, 0.02),
              0 15px 50px rgba(0, 0, 0, 0.6),
              0 30px 80px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent)",
              zIndex: 1,
            },
          }}
        >
          <Stack component="form" spacing={3} onSubmit={handleSubmit} noValidate>
            {successMessage && (
              <Typography
                textAlign="center"
                sx={{
                  color: '#4caf50',
                  bgcolor: 'rgba(76, 175, 80, 0.15)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: '8px',
                  p: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {successMessage}
              </Typography>
            )}
            {serverError && (
              <Typography
                textAlign="center"
                sx={{
                  color: '#f44336',
                  bgcolor: 'rgba(244, 67, 54, 0.15)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '8px',
                  p: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
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
              disabled={loading}
              fullWidth
              sx={{
                backfaceVisibility: "hidden",
                position: "relative",
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-block",
                whiteSpace: "nowrap",
                color: "#fff",
                fontWeight: 900,
                fontSize: "14px",
                py: 1.5,
                borderRadius: "8px",
                textTransform: "none",
                textShadow: "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)",
                border: "1px solid #d4af37",
                backgroundImage: `
                  repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .12) 3.75%),
                  repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .04) 2.25%),
                  repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .18) 1.2%),
                  linear-gradient(180deg, #d4af37 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #f4d03f 53%, #ffd700 75%, #d4af37 100%)
                `,
                boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,0.9),
                  inset 0px -1px 0px rgba(0,0,0,0.2),
                  0px 1px 3px rgba(0,0,0,0.4),
                  0px 4px 12px rgba(212, 175, 55, 0.4),
                  0px 0px 20px rgba(255, 215, 0, 0.2)
                `,
                transition: "all 0.2s ease",
                opacity: loading ? 0.6 : 1,
                "&:hover": {
                  backgroundImage: `
                    repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .15) 3.75%),
                    repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .05) 2.25%),
                    repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .2) 1.2%),
                    linear-gradient(180deg, #f4d03f 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #ffed4e 53%, #ffd700 75%, #f4d03f 100%)
                  `,
                  boxShadow: `
                    inset 0px 1px 0px rgba(255,255,255,1),
                    inset 0px -1px 0px rgba(0,0,0,0.2),
                    0px 2px 6px rgba(0,0,0,0.5),
                    0px 6px 20px rgba(212, 175, 55, 0.5),
                    0px 0px 30px rgba(255, 215, 0, 0.3)
                  `,
                  transform: loading ? "none" : "translateY(-1px)",
                },
                "&:active": {
                  transform: loading ? "none" : "translateY(2px)",
                  boxShadow: `
                    inset 0px 1px 0px rgba(255,255,255,0.7),
                    inset 0px -1px 0px rgba(0,0,0,0.3),
                    0px 1px 2px rgba(0,0,0,0.4),
                    0px 2px 8px rgba(212, 175, 55, 0.3),
                    0px 0px 15px rgba(255, 215, 0, 0.15)
                  `,
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
            <Typography
              textAlign="center"
              sx={{ color: 'rgba(255,255,255,0.75)' }}
            >
              ¿olvidaste tu contraseña?{' '}
              <Link
                component={RouterLink}
                // Si hay email, lo mandas como query param, si no, solo la ruta
                to={
                  values.email
                    ? `/recover-password?email=${encodeURIComponent(values.email)}`
                    : '/recover-password'
                }
                underline="hover"
                sx={{ color: '#f1ca66' }}
              >
                Recuperar
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
