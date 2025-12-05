// src/Components/shared/EnrollmentSummary.tsx
import React from "react";
import { Box, Stack, Typography } from "@mui/material";

type EnrollmentSummaryProps = {
  selectedCount: number;
  totalPrice: number;
  availableBalance: number;
  currency: string;
};

export const EnrollmentSummary: React.FC<EnrollmentSummaryProps> = ({
  selectedCount,
  totalPrice,
  availableBalance,
  currency,
}) => {
  return (
    <Box
      sx={{
        background: "rgba(31, 34, 51, 0.5)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        p: 2.5,
        mt: 4,
        mb: 3,
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
            Cartones Seleccionados:
          </Typography>
          <Typography variant="body2" sx={{ color: "#f5e6d3", fontWeight: 600 }}>
            {selectedCount}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
            Precio Total:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ color: "#f5e6d3", fontWeight: 700, fontSize: "16px" }}
            >
              {totalPrice.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
              {currency}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
            Saldo Disponible:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ color: "#f5e6d3", fontWeight: 700, fontSize: "16px" }}
            >
              {availableBalance.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
              {currency}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

