// src/Pages/Profile.tsx
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Stack,
  Typography
} from "@mui/material";
import * as React from "react";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LogoutIcon from "@mui/icons-material/Logout";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router";
import BackgroundStars from "../Componets/BackgroundStars";
import { MobilePaymentReportDialog, type MobilePaymentReportFormState } from "../Componets/MobilePaymentReportDialog";
import { logout } from "../Services/auth.service";
import { WithdrawRequestDialog } from "../Componets/WithdrawRequestDialog";


type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  docType: "V" | "E";
  docId: string;
  balance: number;
  currency: "Bs" | "USD";
};

type MobilePayData = {
  bankName: string;
  phone: string;
  docType: "V" | "E";
  docId: string;
  accountHolder: string;
};

const MOCK_USER: User = {
  id: "usr_001",
  name: "Roberto Ravelo",
  email: "roberto@example.com",
  phone: "+58 412-0000000",
  docType: "V",
  docId: "12345678",
  balance: 30000,
  currency: "Bs",
};

const MOCK_PM: MobilePayData = {
  bankName: "Banco de Venezuela",
  phone: "0412-0000000",
  docType: "V",
  docId: "12345678",
  accountHolder: "Roberto Ravelo",
};

const BANKS = [
  "Banco de Venezuela",
  "Banco Provincial",
  "Banesco",
  "Mercantil",
  "BOD",
  "Banco del Tesoro",
  "Bancamiga",
];

// Estilos para TextFields en el modal
const textFieldStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(31, 19, 9, 0.6)",
    borderRadius: 2,
    color: "#f5e6d3",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(212, 175, 55, 0.3)",
      borderWidth: 2,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(212, 175, 55, 0.5)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(212, 175, 55, 0.7)",
      boxShadow: "0 0 0 3px rgba(212, 175, 55, 0.1)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(245, 230, 211, 0.7)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "rgba(212, 175, 55, 0.9)",
  },
  "& input": {
    color: "#f5e6d3",
  },
  "& .MuiSelect-select": {
    color: "#f5e6d3",
  },
  "& .MuiSelect-icon": {
    color: "rgba(212, 175, 55, 0.7)",
  },
};

