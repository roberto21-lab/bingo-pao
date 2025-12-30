// src/components/WithdrawRequestDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Alert,
  Stack,
  TextField,
  Box,
  Typography,
  Button,
  DialogActions,
} from "@mui/material";
import { DocumentTypeSelect } from "./DocumentTypeSelect";
import { COLORS } from "../constants/colors";
import { commonInputStyles } from "./shared/formStyles";
import { BankSelect } from "./shared/BankSelect";
import { FormStepper } from "./shared/FormStepper";
import { DialogHeader } from "./shared/DialogHeader";
import { DialogFooter } from "./shared/DialogFooter";
import { BankAccountInfoCard } from "./shared/BankAccountInfoCard";
import { WithdrawalSummaryCard } from "./shared/WithdrawalSummaryCard";
import { useAuth } from "../hooks/useAuth";
import { createBankAccount } from "../Services/bankAccounts.service";

// import { createBankAccount } from "../Services/bankAccounts.service";

export type WithdrawRequestFormState = {
  userId: string;
  bank_name: string;
  document_type_id: string;
  docId: string;
  phone_number: string;
  amount: string;
  notes: string;
};

type WithdrawRequestDialogProps = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WithdrawRequestFormState) => void;
  error?: string | null;
  currency: string;
  title?: string;
  accountInfo?: {
    bankName: string;
    document_type_id?: string;
    docId: string;
    phone: string;
  };
  availableBalance?: number;
  setBankAccount?: (bankAccount: WithdrawRequestDialogProps["bankAccount"] | null) => void;
  bankAccount?: {
    _id: string;
    bank_name: string;
    account_number?: string;
    phone_number: string;
    document_number: string;
    document_type_id: {
      _id: string;
      name: string;
      code: string;
    };
  } | null;
  onDeleteBankAccount?: () => void;
  minAmount?: number;
  hasBankAccount: boolean;
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

