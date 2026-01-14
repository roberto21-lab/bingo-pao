// src/Components/CardMiniature.tsx
// Componente reutilizable para mostrar cartones de bingo en miniatura
// Usado en: CardList, RoomDetail, y cualquier lugar donde se necesite mostrar un cartón pequeño
import * as React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

export type CardMiniatureProps = {
  grid: number[][];
  cardCode: string;
  selected?: boolean;
  onClick?: () => void;
  status?: "free" | "occupied";
  calledNumbers?: Set<string>;
  markedNumbers?: Set<string>;
  hasBingo?: boolean;
  bingoPatternNumbers?: Set<string>;
  winningNumbers?: Set<string>; // Números que hicieron bingo (para salas finalizadas)
  showLoserAnimation?: boolean; // Si se debe mostrar animación de "mala suerte"
  isFinishedRoom?: boolean; // ISSUE-2: Si la sala está finalizada (no mostrar calledNumbers en rojo)
  testId?: string; // Para E2E testing
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

const CardMiniature: React.FC<CardMiniatureProps> = ({
  grid,
  cardCode,
  selected = false,
  onClick,
  status = "free",
  calledNumbers = new Set(),
  markedNumbers = new Set(),
  hasBingo = false,
  bingoPatternNumbers = new Set(),
  winningNumbers = new Set(),
  showLoserAnimation = false,
  isFinishedRoom = false, // ISSUE-2: Por defecto false
  testId,
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
      data-testid={testId || `card-miniature-${cardCode}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        position: "relative",
      }}
    >
      {/* Animación de "Mala Suerte" cuando alguien más canta bingo */}
      {showLoserAnimation && !hasBingo && (
        <Box
          sx={{
            position: "absolute",
            top: "-15px",
            left: "-15px",
            right: "-15px",
            bottom: "-15px",
            zIndex: 10,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "loserShake 0.5s ease-in-out",
            "@keyframes loserShake": {
              "0%, 100%": { transform: "translateX(0)" },
              "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
              "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
            },
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(135deg, rgba(244, 67, 54, 0.95) 0%, rgba(211, 47, 47, 0.95) 100%)",
              color: "#ffffff",
              px: 2,
              py: 1,
              borderRadius: "12px",
              border: "2px solid rgba(255, 255, 255, 0.8)",
              boxShadow: "0 4px 20px rgba(244, 67, 54, 0.6), 0 0 30px rgba(244, 67, 54, 0.4)",
              animation: "loserPulse 1s ease-in-out infinite",
              "@keyframes loserPulse": {
                "0%, 100%": { 
                  transform: "scale(1)",
                  boxShadow: "0 4px 20px rgba(244, 67, 54, 0.6), 0 0 30px rgba(244, 67, 54, 0.4)",
                },
                "50%": { 
                  transform: "scale(1.1)",
                  boxShadow: "0 6px 30px rgba(244, 67, 54, 0.8), 0 0 40px rgba(244, 67, 54, 0.6)",
                },
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 900,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "1px",
              }}
            >
              ¡MALA SUERTE!
            </Typography>
          </Box>
        </Box>
      )}

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
            ? "3px solid rgba(212, 175, 55, 0.8)"
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
            : selected
            ? "0 0 15px rgba(212, 175, 55, 0.4), 0 0 30px rgba(212, 175, 55, 0.2), 0 1px 4px rgba(0, 0, 0, 0.1)"
            : "0 1px 4px rgba(0, 0, 0, 0.1)",
          "&:hover": status === "occupied" ? {} : { transform: "translateY(-2px)", boxShadow: hasBingo ? "0 3px 10px rgba(227, 191, 112, 0.5)" : selected ? "0 0 20px rgba(212, 175, 55, 0.5), 0 2px 8px rgba(0, 0, 0, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.15)" },
        }}
      >
        {/* Badge de seleccionado - Esquina superior izquierda */}
        {selected && (
          <Box
            sx={{
              position: "absolute",
              top: -2,
              left: -5,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              px: 0.75,
              py: 0.25,
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
              border: "1.5px solid rgba(212, 175, 55, 1)",
              boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
            }}
          >
            <Typography
              sx={{
                fontSize: "8px",
                fontWeight: 700,
                color: "#1a1008",
                lineHeight: 1,
              }}
            >
              ✓
            </Typography>
            <Typography
              sx={{
                fontSize: "7px",
                fontWeight: 700,
                color: "#1a1008",
                lineHeight: 1,
              }}
            >
              Seleccionado
            </Typography>
          </Box>
        )}
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          {/* Código del cartón en esquina superior derecha */}
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#1a1d2e",
              mb: 0.25,
              textAlign: "right",
              pr: 0.25,
            }}
          >
            {cardCode}
          </Typography>

          {/* Letras BINGO - mismo grid que los números para alineación perfecta */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 0.25,
              mb: 0.25,
            }}
          >
            {HEADERS.map((letter) => (
              <Box
                key={letter}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#1a1d2e",
                    textAlign: "center",
                  }}
                >
                  {letter}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Grid de números */}
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
                // ISSUE-2 FIX: En sala finalizada NO mostrar rojo porque calledNumbers
                // contiene números de TODAS las rondas, no solo de la ronda de este ganador
                const isCalledButNotMarked = !isFinishedRoom && isCalled && !isMarked;
                const numFormat = num !== 0 ? numberToBingoFormat(num) : "";
                const isPartOfBingoPattern = hasBingo && numFormat !== "" && bingoPatternNumbers.has(numFormat);
                const isWinningNumber = numFormat !== "" && winningNumbers.has(numFormat);
                
                // FIX-WINNING-NUMBERS: Lógica para determinar si mostrar en dorado
                // 
                // Cuando isFinishedRoom=true (sala finalizada mostrando ganadores):
                // - SOLO usar winningNumbers para mostrar en dorado
                // - Si winningNumbers está vacío (backend no envió datos), NO mostrar nada en dorado
                // - NUNCA usar bingoPatternNumbers/isMarked porque son datos del usuario actual, no del ganador
                //
                // Cuando isFinishedRoom=false (juego activo):
                // - Usar la lógica original: winningNumbers o (bingoPattern && isMarked)
                const hasWinningNumbersData = winningNumbers.size > 0;
                const shouldBeGold = isFinishedRoom
                  ? isWinningNumber  // Sala finalizada: SOLO winningNumbers (o nada si está vacío)
                  : (hasWinningNumbersData 
                      ? isWinningNumber  // Juego activo con winningNumbers
                      : (isPartOfBingoPattern && isMarked)); // Juego activo sin winningNumbers
                
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
    </Box>
  );
};

export default CardMiniature;
