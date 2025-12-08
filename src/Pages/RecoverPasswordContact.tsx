// src/Pages/RecoverPasswordContact.tsx

import * as React from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";

// IMPORTA TU LOGO Y STYLES IGUAL QUE EN EL LOGIN
// import { BingoLogo } from "../components/BingoLogo"; // ajusta la ruta
// import { textFieldSx } from "../theme/textFieldSx"; // si lo tienes en un archivo aparte

// import { createContactFormService } from "../services/contactFormService"; // o el servicio que te puse arriba
import BingoLogo from "../Components/BingoLogo";
import { createContactFormService } from "../Services/contactForm";
import { useAuth } from "../hooks/useAuth";
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


type FormValues = {
  email: string;
  title: string;
  description: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const RecoverPasswordContact: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = React.useState<string | null>(null);
  const { user } = useAuth();
  console.log("🚀 ~ RecoverPasswordContact ~ user:", user)

  const [values, setValues] = React.useState<FormValues>({
    email: "",
    title: "Recuperar contraseña",
    description: "",
  });

  React.useEffect(() => {
    if (user) {
      setValues((prev) => ({ ...prev, email: user.email }));
      setUserId(user.id);
    }
  }, [user]);

  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Prefill del email desde la URL: /recover-password?email=...
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromQuery = params.get("email");
    if (emailFromQuery) {
      setValues((prev) => ({ ...prev, email: emailFromQuery }));
    }
  }, [location.search]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
    setSuccessMessage(null);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!values.email) {
      newErrors.email = "El correo es obligatorio";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      newErrors.email = "Correo inválido";
    }

    if (!values.title.trim()) {
      newErrors.title = "El título es obligatorio";
    }

    if (!values.description.trim()) {
      newErrors.description = "La descripción es obligatoria";
    } else if (values.description.trim().length < 10) {
      newErrors.description = "Describe un poco mejor tu problema (mín. 10 caracteres)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    try {
      setLoading(true);

      await createContactFormService({
        email: values.email,
        title: values.title,
        description: values.description,
        user_id: userId || undefined,
      });

      setSuccessMessage(
        "¡Solicitud enviada! El equipo revisará tu caso y te contactará para ayudarte a recuperar tu contraseña."
      );

      // Si quieres limpiar solo descripción y título:
      setValues((prev) => ({
        ...prev,
        title: "Recuperar contraseña",
        description: "",
      }));
    } catch (err: any) {
      console.error("❌ Error enviando formulario:", err);
      setServerError(err?.message || "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
        color: "#f5e6d3",
        paddingBottom: "80px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 4,
        px: 2,
      }}
    >
      {/* Botón volver al inicio */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1,
        }}
      >
        <Button
          onClick={() => navigate("/")}
          startIcon={<HomeIcon />}
          variant="text"
          sx={{
            color: "#fcead0",
            fontWeight: 600,
            fontSize: "14px",
            textTransform: "none",
            borderRadius: "8px",
            px: 2,
            py: 1,
            bgcolor: "transparent",
            background: "none",
            backgroundImage: "none",
            border: "none",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: "transparent",
              background: "none",
              backgroundImage: "none",
              boxShadow: "inset 0 2px 6px rgba(0, 0, 0, 0.3)",
              transform: "translateY(-1px)",
              "& .MuiButton-startIcon": {
                color: "#d4af37",
              },
            },
            "& .MuiButton-startIcon": {
              color: "#fcead0",
              transition: "color 0.3s ease",
            },
          }}
        >
          Ir a Inicio
        </Button>
      </Box>

      {/* Logo */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <BingoLogo size={150} />
      </Box>

      {/* Título */}
      <Typography
        sx={{
          fontSize: { xs: 24, sm: 28 },
          fontWeight: 800,
          color: "#fcead0",
          mb: 1,
          textShadow: "0 0 10px rgba(0,0,0,0.8)",
        }}
      >
       Contáctanos
      </Typography>

      <Typography
        sx={{
          fontSize: 14,
          color: "rgba(255,255,255,0.65)",
          mb: 3,
        }}
      >
        Déjanos tus datos y una breve descripción del problema para ayudarte un admin de Bingo PAO revisará tu solicitud.
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
              background:
                "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent)",
              zIndex: 1,
            },
          }}
        >
          <Stack component="form" spacing={3} onSubmit={handleSubmit} noValidate>
            {successMessage && (
              <Typography
                textAlign="center"
                sx={{
                  color: "#4caf50",
                  bgcolor: "rgba(76, 175, 80, 0.15)",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  borderRadius: "8px",
                  p: 1.5,
                  fontSize: "0.875rem",
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
                  color: "#f44336",
                  bgcolor: "rgba(244, 67, 54, 0.15)",
                  border: "1px solid rgba(244, 67, 54, 0.3)",
                  borderRadius: "8px",
                  p: 1.5,
                  fontSize: "0.875rem",
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
              onChange={handleChange}
              fullWidth
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email || " "}
              sx={textFieldSx}
            />

            <TextField
              name="title"
              label="Título"
              value={values.title}
              onChange={handleChange}
              fullWidth
              error={!!errors.title}
              helperText={errors.title || "Ej: No puedo entrar a mi cuenta"}
              sx={textFieldSx}
            />

            <TextField
              name="description"
              label="Describe tu problema"
              value={values.description}
              onChange={handleChange}
              fullWidth
              multiline
              minRows={3}
              error={!!errors.description}
              helperText={
                errors.description ||
                "Cuéntanos qué sucede para ayudarte lo más rápido posible"
              }
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
                textShadow:
                  "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)",
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
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default RecoverPasswordContact;
