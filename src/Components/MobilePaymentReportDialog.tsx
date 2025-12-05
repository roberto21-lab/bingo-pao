// src/components/MobilePaymentReportDialog.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  Alert,
  Stack,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import { createTransactionService, type CreateTransactionPayload } from "../Services/transaction.service";
import { getTransactionTypeByName } from "../Services/transactionTypes.service";
import { getStatusByNameAndCategory } from "../Services/status.service";
import { getWalletByUser } from "../Services/wallets.service";
import { getUserId } from "../Services/auth.service";
import { DocumentTypeSelect } from "./DocumentTypeSelect";
import { COLORS } from "../constants/colors";
import { commonInputStyles } from "./shared/formStyles";
import { StyledDatePicker } from "./shared/StyledDatePicker";
import { BankSelect } from "./shared/BankSelect";
import { FormStepper } from "./shared/FormStepper";
import { SummaryCard } from "./shared/SummaryCard";
import { DialogHeader } from "./shared/DialogHeader";
import { DialogFooter } from "./shared/DialogFooter";
import { DatePickerGlobalStyles } from "./shared/DatePickerGlobalStyles";

// ============================================================================
// TIPOS
// ============================================================================
export type MobilePaymentReportFormState = {
  bankName: string;
  document_type_id: string;
  payerDocId: string;
  payerPhone: string;
  amount: string;
  referenceCode: string;
  paymentDate: string;
};

type AccountInfo = {
  document_type_id?: string;
  docId?: string;
  phone?: string;
};

type MobilePaymentReportDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MobilePaymentReportFormState) => void;
  onError?: (errorMessage: string) => void;
  error?: string | null;
  banks: string[];
  currency: string;
  title?: string;
  initialValues?: Partial<MobilePaymentReportFormState>;
  accountInfo?: AccountInfo;
  bankAccount?: { bank_name: string } | null;
};

// ============================================================================
// CONSTANTES
// ============================================================================
const steps = ["Datos bancarios", "Monto y referencia", "Confirmación"];

