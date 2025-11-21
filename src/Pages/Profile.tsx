// src/Pages/Profile.tsx
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import * as React from "react";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import { useNavigate } from "react-router";


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
    setError("");
    if (!report.refCode.trim()) return setError("La referencia es obligatoria.");
    if (!report.bankName) return setError("Selecciona el banco.");
    if (!report.payerDocId.trim()) return setError("La cédula es obligatoria.");
    if (!report.amount || Number(report.amount) <= 0)
      return setError("El monto debe ser mayor a 0.");

    const payload = {
      ...report,
      amount: Number(report.amount),
      userId: MOCK_USER.id,
      createdAt: new Date().toISOString(),
    };
    // aquí enviarías al backend…

    // reset suave y cerrar
    setOpenReport(false);
    setReport((s) => ({ ...s, refCode: "", amount: "", notes: "", voucherFile: null, voucherPreview: "" }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          mb: 3,
          px: { xs: 1, md: 0 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            px: 2,
            py: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 56,
              height: 56,
              fontWeight: 800,
              bgcolor: "#2c2215",
              color: "#ffd95a",
              border: "2px solid rgba(255,217,90,0.7)",
              boxShadow: "0 0 18px rgba(0,0,0,0.7)",
            }}
          >
            {MOCK_USER.name[0]}
          </Avatar>

          <Box>
            <Typography
         
            >
              {MOCK_USER.name}
            </Typography>

          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Card
        
          sx={{
            px: 2.5,
            py: 1.8,
            borderRadius: 3,
            bgcolor: "rgba(15,8,0,0.5)",
            border: "1px solid rgba(255,214,0,0.35)",
            boxShadow: "0 16px 36px rgba(0,0,0,0.85)",
            minWidth: 120,
            textAlign: "right",
            backdropFilter: "blur(6px)",
          }}
            onClick={() => { navigate("/wallet"); }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
          >
            Saldo disponible
          </Typography>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{
              mt: 0.5,
              color: "#ffdd6b",
              textShadow: "0 0 16px rgba(0,0,0,1)",
            }}
          >
            {MOCK_USER.currency} {Intl.NumberFormat().format(MOCK_USER.balance)}
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
                bgcolor: "rgba(10,4,0,0.85)",
                border: "1px solid rgba(255,214,0,0.18)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
              }}
            >
              <CardHeader
                title="Perfil"
                sx={{
                  pb: 0,
                  "& .MuiCardHeader-title": {
                    fontWeight: 800,
                    color: "#fcead0",
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
                bgcolor: "rgba(10,4,0,0.9)",
                border: "1px solid rgba(255,214,0,0.18)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
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
                    color: "#fcead0",
                  },
                  "& .MuiCardHeader-subheader": {
                    color: "rgba(255,255,255,0.55)",
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

          }}
        >
          <Button
            variant="contained"
            onClick={() => setOpenReport(true)}
            fullWidth
            sx={{
              height: 48,
            }}
          >
            Reportar pago
          </Button>
        </Box>
      </Box>

      <Dialog
        open={openReport}
        onClose={() => setOpenReport(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            bgcolor: "#1a1206",
            color: "#ffdd6b",
            borderBottom: "1px solid rgba(255,214,0,0.25)",
          }}
        >
          Reportar pago móvil
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            bgcolor: "#130b04",
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Código de referencia"
              value={report.refCode}
              onChange={(e) =>
                setReport((s) => ({ ...s, refCode: e.target.value }))
              }
            />

            <TextField
              select
              fullWidth
              label="Banco emisor"
              value={report.bankName}
              onChange={(e) =>
                setReport((s) => ({ ...s, bankName: e.target.value }))
              }
            >
              {BANKS.map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={report.payerDocType}
                onChange={(e) =>
                  setReport((s) => ({
                    ...s,
                    payerDocType: e.target.value as "V" | "E",
                  }))
                }
              >
                <MenuItem value="V">V</MenuItem>
                <MenuItem value="E">E</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Cédula"
                value={report.payerDocId}
                onChange={(e) =>
                  setReport((s) => ({ ...s, payerDocId: e.target.value }))
                }
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Teléfono del pagador"
                value={report.payerPhone}
                onChange={(e) =>
                  setReport((s) => ({ ...s, payerPhone: e.target.value }))
                }
                placeholder="0412-0000000"
              />

              <TextField
                fullWidth
                type="number"
                label={`Monto (${MOCK_USER.currency})`}
                value={report.amount}
                onChange={(e) =>
                  setReport((s) => ({ ...s, amount: e.target.value }))
                }
                inputProps={{ min: 0, step: "any" }}
              />
            </Stack>

            <TextField
              fullWidth
              type="datetime-local"
              label="Fecha y hora del pago"
              value={report.paidAt}
              onChange={(e) =>
                setReport((s) => ({ ...s, paidAt: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <Button component="label" variant="outlined" fullWidth>
              Subir comprobante (imagen)
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </Button>

            {report.voucherPreview && (
              <Box
                component="img"
                src={report.voucherPreview}
                alt="Comprobante"
                sx={{
                  maxHeight: 220,
                  borderRadius: 2,
                  boxShadow: 2,
                  display: "block",
                  mx: "auto",
                }}
              />
            )}

            <TextField
              fullWidth
              label="Notas (opcional)"
              multiline
              minRows={2}
              value={report.notes}
              onChange={(e) =>
                setReport((s) => ({ ...s, notes: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            bgcolor: "#1a1206",
            borderTop: "1px solid rgba(255,214,0,0.25)",
          }}
        >
          <Button onClick={() => setOpenReport(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitReport}>
            Enviar reporte
          </Button>
        </DialogActions>
      </Dialog>
    </Container>

  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Stack>
  );
}
