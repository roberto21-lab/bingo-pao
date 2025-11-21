// src/components/WithdrawRequestDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  TextField,
  Button,
} from "@mui/material";

export type WithdrawRequestFormState = {
  bankName: string;
  docType: "V" | "E";
  docId: string;
  phone: string;
  amount: string;
  notes: string;
};

type WithdrawRequestDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WithdrawRequestFormState) => void;
  error?: string | null;
  currency: string;
  title?: string; // por si luego quieres cambiar el texto
  accountInfo: {
    bankName: string;
    docType: "V" | "E";
    docId: string;
    phone: string;
  };
  minAmount?: number; // por defecto 500
};

const textFieldStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(31, 19, 9, 0.95)",
    borderRadius: 2,
    "& fieldset": {
      borderColor: "rgba(212, 175, 55, 0.4)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(244, 208, 63, 0.8)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(244, 208, 63, 1)",
      boxShadow: "0 0 0 1px rgba(244, 208, 63, 0.6)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(245, 230, 211, 0.8)",
  },
  "& .MuiInputBase-input": {
    color: "#f5e6d3",
  },
  "& .Mui-disabled": {
    WebkitTextFillColor: "#f5e6d3 !important",
  },
};

const createDefaultState = (accountInfo: WithdrawRequestDialogProps["accountInfo"]): WithdrawRequestFormState => ({
  bankName: accountInfo.bankName,
  docType: accountInfo.docType,
  docId: accountInfo.docId,
  phone: accountInfo.phone,
  amount: "",
  notes: "",
});

export const WithdrawRequestDialog: React.FC<WithdrawRequestDialogProps> = ({
  open,
  onClose,
  onSubmit,
  error,
  currency,
  title = "Solicitar retiro de saldo",
  accountInfo,
  minAmount = 500,
}) => {
  const [form, setForm] = useState<WithdrawRequestFormState>(
    createDefaultState(accountInfo)
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(createDefaultState(accountInfo));
      setLocalError(null);
    }
  }, [open, accountInfo]);

  const handleChange =
    (field: keyof WithdrawRequestFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    setLocalError(null);
    const numericAmount = Number(form.amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setLocalError("Ingrese un monto válido.");
      return;
    }

    if (numericAmount < minAmount) {
      setLocalError(
        `El monto mínimo para retirar es ${minAmount} ${currency}.`
      );
      return;
    }

    onSubmit(form);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(25px) saturate(120%)",
            WebkitBackdropFilter: "blur(25px) saturate(120%)",
          },
        },
      }}
      PaperProps={{
        sx: {
          backgroundColor: "rgba(31, 19, 9, 0.92)",
          backdropFilter: "blur(40px) saturate(150%)",
          WebkitBackdropFilter: "blur(40px) saturate(150%)",
          borderRadius: "24px",
          border: "2px solid rgba(212, 175, 55, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Montserrat', sans-serif",
          borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
          pb: 2,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: "transparent",
          color: "#f5e6d3",
        }}
      >
        {/* Mensaje informativo sobre los datos de la cuenta */}
        <Alert
          severity="info"
          sx={{
            mb: 2,
            backgroundColor: "rgba(201, 168, 90, 0.16)",
            color: "#f5e6d3",
            border: "1px solid rgba(201, 168, 90, 0.4)",
            "& .MuiAlert-icon": {
              color: "#f4d03f",
            },
          }}
        >
          Asegúrese que sean los datos correctos de su cuenta.  
          Si no son correctos, diríjase al perfil y cambie sus datos antes de continuar.
        </Alert>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: "rgba(201, 100, 90, 0.2)",
              color: "#ffbdbd",
              border: "1px solid rgba(201, 100, 90, 0.4)",
              "& .MuiAlert-icon": {
                color: "#ffbdbd",
              },
            }}
          >
            {error}
          </Alert>
        )}

        {localError && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              backgroundColor: "rgba(201, 168, 90, 0.2)",
              color: "#f5e6d3",
              border: "1px solid rgba(201, 168, 90, 0.4)",
              "& .MuiAlert-icon": {
                color: "#f4d03f",
              },
            }}
          >
            {localError}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Banco destino"
            value={form.bankName}
            disabled
            sx={textFieldStyles}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Tipo"
              value={form.docType}
              disabled
              sx={textFieldStyles}
            />
            <TextField
              fullWidth
              label="Cédula"
              value={form.docId}
              disabled
              sx={textFieldStyles}
            />
          </Stack>

          <TextField
            fullWidth
            label="Teléfono asociado"
            value={form.phone}
            disabled
            sx={textFieldStyles}
          />

          <TextField
            fullWidth
            type="number"
            label={`Monto a retirar (${currency})`}
            value={form.amount}
            onChange={handleChange("amount")}
            inputProps={{ min: 0, step: "any" }}
            sx={textFieldStyles}
            helperText={`Monto mínimo para retirar: ${minAmount} ${currency}`}
          />

          <TextField
            fullWidth
            label="Notas (opcional)"
            multiline
            minRows={2}
            value={form.notes}
            onChange={handleChange("notes")}
            sx={textFieldStyles}
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: "transparent",
          borderTop: "1px solid rgba(212, 175, 55, 0.25)",
          p: 3,
          gap: 2,
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            color: "#f5e6d3",
            borderColor: "rgba(212, 175, 55, 0.3)",
            "&:hover": {
              borderColor: "rgba(212, 175, 55, 0.5)",
              bgcolor: "rgba(212, 175, 55, 0.1)",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            background:
              "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
            border: "1.5px solid rgba(212, 175, 55, 1)",
            boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
            color: "#1a1008",
            fontWeight: 700,
            "&:hover": {
              background:
                "linear-gradient(135deg, rgba(244, 208, 63, 1) 0%, rgba(255, 223, 0, 1) 50%, rgba(244, 208, 63, 1) 100%)",
              boxShadow: "0 4px 16px rgba(212, 175, 55, 0.7)",
            },
          }}
        >
          Confirmar retiro
        </Button>
      </DialogActions>
    </Dialog>
  );
};