const defaultFormState: MobilePaymentReportFormState = {
  bankName: "",
  document_type_id: "",
  payerDocId: "",
  payerPhone: "",
  amount: "",
  referenceCode: "",
  paymentDate: new Date().toISOString().split('T')[0],
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export const MobilePaymentReportDialog: React.FC<MobilePaymentReportDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onError,
  error,
  banks,
  currency,
  title = "Reportar pago móvil",
  initialValues,
  accountInfo,
  bankAccount,
}) => {
  const createInitialState = useCallback((): MobilePaymentReportFormState => {
    const state = { ...defaultFormState, ...initialValues };
    
    if (bankAccount) {
      state.bankName = bankAccount.bank_name;
    }
    
    if (accountInfo) {
      if (accountInfo.document_type_id) state.document_type_id = accountInfo.document_type_id;
      if (accountInfo.docId) state.payerDocId = accountInfo.docId;
      if (accountInfo.phone) state.payerPhone = accountInfo.phone;
    }
    
    return state;
  }, [initialValues, bankAccount, accountInfo]);

  const [form, setForm] = useState<MobilePaymentReportFormState>(createInitialState());
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(createInitialState());
      setSubmitError(null);
      setActiveStep(0);
    }
  }, [open, createInitialState]);

  const handleChange = (field: keyof MobilePaymentReportFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleDocumentTypeChange = (value: string) => {
    setForm((prev) => ({ ...prev, document_type_id: value }));
  };

  const validateStep = (step: number): boolean => {
    setSubmitError(null);
    
    if (step === 0) {
      if (!form.bankName) {
        setSubmitError("Debe seleccionar un banco");
        return false;
      }
      if (!form.document_type_id) {
        setSubmitError("Debe seleccionar un tipo de documento");
        return false;
      }
      if (!form.payerDocId.trim()) {
        setSubmitError("El número de documento es obligatorio");
        return false;
      }
      if (!form.payerPhone.trim()) {
        setSubmitError("El número de teléfono es obligatorio");
        return false;
      }
    } else if (step === 1) {
      if (!form.amount || Number(form.amount) <= 0) {
        setSubmitError("El monto debe ser mayor a 0");
        return false;
      }
      if (!form.referenceCode.trim()) {
        setSubmitError("El número de referencia es obligatorio");
        return false;
      }
      if (!form.paymentDate) {
        setSubmitError("La fecha del pago es obligatoria");
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const userId = getUserId();
      if (!userId) {
        setSubmitError("No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.");
        setIsSubmitting(false);
        return;
      }

      const wallet = await getWalletByUser(userId);
      if (!wallet || !wallet._id) {
        setSubmitError("No se encontró la wallet del usuario");
        setIsSubmitting(false);
        return;
      }

      // Verificar si existe una cuenta bancaria, si no existe, crearla automáticamente
      const { getBankAccountByUser, createBankAccount } = await import("../Services/bankAccounts.service");
      let bankAccount = await getBankAccountByUser(userId);
      
      if (!bankAccount) {
        // Crear cuenta bancaria automáticamente con los datos del formulario
        try {
          const newBankAccount = await createBankAccount({
            userId,
            bank_name: form.bankName,
            account_number: "", // Opcional, no se requiere
            phone_number: form.payerPhone,
            document_number: form.payerDocId,
            document_type_id: form.document_type_id,
          });
          bankAccount = newBankAccount.bank_account;
          console.log("✅ Cuenta bancaria creada automáticamente:", bankAccount._id);
        } catch (error: any) {
          // Si falla la creación de la cuenta bancaria, verificar si es porque ya existe
          // Si es otro error, mostrar el mensaje pero continuar con la transacción
          const errorMessage = error?.response?.data?.message || error?.message || "Error al crear cuenta bancaria";
          console.warn("⚠️ No se pudo crear la cuenta bancaria automáticamente:", errorMessage);
          
          // Si el error es que ya existe, está bien, continuar
          // Si es otro error, también continuar (la transacción se puede crear sin cuenta bancaria)
          // No bloquear el flujo por esto
        }
      }

      const rechargeType = await getTransactionTypeByName("recharge");
      if (!rechargeType || !rechargeType._id) {
        setSubmitError("No se encontró el tipo de transacción 'recharge'");
        setIsSubmitting(false);
        return;
      }

      const pendingStatus = await getStatusByNameAndCategory("pending", "transaction");
      if (!pendingStatus || !pendingStatus._id) {
        setSubmitError("No se encontró el status 'pending' para transacciones");
        setIsSubmitting(false);
        return;
      }

      let currencyId: string;
      if (typeof wallet.currency_id === "string") {
        currencyId = wallet.currency_id;
      } else if (wallet.currency_id && typeof wallet.currency_id === "object" && "_id" in wallet.currency_id) {
        const currencyObj = wallet.currency_id as { _id: string | { toString(): string } };
        currencyId = typeof currencyObj._id === "string" ? currencyObj._id : currencyObj._id.toString();
      } else {
        // Si no hay currency_id, intentar obtenerlo de nuevo (el backend debería haberlo corregido)
        console.warn("⚠️ Wallet no tiene currency_id, recargando wallet...");
        const reloadedWallet = await getWalletByUser(userId);
        if (reloadedWallet && reloadedWallet.currency_id) {
          if (typeof reloadedWallet.currency_id === "string") {
            currencyId = reloadedWallet.currency_id;
          } else if (typeof reloadedWallet.currency_id === "object" && "_id" in reloadedWallet.currency_id) {
            const currencyObj = reloadedWallet.currency_id as { _id: string | { toString(): string } };
            currencyId = typeof currencyObj._id === "string" ? currencyObj._id : currencyObj._id.toString();
          } else {
            setSubmitError("No se encontró la moneda de la wallet. Por favor, contacta al soporte.");
            setIsSubmitting(false);
            return;
          }
        } else {
          setSubmitError("No se encontró la moneda de la wallet. Por favor, contacta al soporte.");
        setIsSubmitting(false);
        return;
        }
      }

      const metadata = {
        bank_name: form.bankName,
        document_type_id: form.document_type_id,
        document_number: form.payerDocId,
        phone_number: form.payerPhone,
        amount: Number(form.amount),
        reference_code: form.referenceCode.trim(),
        payment_date: form.paymentDate,
      };

      const payload: CreateTransactionPayload = {
        wallet_id: wallet._id,
        transaction_type_id: rechargeType._id,
        amount: Number(form.amount),
        currency_id: currencyId,
        status_id: pendingStatus._id,
        metadata,
      };

      // Crear la transacción de recarga
      console.log("🔄 Creando transacción de recarga...");
      await createTransactionService(payload);
      console.log("✅ Transacción de recarga creada exitosamente");
      
      // Ejecutar onSubmit (que actualiza el wallet y muestra el toaster)
      // onSubmit puede ser async o sync, manejarlo apropiadamente
      try {
        console.log("🔄 Ejecutando onSubmit...");
        const result = onSubmit(form);
        // Verificar si es una Promise usando type guard
        if (result !== undefined && result !== null && typeof result === 'object' && 'then' in result && typeof (result as any).then === 'function') {
          await result;
        }
        console.log("✅ onSubmit completado exitosamente");
        
        // Cerrar el modal después de que onSubmit termine exitosamente
        // Usar un pequeño delay para asegurar que el toaster se muestre antes de cerrar el modal
        setTimeout(() => {
          console.log("🔄 Cerrando modal...");
          onClose();
        }, 100);
      } catch (error) {
        console.error("❌ Error en onSubmit después de crear transacción:", error);
        // Si hay un error en onSubmit, mostrar el error pero cerrar el modal de todas formas
        // porque la transacción ya se creó exitosamente
        if (onError) {
          const errorMessage = error instanceof Error ? error.message : "Error al procesar la recarga";
          onError(errorMessage);
        }
        // Cerrar el modal de todas formas porque la transacción se creó
        setTimeout(() => {
      onClose();
        }, 500);
      }
    } catch (err: unknown) {
      console.error("❌ Error en handleSubmit:", err);
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (err as { message?: string })?.message || 
                          "Error al crear la transacción de recarga";
      setSubmitError(errorMessage);
      // Notificar al componente padre si hay un callback de error
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
      console.log("🔄 handleSubmit finalizado, isSubmitting = false");
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 1 }}>
              Información bancaria
            </Typography>

            <BankSelect
              value={form.bankName}
              onChange={(value) => setForm((prev) => ({ ...prev, bankName: value }))}
              banks={banks}
              disabled={!!bankAccount}
              required
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DocumentTypeSelect
                value={form.document_type_id}
                onChange={handleDocumentTypeChange}
                label="Tipo de documento"
                required
                fullWidth
                disabled={!!accountInfo?.document_type_id}
                sx={commonInputStyles}
              />
              <TextField
                fullWidth
                label="Número de documento"
                value={form.payerDocId}
                onChange={handleChange("payerDocId")}
                required
                disabled={!!accountInfo?.docId}
                sx={commonInputStyles}
              />
            </Stack>

            <TextField
              fullWidth
              label="Teléfono"
              value={form.payerPhone}
              onChange={handleChange("payerPhone")}
              placeholder="0412-0000000"
              required
              disabled={!!accountInfo?.phone}
              sx={commonInputStyles}
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 1 }}>
              Detalles del pago
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                type="number"
                label={`Monto (${currency})`}
                value={form.amount}
                onChange={handleChange("amount")}
                inputProps={{ min: 0, step: "any" }}
                required
                sx={commonInputStyles}
              />

              <StyledDatePicker
                label="Fecha del pago"
                value={form.paymentDate ? new Date(form.paymentDate) : new Date()}
                onChange={(newValue) => {
                  if (newValue) {
                    const dateStr = newValue.toISOString().split('T')[0];
                    setForm((prev) => ({ ...prev, paymentDate: dateStr }));
                  }
                }}
                maxDate={new Date()}
                required
              />
            </Stack>

            <TextField
              fullWidth
              label="Número o codigo de referencia"
              value={form.referenceCode}
              onChange={handleChange("referenceCode")}
              placeholder="Ej: 56555555"
              required
              helperText="Este número debe ser único para el banco seleccionado"
              sx={commonInputStyles}
            />
          </Stack>
        );

      case 2:
        return (
          <SummaryCard
            title="Resumen de la transacción"
            items={[
              {
                label: "Banco",
                value: form.bankName || "No especificado",
              },
              {
                label: "Documento",
                value: form.payerDocId || "No especificado",
              },
              {
                label: "Teléfono",
                value: form.payerPhone || "No especificado",
              },
              {
                label: "Monto",
                value: form.amount ? `${form.amount} ${currency}` : "No especificado",
                highlight: true,
              },
              {
                label: "Fecha del pago",
                value: form.paymentDate ? new Date(form.paymentDate).toLocaleDateString('es-VE') : "No especificada",
              },
              {
                label: "Número de referencia",
                value: form.referenceCode || "No especificado",
                monospace: true,
              },
            ]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <DatePickerGlobalStyles />
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: COLORS.BACKGROUND.WHITE,
            borderRadius: 3,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            width: { xs: "95%", sm: "90%", md: "600px" },
            maxWidth: { xs: "95%", sm: "90%", md: "600px" },
            m: { xs: 2, sm: 3 },
          },
        }}
      >
        <DialogHeader title={title} />

        <DialogContent sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 }, bgcolor: COLORS.BACKGROUND.WHITE }}>
          <FormStepper steps={steps} activeStep={activeStep} />

          {(error || submitError) && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: "#fee",
                color: "#c00",
                border: "2px solid #fcc",
                "& .MuiAlert-icon": { color: "#c00" },
              }}
            >
              {error || submitError}
            </Alert>
          )}

          <Box sx={{ minHeight: { xs: 250, sm: 300 } }}>
            {renderStepContent(activeStep)}
          </Box>
        </DialogContent>

        <DialogFooter
          onClose={onClose}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          showBack={activeStep > 0}
          showNext={activeStep < steps.length - 1}
          showSubmit={activeStep === steps.length - 1}
          isSubmitting={isSubmitting}
        />
      </Dialog>
    </>
  );
};
