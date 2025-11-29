import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { RoomWinner } from "../Services/bingo.service";

type WinnerCardModalProps = {
  open: boolean;
  onClose: () => void;
  winner: RoomWinner | null;
};

const numberToBingoFormat = (num: number): string => {
  if (num === 0) return "FREE";
  if (num >= 1 && num <= 15) return `B-${num}`;
  if (num >= 16 && num <= 30) return `I-${num}`;
  if (num >= 31 && num <= 45) return `N-${num}`;
  if (num >= 46 && num <= 60) return `G-${num}`;
  if (num >= 61 && num <= 75) return `O-${num}`;
  return "";
};

// Generar todos los números del bingo (B-1 a O-75)
const generateAllBingoNumbers = (): string[] => {
  const allNumbers: string[] = [];
  const ranges = [
    { letter: "B", start: 1, end: 15 },
    { letter: "I", start: 16, end: 30 },
    { letter: "N", start: 31, end: 45 },
    { letter: "G", start: 46, end: 60 },
    { letter: "O", start: 61, end: 75 },
  ];

  ranges.forEach(({ letter, start, end }) => {
    for (let i = start; i <= end; i++) {
      allNumbers.push(`${letter}-${i}`);
    }
  });

  return allNumbers;
};

export default function WinnerCardModal({
  open,
  onClose,
  winner,
}: WinnerCardModalProps) {
  if (!winner) return null;

  const bingoNumbersSet = new Set(winner.bingo_numbers);
  const calledNumbersSet = new Set(winner.called_numbers);
  const allBingoNumbers = generateAllBingoNumbers();

  // Determinar el color de un número en el cartón
  const getCardNumberColor = (num: number | "FREE"): {
    backgroundColor: string;
    color: string;
    border?: string;
    boxShadow?: string;
  } => {
    if (num === 0 || num === "FREE") {
      return {
        backgroundColor: "#1a1008",
        color: "#d4af37",
        border: "2px solid #d4af37",
      };
    }

    const numFormat = numberToBingoFormat(num);
    
    // Si es un número del bingo -> dorado
    if (bingoNumbersSet.has(numFormat)) {
      return {
        backgroundColor: "#d4af37",
        color: "#1a1008",
        border: "2px solid #f4d03f",
        boxShadow: "0 0 12px rgba(212, 175, 55, 0.8), inset 0 0 8px rgba(244, 208, 63, 0.5)",
      };
    }

    // Si el número fue llamado y está en el cartón -> rojo
    if (calledNumbersSet.has(numFormat)) {
      return {
        backgroundColor: "#f44336",
        color: "#ffffff",
        border: "2px solid #e53935",
        boxShadow: "0 2px 8px rgba(244, 67, 54, 0.5)",
      };
    }

    // Número normal (no llamado)
    return {
      backgroundColor: "rgba(26, 16, 8, 0.6)",
      color: "#f5e6d3",
      border: "1px solid rgba(212, 175, 55, 0.2)",
    };
  };

  // Determinar el color de un número en el tablero
  const getBoardNumberColor = (numFormat: string): {
    backgroundColor: string;
    color: string;
    border?: string;
    boxShadow?: string;
  } => {
    // Si es un número del bingo -> dorado
    if (bingoNumbersSet.has(numFormat)) {
      return {
        backgroundColor: "#d4af37",
        color: "#1a1008",
        border: "2px solid #f4d03f",
        boxShadow: "0 0 8px rgba(212, 175, 55, 0.6)",
      };
    }

    // Si el número fue llamado -> verde
    if (calledNumbersSet.has(numFormat)) {
      return {
        backgroundColor: "#4CAF50",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 2px 6px rgba(76, 175, 80, 0.4)",
      };
    }

    // Número no llamado -> negro/gris
    return {
      backgroundColor: "#424242",
      color: "#bdbdbd",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: "rgba(31, 19, 9, 0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "20px",
          border: "2px solid rgba(212, 175, 55, 0.3)",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#f5e6d3",
          borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#d4af37" }}>
            Cartón Ganador - Ronda {winner.round_number}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#f5e6d3", opacity: 0.8, fontSize: "12px" }}
          >
            Cartón {winner.card_code} • Patrón: {winner.pattern}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "#f5e6d3",
            "&:hover": {
              backgroundColor: "rgba(212, 175, 55, 0.2)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 3 }}>
        <Stack spacing={4}>
          {/* Cartón */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#d4af37",
                fontWeight: 700,
                mb: 2,
                fontSize: "16px",
              }}
            >
              Cartón
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                p: 2,
                borderRadius: "12px",
                background: "rgba(26, 16, 8, 0.4)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
              }}
            >
              {/* Headers */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 0.5,
                  width: "100%",
                  mb: 0.5,
                }}
              >
                {["B", "I", "N", "G", "O"].map((header) => (
                  <Box
                    key={header}
                    sx={{
                      textAlign: "center",
                      py: 1,
                      background: "linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(244, 208, 63, 0.2) 100%)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      borderRadius: "8px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "18px",
                        color: "#d4af37",
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {header}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Grid del cartón */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 0.5,
                  width: "100%",
                }}
              >
                {winner.card_numbers.map((row, rowIndex) =>
                  row.map((num, colIndex) => {
                    const isCenter = rowIndex === 2 && colIndex === 2;
                    const colors = getCardNumberColor(num);

                    return (
                      <Box
                        key={`${rowIndex}-${colIndex}`}
                        sx={{
                          aspectRatio: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                          backgroundColor: colors.backgroundColor,
                          color: colors.color,
                          border: colors.border,
                          boxShadow: colors.boxShadow,
                          transition: "all 0.2s ease",
                          ...(isCenter && {
                            backgroundColor: "#1a1008",
                            color: "#d4af37",
                            border: "2px solid #d4af37",
                            fontWeight: 800,
                          }),
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: isCenter ? 800 : 700,
                            fontSize: isCenter ? "14px" : "16px",
                            textShadow: isCenter
                              ? "0 0 8px rgba(212, 175, 55, 0.8)"
                              : "0 1px 2px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {num === 0 || num === "FREE" ? "FREE" : num}
                        </Typography>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Box>

          {/* Tablero completo de números */}
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#d4af37",
                fontWeight: 700,
                mb: 2,
                fontSize: "16px",
              }}
            >
              Tablero de Números Llamados
            </Typography>
            <Box
              sx={{
                p: 2.5,
                borderRadius: "12px",
                background: "rgba(26, 16, 8, 0.5)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Agrupar por letras */}
              {[
                { letter: "B", start: 1, end: 15 },
                { letter: "I", start: 16, end: 30 },
                { letter: "N", start: 31, end: 45 },
                { letter: "G", start: 46, end: 60 },
                { letter: "O", start: 61, end: 75 },
              ].map(({ letter, start, end }) => {
                const letterNumbers = allBingoNumbers.filter(
                  (num) => num.startsWith(`${letter}-`)
                );

                return (
                  <Box key={letter} sx={{ mb: 2.5, "&:last-child": { mb: 0 } }}>
                    {/* Header de la letra */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1.5,
                        pb: 1,
                        borderBottom: "2px solid rgba(212, 175, 55, 0.3)",
                      }}
                    >
                      <Box
                        sx={{
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                          background: "linear-gradient(135deg, rgba(212, 175, 55, 0.4) 0%, rgba(244, 208, 63, 0.3) 100%)",
                          border: "1px solid rgba(212, 175, 55, 0.5)",
                          mr: 1.5,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: "20px",
                            color: "#d4af37",
                            textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                          }}
                        >
                          {letter}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#f5e6d3",
                          opacity: 0.8,
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {letterNumbers.length} números
                      </Typography>
                    </Box>

                    {/* Números de esta letra */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "repeat(3, 1fr)",
                          sm: "repeat(5, 1fr)",
                          md: "repeat(5, 1fr)",
                        },
                        gap: 1,
                      }}
                    >
                      {letterNumbers.map((numFormat) => {
                        const colors = getBoardNumberColor(numFormat);
                        return (
                          <Chip
                            key={numFormat}
                            label={numFormat}
                            sx={{
                              backgroundColor: colors.backgroundColor,
                              color: colors.color,
                              border: colors.border,
                              boxShadow: colors.boxShadow,
                              fontWeight: 700,
                              fontSize: "12px",
                              height: "36px",
                              width: "100%",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.05)",
                                zIndex: 1,
                                position: "relative",
                              },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

