import HomeIcon from '@mui/icons-material/Home';
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
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import BingoLogo from '../Componets/BingoLogo';
import { useAuth } from '../hooks/useAuth';
import { forgotPasswordService } from '../Services/auth.service';

function useQuery() {
    const { search } = useLocation();
    return new URLSearchParams(search);
}

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

export default function RecoverPassword() {
    const [values, setValues] = React.useState({
        email: '',
        password: '',
        confirmPassword: '',
        code: '',
    });
    const query = useQuery();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [showPw, setShowPw] = React.useState(false);
    const [showPwCode, setShowPwCode] = React.useState(false);
    const [showPwConfirm, setShowPwConfirm] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string | false>>(
        {}
    );
    const [serverError, setServerError] = React.useState<string | null>(null);
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
    const [seeForm, setSeeForm] = React.useState(false);

    React.useEffect(() => {
        const emailFromUrl = query.get('email');
        if (emailFromUrl) {
            setValues((s) => ({ ...s, email: emailFromUrl }));
        }
    }, [query]);

    React.useEffect(() => {
        const registered = searchParams.get('registered');
        if (registered === 'true') {
            setSuccessMessage('¡Cuenta creada exitosamente! Por favor inicia sesión.');
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('registered');
            navigate(`/login?${newSearchParams.toString()}`, { replace: true });
        }
    }, [searchParams, navigate]);

    React.useEffect(() => {
        if (!authLoading && isAuthenticated) {
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

        if (!validate()) return;

        try {
            setLoading(true);

           const data = {
                email: values.email,
                password: values.password,
                code: values.code,
           }
           console.log("🚀 ~ handleSubmit ~ data:", data)

        //    aqui mandar a la api el data para recuperar la contraseña
        // y redirecionar al login con un mensaje de exito

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


    if (authLoading || isAuthenticated) {
        return null;
    }

 const seeFormSubmit = async () => {
  // limpiar mensajes previos
  setServerError(null);
  setSuccessMessage(null);

  // validación básica
  if (!values.email) {
    setServerError("Debes ingresar tu correo electrónico");
    return;
  }

  try {
    setLoading(true);

    // 👇 Aquí pegamos al back
    const resp = await forgotPasswordService({ email: values.email });

    // resp.message debería ser: "If the email exists, a recovery code was sent"
    setSuccessMessage(resp.message);

    // Si todo va bien, mostramos el siguiente formulario (el del código + nueva clave)
    setSeeForm(true);
  } catch (error) {
    console.error(error);
    setServerError("Ocurrió un error al enviar el código. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
};

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
                    Home
                </Button>
            </Box>

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
                Recuperar contraseña
            </Typography>
            <Typography
                sx={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.65)',
                    mb: 3,
                }}
            >
                Ingresa el código enviado a tu correo para recuperar tu contraseña.
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
                    {
                        !seeForm ? (
                            <Stack>

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
                                <Button
                                    onClick={seeFormSubmit}
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
                            </Stack>

                        ) : (
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
                                    name="code"
                                    label="Código"
                                    type={showPwCode ? 'text' : 'password'}
                                    value={values.code}
                                    onChange={onChange}
                                    fullWidth
                                    error={!!errors.code}
                                    helperText={errors.code || 'Mínimo 8 caracteres'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    edge="end"
                                                    sx={{ color: '#c0a15a' }}
                                                    onClick={() => setShowPwCode((v) => !v)}
                                                >
                                                    {showPwCode ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={textFieldSx}
                                />


                                <TextField
                                    name="password"
                                    label="Contraseña"
                                    type={showPw ? 'text' : 'password'}
                                    value={values.password}
                                    onChange={onChange}
                                    fullWidth
                                    autoComplete="new-password"
                                    error={!!errors.password}
                                    helperText={errors.password || 'Mínimo 8 caracteres'}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    edge="end"
                                                    sx={{
                                                        color: 'rgba(212, 175, 55, 0.7)',
                                                        '&:hover': {
                                                            color: 'rgba(212, 175, 55, 0.9)',
                                                        },
                                                    }}
                                                    onClick={() => setShowPw((v) => !v)}
                                                >
                                                    {showPw ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={textFieldSx}
                                />

                                <TextField
                                    name="confirmPassword"
                                    label="Confirma tu contraseña"
                                    type={showPwConfirm ? 'text' : 'password'}
                                    value={values.confirmPassword}
                                    onChange={onChange}
                                    fullWidth
                                    autoComplete="new-password"
                                    error={!!errors.confirmPassword}
                                    helperText={errors.confirmPassword || ' '}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    edge="end"
                                                    sx={{
                                                        color: 'rgba(212, 175, 55, 0.7)',
                                                        '&:hover': {
                                                            color: 'rgba(212, 175, 55, 0.9)',
                                                        },
                                                    }}
                                                    onClick={() => setShowPwConfirm((v) => !v)}
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
                            </Stack>
                        )
                    }






                </Paper>
            </Container>
        </Box>
    );
}
