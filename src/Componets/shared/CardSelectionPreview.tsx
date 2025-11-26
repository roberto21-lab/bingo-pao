// src/Componets/shared/CardSelectionPreview.tsx
import React from "react";
import { Box, Typography, IconButton, DialogContent, DialogActions } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { MetallicButton } from "./MetallicButton";

type CardSelectionPreviewProps = {
  card: number[][];
  cardCode: string;
  isSelected: boolean;
  onAccept: () => void;
  onReject: () => void;
  onDeselect: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

export const CardSelectionPreview: React.FC<CardSelectionPreviewProps> = ({
  card,
  cardCode,
  isSelected,
  onAccept,
  onReject,
  onDeselect,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  return (
    <>
      <DialogContent sx={{ p: 4, position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            mb: 3,
          }}
        >
          {/* Flecha izquierda */}
          {onPrevious && (
            <IconButton
              onClick={onPrevious}
              disabled={!hasPrevious}
              sx={{
                color: hasPrevious ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                backgroundColor: hasPrevious ? "rgba(212, 175, 55, 0.1)" : "transparent",
                border: hasPrevious ? "2px solid rgba(212, 175, 55, 0.4)" : "2px solid rgba(212, 175, 55, 0.1)",
                borderRadius: "12px",
                width: "48px",
                height: "48px",
                "&:hover": hasPrevious
                  ? {
                      backgroundColor: "rgba(212, 175, 55, 0.2)",
                      borderColor: "rgba(212, 175, 55, 0.6)",
                      transform: "scale(1.05)",
                    }
                  : {},
                "&:disabled": {
                  opacity: 0.4,
                },
                transition: "all 0.2s",
              }}
            >
              <ChevronLeft sx={{ fontSize: "32px" }} />
            </IconButton>
          )}

          {/* Título del cartón */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.15) 100%)",
              border: "1px solid rgba(212, 175, 55, 0.5)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 8px rgba(212, 175, 55, 0.2)",
              minWidth: "100px",
              maxWidth: "140px",
              position: "relative",
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                textAlign: "center",
                color: "#d4af37",
                fontWeight: 900,
                fontFamily: "'Montserrat', sans-serif",
                textShadow: "0 2px 6px rgba(212, 175, 55, 0.7), 0 0 12px rgba(212, 175, 55, 0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Cartón {cardCode}
            </Typography>
          </Box>

          {/* Flecha derecha */}
          {onNext && (
            <IconButton
              onClick={onNext}
              disabled={!hasNext}
              sx={{
                color: hasNext ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                backgroundColor: hasNext ? "rgba(212, 175, 55, 0.1)" : "transparent",
                border: hasNext ? "2px solid rgba(212, 175, 55, 0.4)" : "2px solid rgba(212, 175, 55, 0.1)",
                borderRadius: "12px",
                width: "48px",
                height: "48px",
                "&:hover": hasNext
                  ? {
                      backgroundColor: "rgba(212, 175, 55, 0.2)",
                      borderColor: "rgba(212, 175, 55, 0.6)",
                      transform: "scale(1.05)",
                    }
                  : {},
                "&:disabled": {
                  opacity: 0.4,
                },
                transition: "all 0.2s",
              }}
            >
              <ChevronRight sx={{ fontSize: "32px" }} />
            </IconButton>
          )}
        </Box>

        {/* Cartón */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 3,
            position: "relative",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "400px",
              backgroundColor: "#f5e6d3",
              borderRadius: "16px",
              p: 3,
              border: isSelected
                ? "3px solid rgba(212, 175, 55, 0.8)"
                : "2px solid rgba(212, 175, 55, 0.2)",
              position: "relative",
              zIndex: 1,
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  #f5e6d3 0px,
                  #f0e0d0 1px,
                  #ebdac8 2px,
                  #f0e0d0 3px,
                  #f5e6d3 4px,
                  #f5e6d3 20px,
                  #f0e0d0 21px,
                  #ebdac8 22px,
                  #f0e0d0 23px,
                  #f5e6d3 24px
                ),
                linear-gradient(
                  90deg,
                  #f5e6d3 0%,
                  #f0e0d0 30%,
                  #ebdac8 50%,
                  #f0e0d0 70%,
                  #f5e6d3 100%
                ),
                radial-gradient(ellipse 300px 200px at 25% 30%, rgba(220, 200, 180, 0.2) 0%, transparent 70%),
                radial-gradient(ellipse 250px 180px at 75% 70%, rgba(210, 190, 170, 0.18) 0%, transparent 70%)
              `,
              backgroundSize: `
                100% 48px,
                150% 100%,
                100% 100%,
                100% 100%
              `,
              boxShadow: isSelected
                ? `
                  0 0 15px rgba(212, 175, 55, 0.4),
                  0 0 30px rgba(212, 175, 55, 0.2),
                  0 4px 16px rgba(0, 0, 0, 0.3),
                  inset 0 0 15px rgba(0, 0, 0, 0.03)
                `
                : `
                  0 0 10px rgba(255, 255, 255, 0.08),
                  0 0 20px rgba(255, 255, 255, 0.05),
                  0 4px 16px rgba(0, 0, 0, 0.3),
                  inset 0 0 15px rgba(0, 0, 0, 0.03)
                `,
            }}
          >
            {/* Header BINGO */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 1,
                mb: 2,
                position: "relative",
                zIndex: 2,
              }}
            >
              {["B", "I", "N", "G", "O"].map((letter) => (
                <Typography
                  key={letter}
                  sx={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#1a1008",
                    letterSpacing: "1px",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {letter}
                </Typography>
              ))}
            </Box>

            {/* Grid de números */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 1,
                position: "relative",
                zIndex: 2,
              }}
            >
              {card.map((row, rowIndex) =>
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
                        backgroundColor: isFree ? "#e8dcc8" : "#f5e6d3",
                        borderRadius: "4px",
                        border: isFree
                          ? "1px solid rgba(200, 180, 160, 0.4)"
                          : "1px solid rgba(200, 180, 160, 0.3)",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#1a1008",
                        position: "relative",
                        zIndex: 2,
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      {isFree ? (
                        <Typography
                          sx={{
                            fontSize: "12px",
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

            {/* Badge de seleccionado */}
            {isSelected && (
              <Box
                sx={{
                  position: "absolute",
                  top: -10,
                  left: -10,
                  zIndex: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
                  border: "2px solid rgba(212, 175, 55, 1)",
                  boxShadow: "0 4px 12px rgba(212, 175, 55, 0.5)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1a1008",
                  }}
                >
                  ✓ Seleccionado
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 0, gap: 2, justifyContent: "center", position: "relative", zIndex: 1 }}>
        {isSelected ? (
          <>
            <MetallicButton variant="gray" onClick={onReject} sx={{ flex: 1 }}>
              Cerrar
            </MetallicButton>
            <MetallicButton variant="red" onClick={onDeselect} sx={{ flex: 1 }}>
              Deseleccionar
            </MetallicButton>
          </>
        ) : (
          <>
            <MetallicButton variant="gray" onClick={onReject} sx={{ flex: 1 }}>
              Rechazar
            </MetallicButton>
            <MetallicButton variant="gold" onClick={onAccept} sx={{ flex: 1 }}>
              Aceptar
            </MetallicButton>
          </>
        )}
      </DialogActions>
    </>
  );
};

