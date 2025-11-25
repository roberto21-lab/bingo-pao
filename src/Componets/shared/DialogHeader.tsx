// src/Componets/shared/DialogHeader.tsx
import React from "react";
import { DialogTitle } from "@mui/material";
import { COLORS } from "../../constants/colors";

type DialogHeaderProps = {
  title: string;
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ title }) => {
  return (
    <DialogTitle
      sx={{
        bgcolor: COLORS.GOLD.BASE,
        color: COLORS.TEXT.PRIMARY,
        fontWeight: 700,
        fontSize: "1.5rem",
        py: 2.5,
        borderBottom: `3px solid ${COLORS.GOLD.DARK}`,
      }}
    >
      {title}
    </DialogTitle>
  );
};

