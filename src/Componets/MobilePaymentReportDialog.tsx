// src/components/MobilePaymentReportDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  TextField,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import { createTransactionService, type CreateTransactionPayload } from "../Services/transactionService";


export type MobilePaymentReportFormState = {
  refCode: string;
  bankName: string;
  payerDocType: "V" | "E";
  payerDocId: string;
  payerPhone: string;
  amount: string;
  paidAt: string;
  notes: string;
  voucherPreview: string | null;
  voucherFile: File | null;
};

type MobilePaymentReportDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MobilePaymentReportFormState) => void;
  error?: string | null;
  banks: string[];
  currency: string;
  title?: string; // por si luego quieres cambiar el texto
  initialValues?: Partial<MobilePaymentReportFormState>;
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
};

const defaultFormState: MobilePaymentReportFormState = {
  refCode: "",
  bankName: "",
  payerDocType: "V",
  payerDocId: "",
  payerPhone: "",
  amount: "",
  paidAt: "",
  notes: "",
  voucherPreview: null,
  voucherFile: null,
};

export const MobilePaymentReportDialog: React.FC<
  MobilePaymentReportDialogProps
> = ({
  open,
  onClose,
  onSubmit,
  error,
  banks,
  currency,
  title = "Reportar pago móvil",
  initialValues,
}) => {
    const [form, setForm] = useState<MobilePaymentReportFormState>({
      ...defaultFormState,
      ...initialValues,
    });

    // Si cambian initialValues (por ejemplo al reabrir el modal con datos),
    // sincronizamos el estado interno:
    useEffect(() => {
      if (open) {
        setForm((prev) => ({
          ...defaultFormState,
          ...prev,
          ...initialValues,
        }));
      }
    }, [open, initialValues]);

    const handleChange =
      (field: keyof MobilePaymentReportFormState) =>
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
          }));
        };

    const handleSelectChange =
      (field: keyof MobilePaymentReportFormState) =>
        (event: any) => {
          setForm((prev) => ({
            ...prev,
            [field]: event.target.value,
          }));
        };

    const handleFileChange = (file: File | null) => {
      if (!file) {
        setForm((prev) => ({
          ...prev,
          voucherFile: null,
          voucherPreview: null,
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({
          ...prev,
          voucherFile: file,
          voucherPreview: typeof reader.result === "string" ? reader.result : null,
        }));
      };
      reader.readAsDataURL(file);
    };

    const handleClose = () => {
      onClose();
    };


const handleSubmit = async () => {
  // si todavía quieres notificar al padre:
  onSubmit(form);

  // ⚠️ Opcional: excluir voucherFile del metadata
  const { voucherFile, ...safeMetadata } = form;

  const payload: CreateTransactionPayload = {
    wallet_id: "6925bb3c927bb462bc5673f9",
    transaction_type_id: "691f9e32ed6cc17bc995dad1",
    amount: Number(form.amount),         // o form.amount si prefieres string
    currency_id: "691cbf660d374a9d0bb4cdc9",
    status_id: "691b4797b0a2446494b164cc",
    metadata: form,              // 👈 aquí va tu form
  };

  console.log("🚀 Payload que se enviará:", payload);

  try {
    const tx = await createTransactionService(payload);
    console.log("Transacción creada:", tx);
    // aquí puedes cerrar el modal, limpiar form, etc.
  } catch (err) {
    console.error("Error al crear transacción:", err);
    // setError en tu estado si quieres
  }
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
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: "rgba(201, 168, 90, 0.2)",
                color: "#c9a85a",
                border: "1px solid rgba(201, 168, 90, 0.4)",
                "& .MuiAlert-icon": {
                  color: "#c9a85a",
                },
              }}
            >
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Código de referencia"
              value={form.refCode}
              onChange={handleChange("refCode")}
              sx={textFieldStyles}
            />

            <TextField
              select
              fullWidth
              label="Banco emisor"
              value={form.bankName}
              onChange={handleSelectChange("bankName")}
              sx={textFieldStyles}
            >
              {banks.map((b) => (
                <MenuItem
                  key={b}
                  value={b}
                  sx={{
                    bgcolor: "rgba(31, 19, 9, 0.95)",
                    color: "#f5e6d3",
                    "&:hover": {
                      bgcolor: "rgba(212, 175, 55, 0.2)",
                    },
                    "&.Mui-selected": {
                      bgcolor: "rgba(212, 175, 55, 0.3)",
                      "&:hover": {
                        bgcolor: "rgba(212, 175, 55, 0.4)",
                      },
                    },
                  }}
                >
                  {b}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={form.payerDocType}
                onChange={handleSelectChange("payerDocType")}
                sx={textFieldStyles}
              >
                <MenuItem
                  value="V"
                  sx={{
                    bgcolor: "rgba(31, 19, 9, 0.95)",
                    color: "#f5e6d3",
                    "&:hover": {
                      bgcolor: "rgba(212, 175, 55, 0.2)",
                    },
                    "&.Mui-selected": {
                      bgcolor: "rgba(212, 175, 55, 0.3)",
                    },
                  }}
                >
                  V
                </MenuItem>
                <MenuItem
                  value="E"
                  sx={{
                    bgcolor: "rgba(31, 19, 9, 0.95)",
                    color: "#f5e6d3",
                    "&:hover": {
                      bgcolor: "rgba(212, 175, 55, 0.2)",
                    },
                    "&.Mui-selected": {
                      bgcolor: "rgba(212, 175, 55, 0.3)",
                    },
                  }}
                >
                  E
                </MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Cédula"
                value={form.payerDocId}
                onChange={handleChange("payerDocId")}
                sx={textFieldStyles}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Teléfono del pagador"
                value={form.payerPhone}
                onChange={handleChange("payerPhone")}
                placeholder="0412-0000000"
                sx={textFieldStyles}
              />

              <TextField
                fullWidth
                type="number"
                label={`Monto (${currency})`}
                value={form.amount}
                onChange={handleChange("amount")}
                inputProps={{ min: 0, step: "any" }}
                sx={textFieldStyles}
              />
            </Stack>

            <TextField
              fullWidth
              type="datetime-local"
              label="Fecha y hora del pago"
              value={form.paidAt}
              onChange={handleChange("paidAt")}
              InputLabelProps={{ shrink: true }}
              sx={textFieldStyles}
            />

            <Button
              component="label"
              variant="outlined"
              fullWidth
              sx={{
                color: "#f5e6d3",
                borderColor: "rgba(212, 175, 55, 0.3)",
                "&:hover": {
                  borderColor: "rgba(212, 175, 55, 0.5)",
                  bgcolor: "rgba(212, 175, 55, 0.1)",
                },
              }}
            >
              Subir comprobante (imagen)
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] ?? null)
                }
              />
            </Button>

            {form.voucherPreview && (
              <Box
                component="img"
                src={form.voucherPreview}
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
            Enviar reporte
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
