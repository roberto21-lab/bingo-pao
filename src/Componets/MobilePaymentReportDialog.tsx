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
import { getTransactionTypeByName } from "../Services/transactionTypes.service";
import { getStatusByNameAndCategory } from "../Services/status.service";
import { getWalletByUser } from "../Services/wallets.service";
import { getUserId } from "../Services/auth.service";


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


  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // Validaciones básicas
      if (!form.refCode.trim()) {
        setSubmitError("El código de referencia es obligatorio");
        setIsSubmitting(false);
        return;
      }
      if (!form.bankName) {
        setSubmitError("Debe seleccionar un banco");
        setIsSubmitting(false);
        return;
      }
      if (!form.amount || Number(form.amount) <= 0) {
        setSubmitError("El monto debe ser mayor a 0");
        setIsSubmitting(false);
        return;
      }

      // Obtener userId
      const userId = getUserId();
      if (!userId) {
        setSubmitError("No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.");
        setIsSubmitting(false);
        return;
      }

      // Obtener wallet del usuario
      const wallet = await getWalletByUser(userId);
      if (!wallet || !wallet._id) {
        setSubmitError("No se encontró la wallet del usuario");
        setIsSubmitting(false);
        return;
      }

      // Obtener transaction type "recharge"
      const rechargeType = await getTransactionTypeByName("recharge");
      if (!rechargeType || !rechargeType._id) {
        setSubmitError("No se encontró el tipo de transacción 'recharge'");
        setIsSubmitting(false);
        return;
      }

      // Obtener status "pending" para transactions
      const pendingStatus = await getStatusByNameAndCategory("pending", "transaction");
      if (!pendingStatus || !pendingStatus._id) {
        setSubmitError("No se encontró el status 'pending' para transacciones");
        setIsSubmitting(false);
        return;
      }

      // Preparar metadata (excluir voucherFile y voucherPreview del payload)
      const { voucherFile, voucherPreview, ...metadata } = form;

      // Obtener currency_id del wallet (puede ser string o objeto)
      let currencyId: string;
      if (typeof wallet.currency_id === "string") {
        currencyId = wallet.currency_id;
      } else if (wallet.currency_id && typeof wallet.currency_id === "object" && "_id" in wallet.currency_id) {
        currencyId = (wallet.currency_id as any)._id.toString();
      } else {
        setSubmitError("No se encontró la moneda de la wallet");
        setIsSubmitting(false);
        return;
      }

      // Crear payload
      const payload: CreateTransactionPayload = {
        wallet_id: wallet._id,
        transaction_type_id: rechargeType._id,
        amount: Number(form.amount),
        currency_id: currencyId,
        status_id: pendingStatus._id,
        metadata: {
          ...metadata,
          // Si hay voucherFile, podrías subirlo a un servicio de almacenamiento y guardar la URL aquí
          // Por ahora solo guardamos la metadata sin el archivo
        },
      };

      console.log("🚀 Creando transacción de recarga:", payload);

      // Crear la transacción
      const transaction = await createTransactionService(payload);
      console.log("✅ Transacción creada exitosamente:", transaction);

      // Notificar al padre (para que pueda actualizar el wallet, cerrar el modal, etc.)
      onSubmit(form);

      // Cerrar el modal
      onClose();
    } catch (err: any) {
      console.error("❌ Error al crear transacción:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Error al crear la transacción de recarga";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
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
          {(error || submitError) && (
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
              {error || submitError}
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
            disabled={isSubmitting}
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
              "&:disabled": {
                opacity: 0.6,
                cursor: "not-allowed",
              },
            }}
          >
            {isSubmitting ? "Enviando..." : "Enviar reporte"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
