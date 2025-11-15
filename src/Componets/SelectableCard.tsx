// src/Componets/SelectableCard.tsx
import * as React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type SelectableCardProps = {
  grid: number[][];
  cardId: number;
  selected?: boolean;
  onClick?: () => void;
  status?: "free" | "occupied";
  calledNumbers?: Set<string>;
  markedNumbers?: Set<string>;
  hasBingo?: boolean;
};

const HEADERS = ["B", "I", "N", "G", "O"] as const;

const numberToBingoFormat = (num: number): string => {
  if (num === 0) return "FREE";
  if (num >= 1 && num <= 15) return `B-${num}`;
  if (num >= 16 && num <= 30) return `I-${num}`;
  if (num >= 31 && num <= 45) return `N-${num}`;
  if (num >= 46 && num <= 60) return `G-${num}`;
  if (num >= 61 && num <= 75) return `O-${num}`;
  return "";
};

const SelectableCard: React.FC<SelectableCardProps> = ({
  grid,
  cardId,
  selected = false,
  onClick,
  status = "free",
  calledNumbers = new Set(),
  markedNumbers = new Set(),
  hasBingo = false,
}) => {
  const isNumberCalled = (num: number): boolean => {
    if (num === 0) return false;
    return calledNumbers.has(numberToBingoFormat(num));
  };

  const isNumberMarked = (num: number): boolean => {
    if (num === 0) return false;
    return markedNumbers.has(numberToBingoFormat(num));
  };

  const generateSparklePositions = (count: number) => {
    return Array.from({ length: count }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));
  };

  const sparkles = hasBingo ? generateSparklePositions(20) : [];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        position: "relative",
      }}
    >
      {hasBingo && (
        <Box
          sx={{
            position: "absolute",
            top: "-10px",
            left: "-10px",
            right: "-10px",
            bottom: "-10px",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          {sparkles.map((sparkle, i) => (
            <Box
              key={`sparkle-${i}`}
              sx={{
                position: "absolute",
                width: `${sparkle.size}px`,
                height: `${sparkle.size}px`,
                borderRadius: "50%",
                backgroundColor: "#e3bf70",
                top: `${sparkle.top}%`,
                left: `${sparkle.left}%`,
                boxShadow: `
                  0 0 ${sparkle.size * 2}px ${sparkle.size}px rgba(227, 191, 112, 0.6),
                  0 0 ${sparkle.size * 4}px ${sparkle.size * 2}px rgba(227, 191, 112, 0.3)
                `,
                animation: `sparkleFloat ${sparkle.duration}s ease-in-out infinite`,
                animationDelay: `${sparkle.delay}s`,
                "@keyframes sparkleFloat": {
                  "0%, 100%": {
                    opacity: 0.4,
                    transform: "scale(0.8) translateY(0px)",
                  },
                  "50%": {
                    opacity: 1,
                    transform: `scale(1.3) translateY(-${sparkle.size * 2}px)`,
                  },
                },
              }}
            />
          ))}
        </Box>
      )}

      <Card
        onClick={onClick}
        sx={{
          width: "100%",
          borderRadius: "12px",
          border: hasBingo
            ? "3px solid #e3bf70"
            : selected
            ? "2px solid #e3bf70"
            : status === "occupied"
            ? "2px solid #9e9e9e"
            : "2px solid #ffffff",
          backgroundColor: "#ffffff",
          cursor: status === "occupied" ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: status === "occupied" ? 0.6 : 1,
          position: "relative",
          zIndex: 1,
          boxShadow: hasBingo
            ? "0 2px 8px rgba(227, 191, 112, 0.4)"
            : "0 1px 4px rgba(0, 0, 0, 0.1)",
          "&:hover": status === "occupied" ? {} : { transform: "translateY(-2px)", boxShadow: hasBingo ? "0 3px 10px rgba(227, 191, 112, 0.5)" : "0 2px 8px rgba(0, 0, 0, 0.15)" },
        }}
      >
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
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
                const isCalled = isNumberCalled(num);
                const isMarked = isNumberMarked(num);
                const isCalledButNotMarked = isCalled && !isMarked;
                
                const shouldBeGold = hasBingo && isMarked;
                
                return (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    sx={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isFree
                        ? "#f0f0f0"
                        : shouldBeGold
                        ? "#f5d99a" 
                        : isMarked
                        ? "#c8e6c9" 
                        : isCalledButNotMarked
                        ? "#ffcdd2" 
                        : "#ffffff",
                      borderRadius: "2px",
                      border: isFree
                        ? "1px solid #e0e0e0"
                        : shouldBeGold
                        ? "2px solid #e3bf70" 
                        : isMarked
                        ? "1.5px solid #4caf50" 
                        : isCalledButNotMarked
                        ? "1.5px solid #f44336" 
                        : "1px solid #e0e0e0",
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

      {selected && (
        <Box
          sx={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "2px solid #e3bf70",
            backgroundColor: "#e3bf70",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(227, 191, 112, 0.4)",
          }}
        >
          <CheckCircleIcon
            sx={{
              fontSize: "20px",
              color: "#ffffff",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default SelectableCard;
