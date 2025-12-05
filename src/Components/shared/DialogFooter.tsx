// src/Components/shared/DialogFooter.tsx
import React from "react";
import { DialogActions, Button } from "@mui/material";
import { COLORS } from "../../constants/colors";

type DialogFooterProps = {
  onClose: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  showBack?: boolean;
  showNext?: boolean;
  showSubmit?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  nextLabel?: string;
  backLabel?: string;
  cancelLabel?: string;
};

export const DialogFooter: React.FC<DialogFooterProps> = ({
  onClose,
  onBack,
  onNext,
  onSubmit,
  showBack = false,
  showNext = false,
  showSubmit = false,
  isSubmitting = false,
  submitLabel = "Confirmar y enviar",
  nextLabel = "Siguiente",
  backLabel = "Atrás",
  cancelLabel = "Cancelar",
}) => {
  return (
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
        onClick={onClose}
        sx={{
          color: COLORS.TEXT.SECONDARY,
          fontWeight: 600,
          "&:hover": { bgcolor: "#f0f0f0" },
        }}
      >
        {cancelLabel}
      </Button>

      {showBack && onBack && (
        <Button
          onClick={onBack}
          sx={{
            bgcolor: `${COLORS.BUTTON.RED} !important`,
            color: `${COLORS.BACKGROUND.WHITE} !important`,
            fontWeight: 600,
            textTransform: "none",
            px: 3,
            py: 1.5,
            "&:hover": {
              bgcolor: `${COLORS.BUTTON.RED_HOVER} !important`,
            },
          }}
        >
          {backLabel}
        </Button>
      )}

      {showNext && onNext && (
        <Button
          variant="contained"
          onClick={onNext}
          sx={{
            bgcolor: COLORS.GOLD.BASE,
            color: COLORS.TEXT.PRIMARY,
            fontWeight: 700,
            px: 4,
            "&:hover": {
              bgcolor: COLORS.GOLD.DARK,
            },
          }}
        >
          {nextLabel}
        </Button>
      )}

      {showSubmit && onSubmit && (
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={isSubmitting}
          sx={{
            bgcolor: COLORS.GOLD.BASE,
            color: COLORS.TEXT.PRIMARY,
            fontWeight: 700,
            px: 4,
            "&:hover": {
              bgcolor: COLORS.GOLD.DARK,
            },
            "&:disabled": {
              bgcolor: "#ddd",
              color: COLORS.TEXT.DISABLED,
            },
          }}
        >
          {isSubmitting ? "Enviando..." : submitLabel}
        </Button>
      )}
    </DialogActions>
  );
};

