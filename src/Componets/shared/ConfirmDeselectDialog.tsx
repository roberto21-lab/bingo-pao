// src/Componets/shared/ConfirmDeselectDialog.tsx
import React from "react";
import { DialogContent, DialogActions, Typography, Box } from "@mui/material";
import { GlassDialog } from "./GlassDialog";
import { MetallicButton } from "./MetallicButton";

type ConfirmDeselectDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const ConfirmDeselectDialog: React.FC<ConfirmDeselectDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <GlassDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
        <Typography
          variant="h5"
          sx={{
            textAlign: "center",
            color: "#f5e6d3",
            fontWeight: 700,
            mb: 2,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          ¿Deseas deseleccionar este cartón?
        </Typography>

        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: "12px",
            backgroundColor: "rgba(255, 152, 0, 0.15)",
            border: "1px solid rgba(255, 152, 0, 0.3)",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#f5e6d3",
              textAlign: "center",
              opacity: 0.9,
              lineHeight: 1.6,
              fontSize: "14px",
            }}
          >
            Si otra persona lo selecciona, ya no podrás elegirlo nuevamente.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 0, gap: 2, justifyContent: "center", position: "relative", zIndex: 1 }}>
        <MetallicButton variant="gray" onClick={onClose} sx={{ flex: 1 }}>
          Cancelar
        </MetallicButton>
        <MetallicButton variant="red" onClick={onConfirm} sx={{ flex: 1 }}>
          Deseleccionar
        </MetallicButton>
      </DialogActions>
    </GlassDialog>
  );
};