const createDefaultState = (accountInfo?: WithdrawRequestDialogProps["accountInfo"], userId?: string): WithdrawRequestFormState => ({
  userId: userId || "",
  bank_name: accountInfo?.bankName || "",
  document_type_id: accountInfo?.document_type_id || "",
  docId: accountInfo?.docId || "",
  phone_number: accountInfo?.phone || "",
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
  setBankAccount,
  onDeleteBankAccount,
  minAmount = 500,
  hasBankAccount = false,
  availableBalance,
}) => {
  const [form, setForm] = useState<WithdrawRequestFormState>(createDefaultState(accountInfo));
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const { user } = useAuth();
  console.log("🚀 ~ WithdrawRequestDialog ~ user:", user)
  const steps = hasBankAccount
    ? ["Monto a retirar", "Confirmación"]
    : ["Datos bancarios", "Monto a retirar", "Confirmación"];

  useEffect(() => {
    if (open) {
      if (bankAccount) {
     
        setForm({
          userId: user?.id || "",
          bank_name: bankAccount.bank_name || "",
          document_type_id: bankAccount.document_type_id._id || "",
          docId: bankAccount.document_number || "",
          phone_number: bankAccount.phone_number || "",
          amount: "",
          notes: "",
        });
      } else if (accountInfo) {
        setForm({
          userId: user?.id || "",
          bank_name: accountInfo.bankName || "",
          document_type_id: accountInfo.document_type_id || "",
          docId: accountInfo.docId || "",
          phone_number: accountInfo.phone || "",
          amount: "",
          notes: "",
        });
      } else {
        setForm(createDefaultState());
      }
      setLocalError(null);
      setActiveStep(0);
    }
  }, [open, accountInfo, bankAccount]);

  const handleChange = (field: keyof WithdrawRequestFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleDocumentTypeChange = (value: string) => {
    setForm((prev) => ({ ...prev, document_type_id: value }));
  };

  const validateStep = (step: number): boolean => {
    setLocalError(null);

    if (hasBankAccount) {
      if (step === 0) {
        const numericAmount = Number(form.amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          setLocalError("Ingrese un monto válido.");
          return false;
        }
        const minimumAmount = Math.max(minAmount, 500);
        if (numericAmount < minimumAmount) {
          setLocalError(`El monto mínimo para retirar es ${minimumAmount} ${currency}.`);
          return false;
        }
        if (availableBalance !== undefined && numericAmount > availableBalance) {
          setLocalError(`Saldo insuficiente. Saldo disponible: ${availableBalance.toFixed(2)} ${currency}`);
          return false;
        }
      }
    } else {
      if (step === 0) {
        if (!form.bank_name || form.bank_name === "Seleccione un banco") {
          setLocalError("Debe seleccionar un banco.");
          return false;
        }
        if (!form.document_type_id || !form.docId || !form.phone_number) {
          setLocalError("Por favor complete todos los campos requeridos.");
          return false;
        }
      } else if (step === 1) {
        const numericAmount = Number(form.amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          setLocalError("Ingrese un monto válido.");
          return false;
        }
        const minimumAmount = Math.max(minAmount, 500);
        if (numericAmount < minimumAmount) {
          setLocalError(`El monto mínimo para retirar es ${minimumAmount} ${currency}.`);
          return false;
        }
        if (availableBalance !== undefined && numericAmount > availableBalance) {
          setLocalError(`Saldo insuficiente. Saldo disponible: ${availableBalance.toFixed(2)} ${currency}`);
          return false;
        }
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
    setLocalError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = () => {
    if (validateStep(activeStep)) {
      onSubmit(form);
    }
  };

  const cretaBankAccount = async () => {
    try {
      console.log("Form original:", form);
      console.log("Usuario:", user);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        userId: user?.id,                     // 👈 CLAVE
        bank_name: form?.bank_name,             // 👈 mapeo
        phone_number: form.phone_number,             // 👈 mapeo
        document_number: form.docId,          // 👈 mapeo
        document_type_id: form.document_type_id,
        // account_number no lo tienes → no lo mandas (es opcional)
      };

      console.log("Payload final:", payload);

      const response = await createBankAccount(payload);
      setBankAccount(response.bank_account); // Actualiza el estado de la cuenta bancaria en el componente padre
      console.log("Cuenta bancaria creada:", response);
      setActiveStep((prevStep) => prevStep + 1);
   

      // aqui me falta algo para avanzar al siguiente paso ...
      // que basicamente es que como ya hay cuenta bancaria no deberia de mostrar el btn del registro de cuenta bancaria si no
      // los otros btns de siguiente y confirmar retiro
      


    } catch (error) {
      console.error("Error creando cuenta bancaria:", error);
    }
  };

  const btnDisable =
    !String(form?.bank_name ?? "").trim() ||
    !String(form?.phone_number ?? "").trim();



  //   const cretaBankAccount = async () => {
  //   try {
  //     console.log("Crear cuenta bancaria con los datos:", form);



  //     const response = await createBankAccount(form);

  //     console.log("Cuenta bancaria creada:", response);

  //     // 👉 feedback visual
  //     // enqueueSnackbar(response.message, { variant: "success" });

  //     // 👉 opcional: limpiar formulario
  //     // setForm(initialForm);

  //   } catch (error) {
  //     console.error("Error creando cuenta bancaria:", error);

  //     // enqueueSnackbar(
  //     //   error?.response?.data?.message || "Error creando cuenta bancaria",
  //     //   { variant: "error" }
  //     // );
  //   }
  // };

  const renderStepContent = (step: number) => {
    if (hasBankAccount) {
      if (step === 0) {
        return (
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 1 }}>
              Monto a retirar
            </Typography>

            <Alert severity="info" sx={{ bgcolor: "#e3f2fd", color: "#1565c0", border: "1px solid #90caf9" }}>
              Se utilizará la cuenta bancaria registrada. Si desea cambiar la cuenta, debe eliminar la actual primero.
            </Alert>

            <BankAccountInfoCard
              bankName={form.bank_name}
              documentId={form.docId}
              phone={form.phone_number}
            />

            {onDeleteBankAccount && (
              <Button
                variant="outlined"
                color="error"
                onClick={onDeleteBankAccount}
                sx={{
                  borderColor: "#f44336",
                  color: "#f44336",
                  "&:hover": { borderColor: "#d32f2f", bgcolor: "#ffebee" },
                }}
              >
                Eliminar cuenta bancaria
              </Button>
            )}

            <TextField
              fullWidth
              type="number"
              label={`Monto a retirar (${currency})`}
              value={form.amount}
              onChange={handleChange("amount")}
              inputProps={{ min: 500, step: "any" }}
              required
              helperText={
                availableBalance !== undefined
                  ? `Monto mínimo: 500 ${currency} | Saldo disponible: ${availableBalance.toFixed(2)} ${currency}`
                  : `Monto mínimo para retirar: 500 ${currency}`
              }
              sx={commonInputStyles}
            />

            <TextField
              fullWidth
              label="Notas (opcional)"
              multiline
              minRows={3}
              value={form.notes}
              onChange={handleChange("notes")}
              sx={commonInputStyles}
            />
          </Stack>
        );
      } else if (step === 1) {
        const numericAmount = Number(form.amount);
        const commissionPercent = 5;
        const commissionAmount = numericAmount * (commissionPercent / 100);
        const transferAmount = numericAmount - commissionAmount;

        return (
          <WithdrawalSummaryCard
            requestedAmount={numericAmount}
            commissionPercent={commissionPercent}
            commissionAmount={commissionAmount}
            transferAmount={transferAmount}
            bankName={form.bank_name}
            currency={currency}
          />
        );
      }
    } else {
      if (step === 0) {
        return (
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 1 }}>
              Registra tu información bancaria
            </Typography>

            <Alert severity="warning" sx={{ bgcolor: "#fff3e0", color: "#e65100", border: "1px solid #ffb74d" }}>
              No tiene una cuenta bancaria registrada. Complete el formulario para crear una cuenta y realizar el retiro.
              Asegúrese que los datos coincidan con su perfil.
            </Alert>

            <BankSelect
              value={form.bank_name}
              onChange={(value) => setForm((prev) => ({ ...prev, bank_name: value }))}
              banks={BANKS}
              required
              label="Banco destino"
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <DocumentTypeSelect
                value={form.document_type_id}
                onChange={handleDocumentTypeChange}
                disabled={!!accountInfo?.document_type_id}
                label="Tipo de documento"
                required
                fullWidth
                sx={commonInputStyles}
              />
              <TextField
                fullWidth
                label="Número de documento"
                value={form.docId}
                onChange={handleChange("docId")}
                required
                disabled={!!accountInfo?.docId}
                sx={commonInputStyles}
              />
            </Stack>

            <TextField
              fullWidth
              label="Teléfono asociado"
              value={form.phone_number}
              onChange={handleChange("phone_number")}
              required
              disabled={!!accountInfo?.phone}
              sx={commonInputStyles}
            />


          </Stack>
        );
      } else if (step === 1) {
        return (
          <Stack spacing={3}>
            <Typography variant="h6" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 1 }}>
              Monto a retirar
            </Typography>

            <TextField
              fullWidth
              type="number"
              label={`Monto a retirar (${currency})`}
              value={form.amount}
              onChange={handleChange("amount")}
              inputProps={{ min: 500, step: "any" }}
              required
              helperText={
                availableBalance !== undefined
                  ? `Monto mínimo: 500 ${currency} | Saldo disponible: ${availableBalance.toFixed(2)} ${currency}`
                  : `Monto mínimo para retirar: 500 ${currency}`
              }
              sx={commonInputStyles}
            />

            <TextField
              fullWidth
              label="Notas (opcional)"
              multiline
              minRows={3}
              value={form.notes}
              onChange={handleChange("notes")}
              sx={commonInputStyles}
            />
          </Stack>
        );
      } else if (step === 2) {
        const numericAmount = Number(form.amount);
        const commissionPercent = 5;
        const commissionAmount = numericAmount * (commissionPercent / 100);
        const transferAmount = numericAmount - commissionAmount;

        return (
          <WithdrawalSummaryCard
            requestedAmount={numericAmount}
            commissionPercent={commissionPercent}
            commissionAmount={commissionAmount}
            transferAmount={transferAmount}
            bankName={form.bank_name}
            currency={currency}
          />
        );
      }
    }

    return null;
  };

  return (
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

        {(error || localError) && (
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
            {error || localError}
          </Alert>
        )}

        <Box sx={{ minHeight: { xs: 250, sm: 300 } }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>


      {bankAccount ? (
        <DialogFooter
          onClose={onClose}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          showBack={activeStep > 0}
          showNext={activeStep < steps.length - 1}
          showSubmit={activeStep === steps.length - 1}
          submitLabel="Confirmar retiro"
        />
      ) : (
        <DialogActions
          sx={{
            bgcolor: COLORS.BACKGROUND.LIGHT,
            borderTop: "2px solid #e0e0e0",
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            gap: { xs: 1, sm: 2 },
            flexDirection: { xs: "column-reverse", sm: "row" },
            "& > *": {
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          <Button
          variant="contained"
          
            sx={{
                    color: "#000000",
                    fontWeight: 600,
                  }}
            disabled={btnDisable}
            onClick={cretaBankAccount}>
            Registra tu cuenta bancaria
          </Button>

        </DialogActions>

      )}

    </Dialog>
  );
};
