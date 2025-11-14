// src/Componets/SelectableCard.tsx
import * as React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type SelectableCardProps = {
  /** Matriz 5x5 de números (0 = FREE) */
  grid: number[][];
  /** ID/Número del cartón */
  cardId: number;
  /** Estado de selección */
  selected?: boolean;
  /** Callback al hacer click */
  onClick?: () => void;
  /** Estado libre/ocupado */
  status?: "free" | "occupied";
};

const HEADERS = ["B", "I", "N", "G", "O"] as const;

const SelectableCard: React.FC<SelectableCardProps> = ({
  grid,
  cardId,
  selected = false,
  onClick,
  status = "free",
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Card
        onClick={onClick}
        sx={{
          width: "100%",
          borderRadius: "12px",
          border: selected
            ? "2px solid #e3bf70"
            : status === "occupied"
            ? "2px solid #9e9e9e"
            : "2px solid #ffffff",
          backgroundColor: "#ffffff",
          cursor: status === "occupied" ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: status === "occupied" ? 0.6 : 1,
          "&:hover": status === "occupied" ? {} : { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" },
        }}
      >
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          {/* Header BINGO con ID */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.5,
              px: 0.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                flex: 1,
                justifyContent: "center",
              }}
            >
              {HEADERS.map((letter) => (
                <Typography
                  key={letter}
                  sx={{
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#1a1d2e",
                    letterSpacing: "0.5px",
                  }}
                >
                  {letter}
                </Typography>
              ))}
            </Box>
            <Typography
              sx={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#1a1d2e",
                ml: 0.5,
              }}
            >
              {cardId}
            </Typography>
          </Box>

          {/* Grid 5x5 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 0.25,
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((num, colIndex) => {
                const isFree = num === 0;
                return (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    sx={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isFree ? "#f0f0f0" : "#ffffff",
                      borderRadius: "2px",
                      border: "1px solid #e0e0e0",
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "#1a1d2e",
                      position: "relative",
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
                      num
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Indicador circular */}
      <Box
        sx={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: "2px solid #e3bf70",
          backgroundColor: selected ? "#e3bf70" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        {selected && (
          <CheckCircleIcon
            sx={{
              fontSize: "20px",
              color: "#0f0f1e",
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default SelectableCard;
