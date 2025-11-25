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
  accountNumber: string;
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
  accountInfo?: {
    bankName: string;
    accountNumber?: string;
    docType: "V" | "E";
    docId: string;
    phone: string;
  };
  bankAccount?: {
    _id: string;
    bank_name: string;
    account_number: string;
    phone_number: string;
    document_number: string;
    document_type_id: {
      _id: string;
      name: string;
      code: string;
    };
  } | null;
  onDeleteBankAccount?: () => void;
  minAmount?: number; // por defecto 500
  hasBankAccount: boolean; // Indica si el usuario tiene cuenta bancaria
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

const createDefaultState = (accountInfo?: WithdrawRequestDialogProps["accountInfo"]): WithdrawRequestFormState => ({
  bankName: accountInfo?.bankName || "",
  accountNumber: accountInfo?.accountNumber || "",
  docType: accountInfo?.docType || "V",
  docId: accountInfo?.docId || "",
  phone: accountInfo?.phone || "",
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
  bankAccount,
  onDeleteBankAccount,
  minAmount = 500,
  hasBankAccount = false,
}) => {
  const [form, setForm] = useState<WithdrawRequestFormState>(
    createDefaultState(accountInfo)
  );
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Si hay cuenta bancaria, usar sus datos, sino usar accountInfo
      if (bankAccount) {
        setForm({
          bankName: bankAccount.bank_name,
          accountNumber: bankAccount.account_number,
          docType: bankAccount.document_type_id.code === "ci" ? "V" : "E",
          docId: bankAccount.document_number,
          phone: bankAccount.phone_number,
          amount: "",
          notes: "",
        });
      } else {
      setForm(createDefaultState(accountInfo));
      }
      setLocalError(null);
    }
  }, [open, accountInfo, bankAccount]);

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

    // Si no hay cuenta bancaria, validar que todos los campos estén completos
    if (!hasBankAccount) {
      if (!form.bankName || !form.accountNumber || !form.docId || !form.phone) {
        setLocalError("Por favor complete todos los campos requeridos.");
        return;
      }
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
        {/* Mensaje informativo */}
        {hasBankAccount ? (
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
            Se utilizará la cuenta bancaria registrada. Si desea cambiar la cuenta, debe eliminar la actual primero.
          </Alert>
        ) : (
          <Alert
            severity="warning"
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
            No tiene una cuenta bancaria registrada. Complete el formulario para crear una cuenta y realizar el retiro.
            Asegúrese que los datos coincidan con su perfil.
        </Alert>
        )}

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
          {hasBankAccount ? (
            <>
              {/* Mostrar datos de cuenta bancaria existente */}
          <TextField
            fullWidth
            label="Banco destino"
            value={form.bankName}
            disabled
            sx={textFieldStyles}
          />
              <TextField
                fullWidth
                label="Número de cuenta"
                value={form.accountNumber}
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
              {onDeleteBankAccount && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={onDeleteBankAccount}
                  sx={{
                    borderColor: "rgba(244, 67, 54, 0.5)",
                    color: "#f44336",
                    "&:hover": {
                      borderColor: "rgba(244, 67, 54, 0.8)",
                      bgcolor: "rgba(244, 67, 54, 0.1)",
                    },
                  }}
                >
                  Eliminar cuenta bancaria
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Mostrar formulario para crear cuenta bancaria */}
              <TextField
                fullWidth
                label="Banco destino"
                value={form.bankName}
                onChange={handleChange("bankName")}
                required
                sx={textFieldStyles}
                select
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Seleccione un banco</option>
                <option value="Banco de Venezuela">Banco de Venezuela</option>
                <option value="Banco Provincial">Banco Provincial</option>
                <option value="Banesco">Banesco</option>
                <option value="Mercantil">Mercantil</option>
                <option value="BOD">BOD</option>
                <option value="Banco del Tesoro">Banco del Tesoro</option>
                <option value="Bancamiga">Bancamiga</option>
              </TextField>
              <TextField
                fullWidth
                label="Número de cuenta"
                value={form.accountNumber}
                onChange={handleChange("accountNumber")}
                required
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
            </>
          )}

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
