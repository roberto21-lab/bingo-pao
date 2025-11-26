// src/Componets/shared/DialogHeader.tsx
import React from "react";
import { DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { COLORS } from "../../constants/colors";

type DialogHeaderProps = {
  title: string;
  onClose?: () => void;
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ title, onClose }) => {
  return (
    <DialogTitle
      sx={{
        bgcolor: COLORS.GOLD.BASE,
        color: COLORS.TEXT.PRIMARY,
        fontWeight: 700,
        fontSize: "1.5rem",
        py: 2.5,
        borderBottom: `3px solid ${COLORS.GOLD.DARK}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {title}
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            color: COLORS.TEXT.PRIMARY,
            "&:hover": {
              bgcolor: "rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  );
};