export default function Profile() {
  const [openReport, setOpenReport] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const navigate = useNavigate();

  const handleCopy = (value: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        alert("Copiado al portapapeles ✅");
      })
      .catch((err) => {
        console.error("Error al copiar:", err);
        alert("No se pudo copiar 😢");
      });
  };




  // Form de reporte (mock state)
  const [report, setReport] = React.useState({
    refCode: "",
    bankName: "",
    payerDocType: "V",
    payerDocId: "",
    payerPhone: "",
    amount: "",
    paidAt: new Date().toISOString().slice(0, 16), // datetime-local iso
    notes: "",
    voucherFile: null as File | null,
    voucherPreview: "" as string,
  });

  const handleFile = (f: File | null) => {
    if (!f) {
      setReport((s) => ({ ...s, voucherFile: null, voucherPreview: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setReport((s) => ({ ...s, voucherFile: f, voucherPreview: String(reader.result) }));
    reader.readAsDataURL(f);
  };

  const submitReport = () => {
    setOpenReport(!openReport);

    setError("");
    if (!report.refCode.trim()) return setError("La referencia es obligatoria.");
    if (!report.bankName) return setError("Selecciona el banco.");
    if (!report.payerDocId.trim()) return setError("La cédula es obligatoria.");
    if (!report.amount || Number(report.amount) <= 0)
      return setError("El monto debe ser mayor a 0.");

    // Preparar datos para enviar al backend
    // const reportData = {
    //   ...report,
    //   amount: Number(report.amount),
    //   userId: MOCK_USER.id,
    //   createdAt: new Date().toISOString(),
    // };
    // await api.post('/payments/report', reportData);

    // reset suave y cerrar
    setReport((s) => ({ ...s, refCode: "", amount: "", notes: "", voucherFile: null, voucherPreview: "" }));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

    const [openWithdrawRequestDialog, setOpenWithdrawRequestDialog] = React.useState(false);
  
    const handleSubmitWithdrawRequestDialog = () =>{
        setOpenWithdrawRequestDialog(!openWithdrawRequestDialog);
    }
   

  //  const [openReport, setOpenReport] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  

  return (
    <>
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1008", // Fondo de madera oscura
        color: "#f5e6d3", // Texto crema
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
        // Textura de madera de fondo (más sutil)
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            #1a1008 0px,
            #1f1309 1px,
            #2a1a0f 2px,
            #1f1309 3px,
            #1a1008 4px,
            #1a1008 8px,
            #1f1309 9px,
            #2a1a0f 10px,
            #1f1309 11px,
            #1a1008 12px
          ),
          linear-gradient(
            90deg,
            #1a1008 0%,
            #1f1309 15%,
            #2a1a0f 30%,
            #1f1309 45%,
            #1a1008 60%,
            #1f1309 75%,
            #2a1a0f 90%,
            #1a1008 100%
          ),
          radial-gradient(ellipse 200px 50px at 25% 30%, rgba(42, 26, 15, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse 150px 40px at 75% 60%, rgba(31, 19, 9, 0.25) 0%, transparent 50%)
        `,
        backgroundSize: `
          100% 16px,
          200% 100%,
          100% 100%,
          100% 100%
        `,
        // Capa de difuminado/vaho sobre el fondo
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 500px 350px at 80% 60%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 400px 300px at 50% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 15% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 450px 320px at 70% 15%, rgba(0, 0, 0, 0.1) 0%, transparent 60%)
          `,
          backdropFilter: "blur(8px) saturate(120%)",
          WebkitBackdropFilter: "blur(8px) saturate(120%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <BackgroundStars />
      <Container maxWidth="md" sx={{ py: 4, position: "relative", zIndex: 1 }}>
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
          sx={{
            mb: 4,
            px: { xs: 1, md: 0 },
          }}
        >
          {/* Avatar y Nombre */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              flex: 1,
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontWeight: 900,
                fontSize: "28px",
                bgcolor: "rgba(31, 19, 9, 0.8)",
                backdropFilter: "blur(20px)",
                color: "#d4af37",
                border: "3px solid rgba(212, 175, 55, 0.6)",
                boxShadow: "0 4px 16px rgba(212, 175, 55, 0.3), 0 0 20px rgba(212, 175, 55, 0.2)",
              }}
            >
              {MOCK_USER.name[0]}
            </Avatar>

            <Box>
              {MOCK_USER.name.split(' ').map((part, index) => (
                <Typography
                  key={index}
                  sx={{
                    fontSize: { xs: "18px", sm: "22px" },
                    fontWeight: 800,
                    lineHeight: 1.2,
                    background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "'Montserrat', sans-serif",
                    textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                    letterSpacing: "0.5px",
                  }}
                >
                  {part}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Card de Saldo */}
          <Card
            onClick={() => { navigate("/wallet"); }}
            sx={{
              px: 3,
              py: 2,
              borderRadius: "16px",
              bgcolor: "rgba(31, 19, 9, 0.92)",
              backdropFilter: "blur(40px) saturate(150%)",
              WebkitBackdropFilter: "blur(40px) saturate(150%)",
              border: "2px solid rgba(212, 175, 55, 0.3)",
              boxShadow: "0 16px 36px rgba(0,0,0,0.85), 0 0 20px rgba(212, 175, 55, 0.1)",
              minWidth: { xs: "140px", sm: "160px" },
              textAlign: "right",
              cursor: "pointer",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "rgba(212, 175, 55, 0.5)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.9), 0 0 30px rgba(212, 175, 55, 0.2)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "rgba(245, 230, 211, 0.7)",
                fontWeight: 500,
                fontSize: "11px",
                display: "block",
                mb: 0.5,
              }}
            >
              Saldo disponible
            </Typography>
            <Typography
              variant="h6"
              fontWeight={900}
              sx={{
                background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                fontSize: { xs: "18px", sm: "20px" },
                lineHeight: 1.2,
              }}
            >
              {MOCK_USER.currency}
            </Typography>
            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                fontSize: { xs: "22px", sm: "26px" },
                lineHeight: 1.1,
                mt: 0.5,
              }}
            >
              {Intl.NumberFormat().format(MOCK_USER.balance)}
            </Typography>
          </Card>
        </Stack>


      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box sx={{ flex: { xs: "0 0 auto", md: "0 0 60%" } }}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                bgcolor: "rgba(31, 19, 9, 0.92)",
                backdropFilter: "blur(40px) saturate(150%)",
                WebkitBackdropFilter: "blur(40px) saturate(150%)",
                border: "2px solid rgba(212, 175, 55, 0.3)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.75), 0 0 20px rgba(212, 175, 55, 0.1)",
              }}
            >
              <CardHeader
                title="Perfil"
                sx={{
                  pb: 0,
                  "& .MuiCardHeader-title": {
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "'Montserrat', sans-serif",
                    textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  },
                }}
              />
              <CardContent sx={{ pt: 1.5 }}>
                <Stack spacing={1}>
                  <Line label="Nombre" value={MOCK_USER.name} />
                  <Line label="Correo" value={MOCK_USER.email} />
                  <Line label="Teléfono" value={MOCK_USER.phone} />
                  <Line
                    label="Documento"
                    value={`${MOCK_USER.docType}-${MOCK_USER.docId}`}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                bgcolor: "rgba(31, 19, 9, 0.92)",
                backdropFilter: "blur(40px) saturate(150%)",
                WebkitBackdropFilter: "blur(40px) saturate(150%)",
                border: "2px solid rgba(212, 175, 55, 0.3)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.75), 0 0 20px rgba(212, 175, 55, 0.1)",
                flexGrow: 1,
              }}
            >
              <CardHeader
                title="Datos para Pago Móvil"
                subheader="Usa estos datos para transferir"
                sx={{
                  pb: 0,
                  "& .MuiCardHeader-title": {
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontFamily: "'Montserrat', sans-serif",
                    textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  },
                  "& .MuiCardHeader-subheader": {
                    color: "rgba(245, 230, 211, 0.7)",
                  },
                }}
              />
              <CardContent sx={{ pt: 1.5 }}>
                <Stack spacing={1}>
                  <Line label="Banco" value={MOCK_PM.bankName} />

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Line label="Teléfono" value={MOCK_PM.phone} />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(MOCK_PM.phone)}
                      sx={{ ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Line
                        label="Cédula/RIF"
                        value={`${MOCK_PM.docType}-${MOCK_PM.docId}`}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleCopy(`${MOCK_PM.docType}-${MOCK_PM.docId}`)
                      }
                      sx={{ ml: 1 }}
                    >
                      <ContentCopyIcon fontSize="inherit" />
                    </IconButton>
                  </Box>

                </Stack>
              </CardContent>

            </Card>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    onClick={submitReport}
                    sx={{
                      backfaceVisibility: "hidden",
                      position: "relative",
                      cursor: "pointer",
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
                        transform: "translateY(-1px)",
                      },
                      "&:active": {
                        transform: "translateY(2px)",
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
                    Recargar Saldo
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleSubmitWithdrawRequestDialog}
                    variant="outlined"
                    sx={{
                      backfaceVisibility: "hidden",
                      position: "relative",
                      cursor: "pointer",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: "14px",
                      py: 1.5,
                      borderRadius: "8px",
                      textTransform: "none",
                      textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
                      borderColor: "#7c7c7c",
                      borderWidth: "1px",
                      backgroundImage: `
                        repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 6%, hsla(0,0%,100%, .1) 7.5%),
                        repeating-linear-gradient(left, hsla(0,0%, 0%,0) 0%, hsla(0,0%, 0%,0) 4%, hsla(0,0%, 0%,.03) 4.5%),
                        repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 1.2%, hsla(0,0%,100%,.15) 2.2%),
                        linear-gradient(180deg, hsl(0,0%,78%) 0%, hsl(0,0%,90%) 47%, hsl(0,0%,78%) 53%, hsl(0,0%,70%) 100%)
                      `,
                      boxShadow: `
                        inset 0px 1px 0px rgba(255,255,255,1),
                        0px 1px 3px rgba(0,0,0,0.3),
                        0px 4px 12px rgba(0, 0, 0, 0.2)
                      `,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        boxShadow: `
                          inset 0px 1px 0px rgba(255,255,255,1),
                          0px 2px 6px rgba(0,0,0,0.4),
                          0px 6px 16px rgba(0, 0, 0, 0.3)
                        `,
                        transform: "translateY(-1px)",
                      },
                      "&:active": {
                        transform: "translateY(2px)",
                        boxShadow: `
                          inset 0px 1px 0px rgba(255,255,255,0.8),
                          0px 1px 2px rgba(0,0,0,0.3),
                          0px 2px 8px rgba(0, 0, 0, 0.15)
                        `,
                      },
                    }}
                  >
                    Retirar Fondos
                  </Button>
                </Stack>
          
          <Button
            variant="outlined"
            onClick={handleLogout}
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              backfaceVisibility: "hidden",
              position: "relative",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flexbox",
              height: 48,
              color: "#fff",
              fontWeight: 900,
              fontSize: "14px",
              py: 1.5,
              borderRadius: "8px",
              textTransform: "none",
              textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
              border: "1px solid #d32f2f",
              backgroundImage: `
                repeating-linear-gradient(left, rgba(244, 67, 54, 0) 0%, rgba(244, 67, 54, 0) 3%, rgba(244, 67, 54, .12) 3.75%),
                repeating-linear-gradient(left, rgba(198, 40, 40, 0) 0%, rgba(198, 40, 40, 0) 2%, rgba(198, 40, 40, .04) 2.25%),
                repeating-linear-gradient(left, rgba(255, 82, 82, 0) 0%, rgba(255, 82, 82, 0) .6%, rgba(255, 82, 82, .18) 1.2%),
                linear-gradient(180deg, #f44336 0%, #ef5350 25%, #e57373 38%, #ef5350 47%, #e57373 53%, #ef5350 75%, #f44336 100%)
              `,
              boxShadow: `
                inset 0px 1px 0px rgba(255,255,255,0.9),
                inset 0px -1px 0px rgba(0,0,0,0.2),
                0px 1px 3px rgba(0,0,0,0.4),
                0px 4px 12px rgba(244, 67, 54, 0.4),
                0px 0px 20px rgba(244, 67, 54, 0.2)
              `,
              transition: "all 0.2s ease",
              "& .MuiButton-startIcon": {
                color: "#fff",
              },
              "&:hover": {
                backgroundImage: `
                  repeating-linear-gradient(left, rgba(244, 67, 54, 0) 0%, rgba(244, 67, 54, 0) 3%, rgba(244, 67, 54, .15) 3.75%),
                  repeating-linear-gradient(left, rgba(198, 40, 40, 0) 0%, rgba(198, 40, 40, 0) 2%, rgba(198, 40, 40, .05) 2.25%),
                  repeating-linear-gradient(left, rgba(255, 82, 82, 0) 0%, rgba(255, 82, 82, 0) .6%, rgba(255, 82, 82, .2) 1.2%),
                  linear-gradient(180deg, #ef5350 0%, #e57373 25%, #ff8a80 38%, #e57373 47%, #ff8a80 53%, #e57373 75%, #ef5350 100%)
                `,
                boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,1),
                  inset 0px -1px 0px rgba(0,0,0,0.2),
                  0px 2px 6px rgba(0,0,0,0.5),
                  0px 6px 20px rgba(244, 67, 54, 0.5),
                  0px 0px 30px rgba(244, 67, 54, 0.3)
                `,
                transform: "translateY(-1px)",
                borderColor: "#d32f2f",
              },
              "&:active": {
                transform: "translateY(2px)",
                boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,0.7),
                  inset 0px -1px 0px rgba(0,0,0,0.3),
                  0px 1px 2px rgba(0,0,0,0.4),
                  0px 2px 8px rgba(244, 67, 54, 0.3),
                  0px 0px 15px rgba(244, 67, 54, 0.15)
                `,
              },
            }}
          >
            Cerrar Sesión
          </Button>
        </Box>
      </Box>
      </Container>
    </Box>

      <WithdrawRequestDialog
              open={openWithdrawRequestDialog}
              onClose={() => setOpenWithdrawRequestDialog(false)}
              onSubmit={handleSubmitWithdrawRequestDialog}
              error={error}
              currency="Bs"
              // accountInfo={MOCK_ACCOUNT}
              minAmount={500} accountInfo={{
                bankName: "",
                docType: "V",
                docId: "",
                phone: ""
              }}      />

     {/* <button onClick={() => setOpenReport(true)}>Reportar pago móvil</button> */}

      <MobilePaymentReportDialog
        open={openReport}
        onClose={() => setOpenReport(false)}
        onSubmit={submitReport}
        error={error}
        banks={BANKS}
        currency={MOCK_USER.currency}
      />
    </>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography 
        variant="body2" 
        sx={{ 
          minWidth: 130,
          color: "rgba(245, 230, 211, 0.7)",
        }}
      >
        {label}:
      </Typography>
      <Typography 
        variant="body2" 
        fontWeight={600}
        sx={{
          color: "#f5e6d3",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
