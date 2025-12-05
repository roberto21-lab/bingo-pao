import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from "@mui/material";
import type { BingoType } from "../utils/bingoUtils";
import { getBingoTypeName } from "../utils/bingoUtils";

type BingoPatternModalProps = {
  open: boolean;
  onClose: () => void;
  pattern: BingoType;
};

// Función para generar un ejemplo de cartón con el patrón marcado
const generatePatternExample = (pattern: BingoType): (number | "X")[][] => {
  // Crear un cartón de ejemplo 5x5 con números de ejemplo
  const exampleCard: (number | "X")[][] = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, 0, 48, 63], // 0 es FREE
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65],
  ];

  // Marcar las celdas según el patrón
  switch (pattern) {
    case "horizontal": {
      // Marcar la segunda fila completa
      for (let col = 0; col < 5; col++) {
        exampleCard[1][col] = "X";
      }
      break;
    }
    case "vertical": {
      // Marcar la segunda columna completa
      for (let row = 0; row < 5; row++) {
        exampleCard[row][1] = "X";
      }
      break;
    }
    case "diagonal": {
      // Marcar diagonal principal (de arriba-izquierda a abajo-derecha)
      for (let i = 0; i < 5; i++) {
        exampleCard[i][i] = "X";
      }
      break;
    }
    case "smallCross": {
      // Marcar cruz pequeña: (1,2), (3,2), (2,1), (2,3)
      exampleCard[1][2] = "X";
      exampleCard[3][2] = "X";
      exampleCard[2][1] = "X";
      exampleCard[2][3] = "X";
      break;
    }
    case "fullCard": {
      // Marcar todo el cartón
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (exampleCard[row][col] !== 0) {
            exampleCard[row][col] = "X";
          }
        }
      }
      break;
    }
    case "fourCorners": {
      // Marcar las 4 esquinas
      exampleCard[0][0] = "X";
      exampleCard[0][4] = "X";
      exampleCard[4][0] = "X";
      exampleCard[4][4] = "X";
      break;
    }
  }

  return exampleCard;
};

export default function BingoPatternModal({
  open,
  onClose,
  pattern,
}: BingoPatternModalProps) {
  const exampleCard = generatePatternExample(pattern);
  const patternName = getBingoTypeName(pattern);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: "linear-gradient(135deg, rgba(26, 16, 8, 0.95) 0%, rgba(31, 19, 9, 0.98) 100%)",
          backdropFilter: "blur(20px)",
          border: "2px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.2)",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          background: "linear-gradient(135deg, #d4af37, #f4d03f, #ffd700)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 900,
          fontSize: "24px",
          fontFamily: "'Montserrat', sans-serif",
          pb: 1,
        }}
      >
        Patrón: {patternName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#f5e6d3",
              textAlign: "center",
              opacity: 0.9,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Ejemplo del patrón de bingo que debes completar en esta ronda
          </Typography>

          {/* Cartón de ejemplo */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 1.5,
              p: 2,
              background: "rgba(26, 16, 8, 0.6)",
              borderRadius: "12px",
              border: "2px solid rgba(212, 175, 55, 0.3)",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Headers BINGO */}
            {["B", "I", "N", "G", "O"].map((letter, idx) => (
              <Box
                key={idx}
                sx={{
                  textAlign: "center",
                  fontWeight: 900,
                  fontSize: "18px",
                  color: "#d4af37",
                  textShadow: "0 2px 4px rgba(212, 175, 55, 0.5)",
                  fontFamily: "'Montserrat', sans-serif",
                  pb: 1,
                }}
              >
                {letter}
              </Box>
            ))}

            {/* Celdas del cartón */}
            {exampleCard.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isMarked = cell === "X";
                const isFree = cell === 0;

                return (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    sx={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      background: isMarked
                        ? "linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(76, 175, 80, 0.7) 100%)"
                        : isFree
                        ? "linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.2) 100%)"
                        : "rgba(26, 16, 8, 0.4)",
                      border: isMarked
                        ? "2px solid rgba(76, 175, 80, 0.8)"
                        : isFree
                        ? "2px solid rgba(212, 175, 55, 0.4)"
                        : "1px solid rgba(212, 175, 55, 0.2)",
                      boxShadow: isMarked
                        ? "0 0 12px rgba(76, 175, 80, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.2)"
                        : "0 2px 4px rgba(0, 0, 0, 0.2)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {isFree ? (
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: "14px",
                          color: "#d4af37",
                          textShadow: "0 1px 2px rgba(212, 175, 55, 0.5)",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        FREE
                      </Typography>
                    ) : isMarked ? (
                      <Typography
                        sx={{
                          fontWeight: 900,
                          fontSize: "16px",
                          color: "#fff",
                          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        ✓
                      </Typography>
                    ) : (
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#f5e6d3",
                          opacity: 0.6,
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        {cell}
                      </Typography>
                    )}
                  </Box>
                );
              })
            )}
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: "#d4af37",
              textAlign: "center",
              fontStyle: "italic",
              opacity: 0.8,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Las celdas marcadas con ✓ muestran el patrón que debes completar
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, justifyContent: "center" }}>
        <Button
          onClick={onClose}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: "12px",
            textTransform: "none",
            background: "linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%)",
            color: "#1a1008",
            fontWeight: 700,
            fontSize: "16px",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #f4d03f 0%, #ffd700 50%, #f4d03f 100%)",
              boxShadow: "0 6px 16px rgba(212, 175, 55, 0.6)",
            },
          }}
        >
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}

