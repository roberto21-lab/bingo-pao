import * as React from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    FormControlLabel,
    Checkbox,
    IconButton,
    InputAdornment,
    Link,
    Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BingoLogo from '../Componets/BingoLogo';
// import BingoLogo from '../components/BingoLogo';

// arriba del componente
const gold = '#d6bf7b';
const textFieldSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#fff',           // fondo del input
        borderRadius: 2,
        // borde visible en reposo
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(214,191,123,0.65)', // dorado tenue
            borderWidth: 2,
        },
        // hover
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: gold,
        },
        // focus
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#c79b36',
            boxShadow: '0 0 0 3px rgba(214,172,75,0.18)',
        },
    },
    // color del label
    '& .MuiInputLabel-root': {
        color: '#a89563',
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#c79b36',
    },
    // placeholder (si usas placeholder en vez de label)
    '& input::placeholder': {
        color: '#b9a873',
        opacity: 1,
    },
};


export default function RegisterPage() {
    const [values, setValues] = React.useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    });

    const [showPw, setShowPw] = React.useState(false);
    const [showPw2, setShowPw2] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string | false>>({});
    const [serverError, setServerError] = React.useState<string | null>(null);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setValues((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
    };

    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

    const validate = () => {
        const errs: Record<string, string | false> = {};
        if (!values.fullName.trim()) errs.fullName = 'Nombre completo requerido';
        if (!values.email.trim()) errs.email = 'Correo requerido';
        else if (!validateEmail(values.email)) errs.email = 'Correo inválido';

        if (!values.password) errs.password = 'Contraseña requerida';
        else if (values.password.length < 8)
            errs.password = 'Mínimo 8 caracteres';

        if (!values.confirmPassword) errs.confirmPassword = 'Confirma la contraseña';
        else if (values.password !== values.confirmPassword)
            errs.confirmPassword = 'Las contraseñas no coinciden';

        if (!values.acceptTerms) errs.acceptTerms = 'Debes aceptar los términos';

        setErrors(errs);
        return Object.values(errs).every((v) => !v);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerError(null);
        if (!validate()) return;

        try {
            setLoading(true);
            // const res = await AuthService.register({
            //   fullName: values.fullName,
            //   email: values.email,
            //   password: values.password,
            // });
            await new Promise((r) => setTimeout(r, 800)); // Simulación
            // Redirige al login o dashboard
            // navigate('/login');
            alert('¡Cuenta creada!');
        } catch (err: any) {
            setServerError(err?.message || 'Error al registrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                // minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                px: 2,
                background:
                    'radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.06), transparent 60%), linear-gradient(180deg, #0b1220, #0a0f1a 40%, #0b1020)',
            }}
        >

            <Stack spacing={1.2} textAlign="center">
                <Typography
                    sx={{
                        fontSize: { xs: 44, sm: 64 },
                        fontWeight: 900,
                        letterSpacing: '0.14em',
                        lineHeight: 1,
                        color: '#FFFFFF',
                        textTransform: 'uppercase',
                    }}
                >
                    BINGO
                </Typography>


                <Box sx={{ textAlign: "center", mb: 4 }}>
                        <BingoLogo size={120} />
                </Box>

                <Typography
                    sx={{
                        fontSize: { xs: 22, sm: 28 },
                        fontWeight: 800,
                        color: '#EDEDED',
                        mt: 1,
                    }}
                >
                    Registrate
                </Typography>
            </Stack>



            <Container maxWidth="sm">
                {/* 👉 CARD BLANCA */}
                <Paper
                    elevation={8}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 5,
                        bgcolor: '#fff',
                        boxShadow: '0 16px 48px rgba(0,0,0,.25)',
                    }}
                >
                    <Stack spacing={3} component="form" onSubmit={handleSubmit}>


                        {serverError && (
                            <Typography color="error" textAlign="center">
                                {serverError}
                            </Typography>
                        )}

                        {/* 👉 Inputs blancos */}
                        <TextField
                            name="fullName"
                            label="Nombre completo"
                            value={values.fullName}
                            onChange={onChange}
                            fullWidth
                            autoComplete="name"
                            error={!!errors.fullName}
                            helperText={errors.fullName || ' '}
                            sx={textFieldSx}
                        />

                        <TextField
                            name="email"
                            label="Email"
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
                            autoComplete="new-password"
                            error={!!errors.password}
                            helperText={errors.password || 'Mínimo 8 caracteres'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton edge="end" sx={{ color: '#8c7a3a' }}>
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
                            type={showPw2 ? 'text' : 'password'}
                            value={values.confirmPassword}
                            onChange={onChange}
                            fullWidth
                            autoComplete="new-password"
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword || ' '}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton edge="end" sx={{ color: '#8c7a3a' }}>
                                            {showPw2 ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={textFieldSx}
                        />


                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={values.acceptTerms}
                                    onChange={onChange}
                                    name="acceptTerms"
                                    sx={{ '&.Mui-checked': { color: '#b4932f' } }}
                                />
                            }
                            label={
                                <Typography>
                                    I accept the <Link href="#" underline="hover" color="#b4932f">Terms & Conditions</Link>
                                </Typography>
                            }
                        />
                        {errors.acceptTerms && (
                            <Typography variant="caption" color="error" sx={{ mt: -1 }}>
                                {errors.acceptTerms}
                            </Typography>
                        )}

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.4,
                                fontWeight: 700,
                                borderRadius: 999,
                                textTransform: 'none',
                                fontSize: '1.05rem',
                                background: 'linear-gradient(180deg, #f3d08a 0%, #d6ac4b 100%)',
                                color: '#0b0f1a',
                                boxShadow: '0 8px 20px rgba(214,172,75,0.35)',
                                '&:hover': {
                                    background: 'linear-gradient(180deg, #f0c56d 0%, #c79b36 100%)',
                                    boxShadow: '0 10px 24px rgba(214,172,75,0.45)',
                                },
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </Button>

                        <Divider />

                        <Typography textAlign="center" color="text.secondary">
                            Already have the account?{' '}
                            <Link href="/login" underline="hover" color="#b4932f">
                                Log In
                            </Link>
                        </Typography>
                    </Stack>
                </Paper>
            </Container>
        </Box>

    );
}
