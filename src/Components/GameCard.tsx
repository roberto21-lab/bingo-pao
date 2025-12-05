// src/Components/GameCard.tsx
import * as React from "react";
import { Card, CardContent, Typography, Box, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type GameCardProps = {
  /** Matriz 5x5; 0 representa FREE */
  grid: number[][];
  /** ID/Número del cartón */
  cardId: number;
  /** Título del cartón */
  title?: string;
  /** Números que han sido llamados (formato: "B-7", "I-28", etc.) */
  calledNumbers: Set<string>;
  /** Números que el usuario ha marcado manualmente (formato: "B-7", "I-28", etc.) */
  markedNumbers?: Set<string>;
  /** Si el cartón está seleccionado para marcar */
  selected?: boolean;
  /** Callback al hacer click en el cartón */
  onClick?: () => void;
  /** Callback para volver a mis cartones */
  onBack?: () => void;
  /** Callback cuando se hace click en un número (solo si está seleccionado) */
  onNumberClick?: (number: number) => void;
};

const HEADERS = ["B", "I", "N", "G", "O"] as const;

// Convertir número a formato BINGO (ej: 7 -> "B-7", 28 -> "I-28")
const numberToBingoFormat = (num: number): string => {
  if (num === 0) return "FREE";
  if (num >= 1 && num <= 15) return `B-${num}`;
  if (num >= 16 && num <= 30) return `I-${num}`;
  if (num >= 31 && num <= 45) return `N-${num}`;
  if (num >= 46 && num <= 60) return `G-${num}`;
  if (num >= 61 && num <= 75) return `O-${num}`;
  return "";
};

const GameCard: React.FC<GameCardProps> = ({
  grid,
  cardId,
  title = "My Card",
  calledNumbers,
  markedNumbers = new Set(),
  selected = false,
  onClick,
  onBack,
  onNumberClick,
}) => {
  const isNumberCalled = (num: number): boolean => {
    if (num === 0) return false; // FREE no se marca
    return calledNumbers.has(numberToBingoFormat(num));
  };

  const isNumberMarked = (num: number): boolean => {
    if (num === 0) return false; // FREE no se marca
    return markedNumbers.has(numberToBingoFormat(num));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Card
        onClick={onClick}
        sx={{
          width: "100%",
          borderRadius: "16px",
          border: selected ? "3px solid #e3bf70" : "2px solid rgba(227, 191, 112, 0.3)",
          backgroundColor: "#ffffff",
          cursor: "pointer",
          transition: "all 0.3s",
          boxShadow: selected
            ? "0 8px 24px rgba(227, 191, 112, 0.4)"
            : "0 4px 12px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(227, 191, 112, 0.3)",
          },
        }}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          {/* Header con título e ID */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
              px: 0.5,
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#1a1d2e",
              }}
            >
              {title} {cardId}
            </Typography>
            <Typography
              sx={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#1a1d2e",
                opacity: 0.7,
              }}
            >
              #{cardId}
            </Typography>
          </Box>

          {/* Grid 5x5 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 0.5,
            }}
          >
            {/* Headers BINGO */}
            {HEADERS.map((letter) => (
              <Box
                key={letter}
                sx={{
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#e3bf70",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 900,
                  color: "#0f0f1e",
                  letterSpacing: "0.5px",
                }}
              >
                {letter}
              </Box>
            ))}

            {/* Celdas con números */}
            {grid.map((row, rowIndex) =>
              row.map((num, colIndex) => {
                const isFree = num === 0;
                const isCalled = isNumberCalled(num);
                const isMarked = isNumberMarked(num);
                const canMark = selected && isCalled && !isFree && onNumberClick;
                return (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    onClick={(e) => {
                      if (canMark) {
                        e.stopPropagation();
                        onNumberClick(num);
                      }
                    }}
                    sx={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isFree
                        ? "#f0f0f0"
                        : isMarked
                        ? "#81c784"
                        : isCalled
                        ? "#c8e6c9"
                        : "#ffffff",
                      borderRadius: "4px",
                      border: isMarked
                        ? "3px solid #2e7d32"
                        : isCalled
                        ? "2px solid #4caf50"
                        : "1px solid #e0e0e0",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#1a1d2e",
                      position: "relative",
                      cursor: canMark ? "pointer" : "default",
                      transition: "all 0.2s",
                      "&:hover": canMark
                        ? {
                            backgroundColor: "#a5d6a7",
                            transform: "scale(1.1)",
                          }
                        : {},
                    }}
                  >
                    {isFree ? (
                      <Typography
                        sx={{
                          fontSize: "7px",
                          fontWeight: 900,
                          color: "#1a1d2e",
                          transform: "rotate(-45deg)",
                          position: "absolute",
                        }}
                      >
                        FREE
                      </Typography>
                    ) : (
                      <>
                        {num}
                        {(isCalled || isMarked) && (
                          <CheckCircleIcon
                            sx={{
                              position: "absolute",
                              fontSize: "16px",
                              color: isMarked ? "#2e7d32" : "#4caf50",
                              top: "-2px",
                              right: "-2px",
                            }}
                          />
                        )}
                      </>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Botón Back to My Cards */}
      {onBack && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          sx={{
            background: "rgba(31, 34, 51, 0.5)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderColor: "rgba(227, 191, 112, 0.5)",
            color: "#e3bf70",
            fontWeight: 600,
            fontSize: "11px",
            py: 0.75,
            px: 2,
            borderRadius: "12px",
            textTransform: "none",
            borderWidth: "1px",
            borderStyle: "solid",
            "&:hover": {
              borderColor: "rgba(240, 208, 138, 0.7)",
              color: "#f0d08a",
              background: "rgba(227, 191, 112, 0.1)",
            },
          }}
        >
          Volver a Mis Cartones
        </Button>
      )}
    </Box>
  );
};

export default GameCard;

