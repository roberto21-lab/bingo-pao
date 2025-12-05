// src/Components/shared/BankAccountInfoCard.tsx
import React from "react";
import { Paper, Stack, Box, Typography, Divider } from "@mui/material";
import { COLORS } from "../../constants/colors";

type BankAccountInfoCardProps = {
  bankName: string;
  documentId: string;
  phone: string;
};

export const BankAccountInfoCard: React.FC<BankAccountInfoCardProps> = ({
  bankName,
  documentId,
  phone,
}) => {
  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: COLORS.BACKGROUND.DISABLED, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
            Banco destino
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 500 }}>
            {bankName}
          </Typography>
        </Box>
        <Divider />
        <Box>
          <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
            Documento
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 500 }}>
            {documentId}
          </Typography>
        </Box>
        <Divider />
        <Box>
          <Typography variant="caption" sx={{ color: COLORS.TEXT.SECONDARY, fontWeight: 600 }}>
            Teléfono
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.TEXT.PRIMARY, fontWeight: 500 }}>
            {phone}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

