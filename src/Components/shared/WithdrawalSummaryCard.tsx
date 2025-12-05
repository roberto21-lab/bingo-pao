// src/Components/shared/WithdrawalSummaryCard.tsx
import React from "react";
import { Paper, Stack, Box, Typography, Divider, Alert } from "@mui/material";
import { COLORS } from "../../constants/colors";

type WithdrawalSummaryCardProps = {
  requestedAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  transferAmount: number;
  bankName: string;
  currency: string;
  showWarning?: boolean;
};

export const WithdrawalSummaryCard: React.FC<WithdrawalSummaryCardProps> = ({
  requestedAmount,
  commissionPercent,
  commissionAmount,
  transferAmount,
  bankName,
  currency,
  showWarning = true,
}) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 600, mb: 2 }}>
        Resumen del retiro
      </Typography>

      <Alert severity="info" sx={{ bgcolor: "#e3f2fd", color: "#1565c0", border: "1px solid #90caf9" }}>
        La aplicación cobra una comisión del {commissionPercent}% por cada retiro.
      </Alert>

      <Paper elevation={0} sx={{ p: 3, bgcolor: COLORS.BACKGROUND.LIGHT, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
              Monto solicitado
            </Typography>
            <Typography variant="h5" sx={{ color: COLORS.GOLD.BASE, fontWeight: 700 }}>
              {requestedAmount.toFixed(2)} {currency}
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
              Comisión ({commissionPercent}%)
            </Typography>
            <Typography variant="h6" sx={{ color: "#f44336", fontWeight: 600 }}>
              -{commissionAmount.toFixed(2)} {currency}
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
              Monto a transferir
            </Typography>
            <Typography variant="h5" sx={{ color: "#2e7d32", fontWeight: 700 }}>
              {transferAmount.toFixed(2)} {currency}
            </Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
              Banco destino
            </Typography>
            <Typography variant="body1" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 500 }}>
              {bankName}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {showWarning && (
        <Alert severity="warning" sx={{ bgcolor: "#fff3e0", color: "#e65100", border: "1px solid #ffb74d" }}>
          Se descontarán {requestedAmount.toFixed(2)} {currency} de su saldo disponible.
          El monto de {transferAmount.toFixed(2)} {currency} será transferido a su cuenta bancaria una vez aprobado por el administrador.
        </Alert>
      )}
    </Stack>
  );
};

