// src/Pages/Profile.tsx
import * as React from "react";
import {
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
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Avatar,
  Alert,
} from "@mui/material";

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
    console.log("Reporte de pago →", payload);
    // aquí enviarías al backend…

    // reset suave y cerrar
    setOpenReport(false);
    setReport((s) => ({ ...s, refCode: "", amount: "", notes: "", voucherFile: null, voucherPreview: "" }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header simple */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Avatar sx={{ width: 56, height: 56, fontWeight: 800 }}>
          {MOCK_USER.name[0]}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {MOCK_USER.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {MOCK_USER.id}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Card
          variant="outlined"
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: "0 6px 18px rgba(0,0,0,.06)",
            minWidth: 200,
            textAlign: "right",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Saldo disponible
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {MOCK_USER.currency}{" "}
            {Intl.NumberFormat().format(MOCK_USER.balance)}
          </Typography>
        </Card>
      </Stack>

      <Grid container spacing={2}>
        {/* Datos de usuario */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader title="Perfil" />
            <CardContent>
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

        {/* Pago móvil (receptor) */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Datos para Pago Móvil"
              subheader="Usa estos datos para transferir"
            />
            <CardContent>
              <Stack spacing={1}>
                <Line label="Banco" value={MOCK_PM.bankName} />
                <Line label="Teléfono" value={MOCK_PM.phone} />
                <Line
                  label="Cédula/RIF"
                  value={`${MOCK_PM.docType}-${MOCK_PM.docId}`}
                />
                <Line label="Titular" value={MOCK_PM.accountHolder} />
              </Stack>

            
            </CardContent>
          </Card>
            <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => setOpenReport(true)}>
                  Reportar pago
                </Button>
                {/* <Button variant="outlined" onClick={() => alert("Copiado (mock)")}>
                  Copiar datos
                </Button> */}
              </Stack>
        </Grid>

      {/* Dialog Reportar Pago */}
      <Dialog open={openReport} onClose={() => setOpenReport(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reportar pago móvil</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2}>
              <TextField
                fullWidth
                label="Código de referencia"
                value={report.refCode}
                onChange={(e) => setReport((s) => ({ ...s, refCode: e.target.value }))}
              />

              <TextField
                select
                fullWidth
                label="Banco emisor"
                value={report.bankName}
                onChange={(e) => setReport((s) => ({ ...s, bankName: e.target.value }))}
              >
                {BANKS.map((b) => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Tipo"
                value={report.payerDocType}
                onChange={(e) => setReport((s) => ({ ...s, payerDocType: e.target.value as "V" | "E" }))}
              >
                <MenuItem value="V">V</MenuItem>
                <MenuItem value="E">E</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Cédula"
                value={report.payerDocId}
                onChange={(e) => setReport((s) => ({ ...s, payerDocId: e.target.value }))}
              />

              <TextField
                fullWidth
                label="Teléfono del pagador"
                value={report.payerPhone}
                onChange={(e) => setReport((s) => ({ ...s, payerPhone: e.target.value }))}
                placeholder="0412-0000000"
              />

              <TextField
                fullWidth
                type="number"
                label={`Monto (${MOCK_USER.currency})`}
                value={report.amount}
                onChange={(e) => setReport((s) => ({ ...s, amount: e.target.value }))}
                inputProps={{ min: 0, step: "any" }}
              />

              <TextField
                fullWidth
                type="datetime-local"
                label="Fecha y hora del pago"
                value={report.paidAt}
                onChange={(e) => setReport((s) => ({ ...s, paidAt: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />

              <Button
                component="label"
                variant="outlined"
                fullWidth
              >
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
                  sx={{ maxHeight: 220, borderRadius: 2, boxShadow: 1 }}
                />
            )}

              <TextField
                fullWidth
                label="Notas (opcional)"
                multiline
                minRows={2}
                value={report.notes}
                onChange={(e) => setReport((s) => ({ ...s, notes: e.target.value }))}
              />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReport(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitReport}>Enviar reporte</Button>
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
