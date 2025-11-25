import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import type { BingoGrid } from "../utils/bingo";
import WinningCardDisplay from "./WinningCardDisplay";
import CalledNumbersTable from "./CalledNumbersTable";

export type WinnerData = {
  card: BingoGrid;
  cardCode: string;
  markedNumbers: Set<string>;
  bingoPatternNumbers: Set<string>;
};

type BingoValidationModalProps = {
  open: boolean;
  onClose: () => void;
  winners: WinnerData[]; // Múltiples ganadores
  currentWinnerIndex: number;
  onPreviousWinner: () => void;
  onNextWinner: () => void;
  calledNumbers: Set<string>;
};

export default function BingoValidationModal({
  open,
  onClose,
  winners,
  currentWinnerIndex,
  onPreviousWinner,
  onNextWinner,
  calledNumbers,
}: BingoValidationModalProps) {
  const currentWinner = winners[currentWinnerIndex];
  const hasMultipleWinners = winners.length > 1;
  const canGoPrevious = currentWinnerIndex > 0;
  const canGoNext = currentWinnerIndex < winners.length - 1;

  if (!currentWinner) {
    return null;
  }
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

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, position: "relative" }}>
          {/* Navegación entre ganadores */}
          {hasMultipleWinners && (
            <>
              <IconButton
                onClick={onPreviousWinner}
                disabled={!canGoPrevious}
                sx={{
                  position: "absolute",
                  left: { xs: 8, md: -60 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  backgroundColor: "rgba(212, 175, 55, 0.2)",
                  color: canGoPrevious ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                  border: "2px solid rgba(212, 175, 55, 0.5)",
                  "&:hover": {
                    backgroundColor: canGoPrevious ? "rgba(212, 175, 55, 0.4)" : "rgba(212, 175, 55, 0.2)",
                  },
                  "&.Mui-disabled": {
                    borderColor: "rgba(212, 175, 55, 0.2)",
                  },
                }}
              >
                <ArrowBackIosNewIcon />
              </IconButton>

              <IconButton
                onClick={onNextWinner}
                disabled={!canGoNext}
                sx={{
                  position: "absolute",
                  right: { xs: 8, md: -60 },
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 10,
                  backgroundColor: "rgba(212, 175, 55, 0.2)",
                  color: canGoNext ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                  border: "2px solid rgba(212, 175, 55, 0.5)",
                  "&:hover": {
                    backgroundColor: canGoNext ? "rgba(212, 175, 55, 0.4)" : "rgba(212, 175, 55, 0.2)",
                  },
                  "&.Mui-disabled": {
                    borderColor: "rgba(212, 175, 55, 0.2)",
                  },
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>

              {/* Indicador de ganador actual */}
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  backgroundColor: "rgba(212, 175, 55, 0.2)",
                  color: "#d4af37",
                  px: 2,
                  py: 0.5,
                  borderRadius: "12px",
                  border: "1px solid rgba(212, 175, 55, 0.5)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                {currentWinnerIndex + 1} / {winners.length}
              </Box>
            </>
          )}

          <Box sx={{ flex: 1, minWidth: { xs: "100%", md: "50%" } }}>
            <WinningCardDisplay
              card={currentWinner.card}
              cardCode={currentWinner.cardCode}
              markedNumbers={currentWinner.markedNumbers}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: { xs: "100%", md: "50%" } }}>
            <CalledNumbersTable
              calledNumbers={calledNumbers}
              markedNumbers={currentWinner.markedNumbers}
              bingoPatternNumbers={currentWinner.bingoPatternNumbers}
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

