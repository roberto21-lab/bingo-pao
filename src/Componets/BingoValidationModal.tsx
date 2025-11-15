import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import type { BingoGrid } from "../utils/bingo";
import WinningCardDisplay from "./WinningCardDisplay";
import CalledNumbersTable from "./CalledNumbersTable";

type BingoValidationModalProps = {
  open: boolean;
  onClose: () => void;
  winningCard: BingoGrid;
  winningCardId: number;
  markedNumbers: Set<string>;
  calledNumbers: Set<string>;
};

export default function BingoValidationModal({
  open,
  onClose,
  winningCard,
  winningCardId,
  markedNumbers,
  calledNumbers,
}: BingoValidationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#1a1d2e",
          borderRadius: "20px",
          border: "2px solid rgba(227, 191, 112, 0.5)",
        },
      }}
    >
      <DialogContent sx={{ p: 4 }}>
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            color: "#e3bf70",
            fontWeight: 900,
            mb: 3,
            fontFamily: "'Montserrat', sans-serif",
            textShadow: "0 2px 8px rgba(227, 191, 112, 0.5)",
          }}
        >
          ¡BINGO GANADOR!
        </Typography>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", md: "50%" } }}>
            <WinningCardDisplay
              card={winningCard}
              cardId={winningCardId}
              markedNumbers={markedNumbers}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: { xs: "100%", md: "50%" } }}>
            <CalledNumbersTable
              calledNumbers={calledNumbers}
              markedNumbers={markedNumbers}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, justifyContent: "center" }}>
        <Button
          onClick={onClose}
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: "12px",
            textTransform: "none",
            backgroundColor: "rgba(244, 67, 54, 0.9)",
            color: "#ffffff",
            border: "1px solid rgba(244, 67, 54, 0.5)",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
            "&:hover": {
              backgroundColor: "rgba(244, 67, 54, 1)",
              boxShadow: "0 6px 16px rgba(244, 67, 54, 0.4)",
              transform: "translateY(-1px)",
            },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

