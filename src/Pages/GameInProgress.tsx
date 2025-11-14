// src/Pages/GameInProgress.tsx
import {
  Box,
  Container,
  Typography,
  Stack,
} from "@mui/material";
import * as React from "react";
import GameCard from "../Componets/GameCard";
import { generateCards } from "../utils/bingo";

export default function GameInProgress() {

  // Generar 3 cartones para el juego
  const playerCards = React.useMemo(() => generateCards(3), []);

  // Números que han sido llamados (ejemplo: B-7 es el actual, G-53, I-28, N-41 son los últimos)
  const [calledNumbers] = React.useState<Set<string>>(
    new Set(["B-7", "G-53", "I-28", "N-41"])
  );

  // Cartón seleccionado para marcar (null = ninguno, 0-2 = índice del cartón)
  const [selectedCardIndex, setSelectedCardIndex] = React.useState<number | null>(null);

  // Números marcados en cada cartón (qué números el usuario ha marcado manualmente)
  const [markedNumbers, setMarkedNumbers] = React.useState<Map<number, Set<string>>>(
    new Map()
  );

  const currentNumber = "B-7";
  const lastNumbers = ["G-53", "I-28", "N-41"];
  const currentRound = 1;
  const totalRounds = 3;

  const handleCardClick = (index: number) => {
    setSelectedCardIndex(selectedCardIndex === index ? null : index);
  };

  const handleNumberClick = (cardIndex: number) => (number: number) => {
    if (number === 0) return; // No se puede marcar FREE

    const numberFormat = numberToBingoFormat(number);
    if (!calledNumbers.has(numberFormat)) return; // Solo se pueden marcar números llamados

    setMarkedNumbers((prev) => {
      const next = new Map(prev);
      const cardMarked = next.get(cardIndex) || new Set();
      const newMarked = new Set(cardMarked);

      if (newMarked.has(numberFormat)) {
        newMarked.delete(numberFormat);
      } else {
        newMarked.add(numberFormat);
      }

      next.set(cardIndex, newMarked);
      return next;
    });
  };

  const handleBackToCards = () => {
    setSelectedCardIndex(null);
  };

  // Convertir número a formato BINGO
  const numberToBingoFormat = (num: number): string => {
    if (num === 0) return "FREE";
    if (num >= 1 && num <= 15) return `B-${num}`;
    if (num >= 16 && num <= 30) return `I-${num}`;
    if (num >= 31 && num <= 45) return `N-${num}`;
    if (num >= 46 && num <= 60) return `G-${num}`;
    if (num >= 61 && num <= 75) return `O-${num}`;
    return "";
  };

  // Obtener números marcados para un cartón específico
  const getMarkedForCard = (cardIndex: number): Set<string> => {
    return markedNumbers.get(cardIndex) || new Set();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1d2e",
        color: "#ffffff",
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Efecto de estrellas/partículas en el fondo */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(2px 2px at 20% 30%, rgba(227, 191, 112, 0.3), transparent),
                            radial-gradient(2px 2px at 60% 70%, rgba(227, 191, 112, 0.2), transparent),
                            radial-gradient(1px 1px at 50% 50%, rgba(227, 191, 112, 0.4), transparent),
                            radial-gradient(1px 1px at 80% 10%, rgba(227, 191, 112, 0.3), transparent),
                            radial-gradient(2px 2px at 40% 80%, rgba(227, 191, 112, 0.2), transparent)`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Container maxWidth="sm" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "28px", sm: "32px" },
              fontWeight: 700,
              color: "#ffffff",
              mb: 0.5,
              letterSpacing: "2px",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            BINGO
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: "18px", sm: "20px" },
              fontWeight: 600,
              color: "#e3bf70",
              mb: 2,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            PaO
          </Typography>
        </Box>

        {/* Game in Progress */}
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontSize: { xs: "22px", sm: "26px" },
            fontWeight: 700,
            color: "#ffffff",
            mb: 3,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Juego en Progreso
        </Typography>

        {/* Game Status Area */}
        <Box
          sx={{
            background: "rgba(31, 34, 51, 0.5)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            p: 2.5,
            mb: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Ronda: {currentRound}/{totalRounds}
            </Typography>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "12px",
                  opacity: 0.8,
                  mb: 0.5,
                }}
              >
                Últimos Números:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {lastNumbers.join(", ")}
              </Typography>
            </Box>
          </Stack>

          {/* Current Called Number */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: "4px solid #e3bf70",
                background: "linear-gradient(135deg, rgba(201, 168, 90, 0.3) 0%, rgba(227, 191, 112, 0.4) 50%, rgba(240, 208, 138, 0.3) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(227, 191, 112, 0.4)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "32px",
                  fontWeight: 900,
                  color: "#ffffff",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                {currentNumber}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: "12px",
                opacity: 0.8,
              }}
            >
              Número Actual Llamado
            </Typography>
          </Box>
        </Box>

        {/* Cartones - Vista de slider con 3 cartones */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            overflowY: "hidden",
            pb: 2,
            scrollSnapType: "x proximity",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(227, 191, 112, 0.3) transparent",
            "&::-webkit-scrollbar": {
              height: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(227, 191, 112, 0.3)",
              borderRadius: "10px",
              "&:hover": {
                background: "rgba(227, 191, 112, 0.5)",
              },
            },
            "& > *": {
              minWidth: "calc((100% - 32px) / 1.2)",
              flexShrink: 0,
              scrollSnapAlign: "start",
            },
          }}
        >
          {playerCards.map((card, index) => {
            const isSelected = selectedCardIndex === index;
            const cardMarked = getMarkedForCard(index);

            return (
              <Box
                key={index}
                onClick={() => handleCardClick(index)}
                sx={{
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <GameCard
                  grid={card}
                  cardId={index + 1}
                  title="My Card"
                  calledNumbers={calledNumbers}
                  markedNumbers={cardMarked}
                  selected={isSelected}
                  onClick={() => handleCardClick(index)}
                  onBack={isSelected ? handleBackToCards : undefined}
                  onNumberClick={isSelected ? handleNumberClick(index) : undefined}
                />
              </Box>
            );
          })}
        </Box>

        {/* Instrucciones cuando un cartón está seleccionado */}
        {selectedCardIndex !== null && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              background: "rgba(227, 191, 112, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(227, 191, 112, 0.3)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#e3bf70",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              Toca los números verdes para marcarlos o desmarcarlos
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}

