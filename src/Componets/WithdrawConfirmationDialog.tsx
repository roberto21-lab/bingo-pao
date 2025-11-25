import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Typography,
  Button,
  Divider,
  Box,
} from "@mui/material";

type WithdrawConfirmationDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requestedAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  transferAmount: number;
  currency: string;
};

export const WithdrawConfirmationDialog: React.FC<WithdrawConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  requestedAmount,
  commissionPercent,
  commissionAmount,
  transferAmount,
  currency,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        Confirmar retiro
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: "transparent",
          color: "#f5e6d3",
        }}
      >
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: "rgba(201, 168, 90, 0.16)",
            color: "#f5e6d3",
            border: "1px solid rgba(201, 168, 90, 0.4)",
            "& .MuiAlert-icon": {
              color: "#f4d03f",
            },
          }}
        >
          La aplicación cobra una comisión del {commissionPercent}% por cada retiro.
        </Alert>

        <Stack spacing={2}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(212, 175, 55, 0.1)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "rgba(245, 230, 211, 0.7)",
                mb: 1,
                fontSize: "0.875rem",
              }}
            >
              Monto solicitado
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#f4d03f",
              }}
            >
              {requestedAmount.toFixed(2)} {currency}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: "rgba(212, 175, 55, 0.3)" }} />

          <Stack spacing={1.5}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body1" sx={{ color: "#f5e6d3" }}>
                Comisión ({commissionPercent}%)
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: "rgba(245, 230, 211, 0.8)",
                }}
              >
                -{commissionAmount.toFixed(2)} {currency}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: "rgba(212, 175, 55, 0.2)" }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#f4d03f",
                }}
              >
                Monto a transferir
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "#f4d03f",
                }}
              >
                {transferAmount.toFixed(2)} {currency}
              </Typography>
            </Box>
          </Stack>

          <Alert
            severity="warning"
            sx={{
              mt: 2,
              backgroundColor: "rgba(201, 168, 90, 0.16)",
              color: "#f5e6d3",
              border: "1px solid rgba(201, 168, 90, 0.4)",
              "& .MuiAlert-icon": {
                color: "#f4d03f",
              },
            }}
          >
            Se descontarán {requestedAmount.toFixed(2)} {currency} de su saldo disponible.
            El monto de {transferAmount.toFixed(2)} {currency} será transferido a su cuenta bancaria una vez aprobado por el administrador.
          </Alert>
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
          onClick={onClose}
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
          onClick={onConfirm}
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

