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
  winningCardCode: string;
  markedNumbers: Set<string>;
  calledNumbers: Set<string>;
};

export default function BingoValidationModal({
  open,
  onClose,
  winningCard,
  winningCardCode,
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
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            px: 3,
            py: 1,
            borderRadius: "20px",
            background: "linear-gradient(135deg, #d4af37 0%, #f4d03f 30%, #ffd700 50%, #f4d03f 70%, #d4af37 100%)",
            backgroundSize: "200% 200%",
            animation: "shimmer 3s ease-in-out infinite",
            boxShadow: `
              0 4px 15px rgba(212, 175, 55, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.3),
              inset 0 -1px 0 rgba(0, 0, 0, 0.2),
              0 0 0 2px rgba(212, 175, 55, 0.3)
            `,
            border: "2px solid rgba(212, 175, 55, 0.6)",
            "@keyframes shimmer": {
              "0%, 100%": { backgroundPosition: "0% 50%" },
              "50%": { backgroundPosition: "100% 50%" },
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              textAlign: "center",
              color: "#1a1008",
              fontWeight: 900,
              fontFamily: "'Montserrat', sans-serif",
              textShadow: "0 1px 2px rgba(255, 255, 255, 0.3)",
            }}
          >
            ¡BINGO GANADOR!
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
          <Box sx={{ flex: 1, minWidth: { xs: "100%", md: "50%" } }}>
            <WinningCardDisplay
              card={winningCard}
              cardCode={winningCardCode}
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
            background: "rgba(26, 16, 8, 0.6)",
            backdropFilter: "blur(10px)",
            color: "#f5e6d3",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            "&:hover": {
              background: "rgba(31, 19, 9, 0.8)",
              borderColor: "rgba(212, 175, 55, 0.6)",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
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

