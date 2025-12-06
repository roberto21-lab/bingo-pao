import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import type { BingoGrid } from "../utils/bingo";
import { numberToBingoFormat } from "../utils/bingoUtils";
import SparkleAnimation from "./SparkleAnimation";

type CardPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  onBingo: () => void;
  card: BingoGrid;
  cardCode: string;
  hasBingo: boolean;
  isNumberCalled: (num: number) => boolean;
  isNumberMarked: (num: number) => boolean;
  onNumberClick: (num: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  previousHasBingo?: boolean;
  nextHasBingo?: boolean;
  bingoPatternNumbers?: Set<string>;
  // ISSUE-1: Props para controlar el estado del botón de bingo
  hasClaimedBingoInRound?: boolean; // Si ya se intentó cantar bingo en esta ronda
  isClaimingBingo?: boolean; // Si hay un claim en progreso
  // ISSUE-2: Props para controlar si el cartón actual ya fue usado
  isCurrentCardClaimed?: boolean; // Si este cartón específico ya fue usado
};

export default function CardPreviewModal({
  open,
  onClose,
  onBingo,
  card,
  cardCode,
  hasBingo,
  isNumberCalled,
  isNumberMarked,
  onNumberClick,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  previousHasBingo = false,
  nextHasBingo = false,
  bingoPatternNumbers = new Set<string>(),
  // ISSUE-1: Props para controlar el estado del botón de bingo
  hasClaimedBingoInRound = false,
  isClaimingBingo = false,
  // ISSUE-2: Props para controlar si el cartón actual ya fue usado
  isCurrentCardClaimed = false,
}: CardPreviewModalProps) {
  // ISSUE-1 & ISSUE-2: Determinar si el botón de bingo debe estar deshabilitado
  const isBingoButtonDisabled = hasClaimedBingoInRound || isClaimingBingo || isCurrentCardClaimed;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(25px) saturate(120%)",
            WebkitBackdropFilter: "blur(25px) saturate(120%)",
          },
        },
      }}
      PaperProps={{
        className: "glass-effect",
        sx: {
          backgroundColor: "rgba(31, 19, 9, 0.92)",
          backdropFilter: "blur(40px) saturate(150%)",
          WebkitBackdropFilter: "blur(40px) saturate(150%)",
          borderRadius: "24px",
          border: "2px solid rgba(212, 175, 55, 0.3)",
          // Textura de pergamino/papel viejo sutil (acorde al tema oscuro)
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              rgba(31, 19, 9, 0.92) 0px,
              rgba(35, 22, 11, 0.94) 1px,
              rgba(40, 25, 13, 0.92) 2px,
              rgba(35, 22, 11, 0.94) 3px,
              rgba(31, 19, 9, 0.92) 4px,
              rgba(31, 19, 9, 0.92) 12px,
              rgba(35, 22, 11, 0.94) 13px,
              rgba(40, 25, 13, 0.92) 14px,
              rgba(35, 22, 11, 0.94) 15px,
              rgba(31, 19, 9, 0.92) 16px
            ),
            linear-gradient(
              90deg,
              rgba(31, 19, 9, 0.92) 0%,
              rgba(35, 22, 11, 0.93) 25%,
              rgba(40, 25, 13, 0.92) 50%,
              rgba(35, 22, 11, 0.93) 75%,
              rgba(31, 19, 9, 0.92) 100%
            ),
            radial-gradient(ellipse 400px 300px at 30% 40%, rgba(50, 30, 15, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 70% 60%, rgba(45, 28, 14, 0.12) 0%, transparent 60%)
          `,
          backgroundSize: `
            100% 32px,
            200% 100%,
            100% 100%,
            100% 100%
          `,
          boxShadow: `
            0 0 30px rgba(255, 255, 255, 0.06),
            0 0 60px rgba(255, 255, 255, 0.04),
            0 0 90px rgba(255, 255, 255, 0.02),
            0 15px 50px rgba(0, 0, 0, 0.6),
            0 30px 80px rgba(0, 0, 0, 0.4)
          `,
          position: "relative",
          overflow: "visible",
          transform: "translateY(-10px)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          // Efecto de luz blanca muy difuminada en los bordes (sin líneas visibles)
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-5px",
            left: "-5px",
            right: "-5px",
            bottom: "-5px",
            borderRadius: "29px",
            background: `
              radial-gradient(circle 150px at top left, rgba(255, 255, 255, 0.12) 0%, transparent 60%),
              radial-gradient(circle 150px at top right, rgba(255, 255, 255, 0.12) 0%, transparent 60%),
              radial-gradient(circle 150px at bottom left, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
              radial-gradient(circle 150px at bottom right, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
              linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 30%, rgba(255, 255, 255, 0.08) 100%)
            `,
            zIndex: -1,
            filter: "blur(20px)",
            opacity: 0.4,
          },
          // Luz blanca sutil debajo del modal que difumina
          "&::after": {
            content: '""',
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "110%",
            height: "110%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 30%, transparent 70%)",
            filter: "blur(35px)",
            zIndex: -2,
            pointerEvents: "none",
          },
        },
      }}
    >
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
          {/* Flecha izquierda (anterior) */}
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={onPrevious}
              disabled={!hasPrevious || !onPrevious}
              sx={{
                color: hasPrevious ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                backgroundColor: hasPrevious
                  ? previousHasBingo && !hasBingo
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(212, 175, 55, 0.1)"
                  : "transparent",
                border: hasPrevious
                  ? previousHasBingo && !hasBingo
                    ? "2px solid rgba(76, 175, 80, 0.6)"
                    : "2px solid rgba(212, 175, 55, 0.4)"
                  : "2px solid rgba(212, 175, 55, 0.1)",
                borderRadius: "12px",
                width: "48px",
                height: "48px",
                "&:hover": hasPrevious && onPrevious
                  ? {
                      backgroundColor: previousHasBingo && !hasBingo
                        ? "rgba(76, 175, 80, 0.3)"
                        : "rgba(212, 175, 55, 0.2)",
                      borderColor: previousHasBingo && !hasBingo
                        ? "rgba(76, 175, 80, 0.8)"
                        : "rgba(212, 175, 55, 0.6)",
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
            {/* Indicador de bingo en la flecha anterior */}
            {previousHasBingo && !hasBingo && hasPrevious && onPrevious && (
              <Box
                sx={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#4caf50",
                  border: "2px solid rgba(31, 19, 9, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 8px rgba(76, 175, 80, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)",
                  animation: "pulse 2s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { transform: "scale(1)", opacity: 1 },
                    "50%": { transform: "scale(1.2)", opacity: 0.8 },
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}
                >
                  ✓
                </Typography>
              </Box>
            )}
          </Box>

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
              background: hasBingo
                ? "linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(76, 175, 80, 0.2) 100%)"
                : "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.15) 100%)",
              border: hasBingo
                ? "2px solid rgba(76, 175, 80, 0.6)"
                : "1px solid rgba(212, 175, 55, 0.5)",
              backdropFilter: "blur(10px)",
              boxShadow: hasBingo
                ? "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 12px rgba(76, 175, 80, 0.4), 0 0 20px rgba(76, 175, 80, 0.2)"
                : "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 8px rgba(212, 175, 55, 0.2)",
              minWidth: "100px",
              maxWidth: "140px",
              position: "relative",
              animation: hasBingo ? "bingoGlow 2s ease-in-out infinite" : "none",
              "@keyframes bingoGlow": {
                "0%, 100%": { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 12px rgba(76, 175, 80, 0.4), 0 0 20px rgba(76, 175, 80, 0.2)" },
                "50%": { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 16px rgba(76, 175, 80, 0.6), 0 0 30px rgba(76, 175, 80, 0.4)" },
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "16px",
                textAlign: "center",
                color: hasBingo ? "#4caf50" : "#d4af37",
                fontWeight: 900,
                fontFamily: "'Montserrat', sans-serif",
                textShadow: hasBingo
                  ? "0 2px 6px rgba(76, 175, 80, 0.7), 0 0 12px rgba(76, 175, 80, 0.5)"
                  : "0 2px 6px rgba(212, 175, 55, 0.7), 0 0 12px rgba(212, 175, 55, 0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Cartón {cardCode}
            </Typography>
            {hasBingo && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "#4caf50",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 0 8px rgba(76, 175, 80, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}
                >
                  ✓
                </Typography>
              </Box>
            )}
          </Box>

          {/* Flecha derecha (siguiente) */}
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={onNext}
              disabled={!hasNext || !onNext}
              sx={{
                color: hasNext ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                backgroundColor: hasNext
                  ? nextHasBingo && !hasBingo
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(212, 175, 55, 0.1)"
                  : "transparent",
                border: hasNext
                  ? nextHasBingo && !hasBingo
                    ? "2px solid rgba(76, 175, 80, 0.6)"
                    : "2px solid rgba(212, 175, 55, 0.4)"
                  : "2px solid rgba(212, 175, 55, 0.1)",
                borderRadius: "12px",
                width: "48px",
                height: "48px",
                "&:hover": hasNext && onNext
                  ? {
                      backgroundColor: nextHasBingo && !hasBingo
                        ? "rgba(76, 175, 80, 0.3)"
                        : "rgba(212, 175, 55, 0.2)",
                      borderColor: nextHasBingo && !hasBingo
                        ? "rgba(76, 175, 80, 0.8)"
                        : "rgba(212, 175, 55, 0.6)",
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
            {/* Indicador de bingo en la flecha siguiente */}
            {nextHasBingo && !hasBingo && hasNext && onNext && (
              <Box
                sx={{
                  position: "absolute",
                  top: "-4px",
                  left: "-4px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#4caf50",
                  border: "2px solid rgba(31, 19, 9, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 8px rgba(76, 175, 80, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)",
                  animation: "pulse 2s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { transform: "scale(1)", opacity: 1 },
                    "50%": { transform: "scale(1.2)", opacity: 0.8 },
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}
                >
                  ✓
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 3,
            position: "relative",
          }}
        >
          {hasBingo && <SparkleAnimation />}
          <Box
            sx={{
              width: "100%",
              maxWidth: "400px",
              backgroundColor: hasBingo ? "#d4c4a8" : "#f5e6d3",
              borderRadius: "16px",
              p: 3,
              border: hasBingo ? "2px solid rgba(76, 175, 80, 0.4)" : "2px solid rgba(212, 175, 55, 0.2)",
              position: "relative",
              zIndex: 1,
              // Textura de cartón viejo sutil (más oscuro si hay bingo)
              backgroundImage: hasBingo
                ? `
                  repeating-linear-gradient(
                    0deg,
                    #d4c4a8 0px,
                    #c9b99d 1px,
                    #beae92 2px,
                    #c9b99d 3px,
                    #d4c4a8 4px,
                    #d4c4a8 20px,
                    #c9b99d 21px,
                    #beae92 22px,
                    #c9b99d 23px,
                    #d4c4a8 24px
                  ),
                  linear-gradient(
                    90deg,
                    #d4c4a8 0%,
                    #c9b99d 30%,
                    #beae92 50%,
                    #c9b99d 70%,
                    #d4c4a8 100%
                  ),
                  radial-gradient(ellipse 300px 200px at 25% 30%, rgba(180, 160, 140, 0.3) 0%, transparent 70%),
                  radial-gradient(ellipse 250px 180px at 75% 70%, rgba(170, 150, 130, 0.25) 0%, transparent 70%),
                  radial-gradient(ellipse 200px 150px at 50% 50%, rgba(76, 175, 80, 0.1) 0%, transparent 60%)
                `
                : `
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
                100% 100%,
                ${hasBingo ? "100% 100%" : ""}
              `,
              boxShadow: hasBingo
                ? `
                  0 0 15px rgba(255, 255, 255, 0.12),
                  0 0 30px rgba(255, 255, 255, 0.08),
                  0 0 45px rgba(255, 255, 255, 0.05),
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  inset 0 0 20px rgba(0, 0, 0, 0.05)
                `
                : `
                  0 0 10px rgba(255, 255, 255, 0.08),
                  0 0 20px rgba(255, 255, 255, 0.05),
                  0 4px 16px rgba(0, 0, 0, 0.3),
                  inset 0 0 15px rgba(0, 0, 0, 0.03)
                `,
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: "16px",
                background: `
                  radial-gradient(ellipse 100px 80px at 20% 25%, rgba(0, 0, 0, 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse 80px 60px at 80% 75%, rgba(0, 0, 0, 0.06) 0%, transparent 50%)
                `,
                pointerEvents: "none",
                zIndex: 0,
              },
            }}
          >
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

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 1,
              }}
            >
              {card.map((row, rowIndex) =>
                row.map((num, colIndex) => {
                  const isFree = num === 0;
                  const isCalled = isNumberCalled(num);
                  const isMarked = isNumberMarked(num);
                  const canMark = isCalled && !isFree && !hasBingo;
                  const isNotMarked = isCalled && !isMarked && !isFree;
                  const numFormat = num !== 0 ? numberToBingoFormat(num) : "";
                  const isPartOfBingoPattern = hasBingo && numFormat !== "" && bingoPatternNumbers.has(numFormat);
                  const shouldBeGold = isPartOfBingoPattern && isMarked;

                  return (
                    <Box
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => canMark && onNumberClick(num)}
                      sx={{
                        aspectRatio: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isFree
                          ? hasBingo ? "#d0c0a4" : "#e8dcc8"
                          : shouldBeGold
                          ? "#f5d99a"
                          : isMarked
                          ? "#c8e6c9"
                          : isNotMarked
                          ? "#ffcdd2"
                          : hasBingo ? "#d4c4a8" : "#f5e6d3",
                        borderRadius: "4px",
                        border: isFree
                          ? "1px solid rgba(200, 180, 160, 0.4)"
                          : shouldBeGold
                          ? "2px solid #e3bf70"
                          : isMarked
                          ? "2px solid #4caf50"
                          : isNotMarked
                          ? "2px solid #f44336"
                          : "1px solid rgba(200, 180, 160, 0.3)",
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#1a1008",
                        position: "relative",
                        zIndex: 2,
                        textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                        cursor: canMark ? "pointer" : "default",
                        transition: "all 0.2s",
                        "&:hover": canMark
                          ? {
                              backgroundColor: isMarked ? "#a5d6a7" : "#ffcdd2",
                              transform: "scale(1.05)",
                            }
                          : {},
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
                        <>
                          {num}
                          {isMarked && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: "#4caf50",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  color: "#ffffff",
                                  fontWeight: 700,
                                }}
                              >
                                ✓
                              </Typography>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>

        {!hasBingo && (
          <Typography
            variant="body2"
            sx={{
              color: "#d4af37",
              fontSize: "12px",
              textAlign: "center",
              mt: 2,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              fontWeight: 600,
            }}
          >
            Toca los números verdes para marcarlos o desmarcarlos
          </Typography>
        )}
        {hasBingo && (
          <Typography
            variant="h6"
            sx={{
              color: "#d4af37",
              fontSize: "24px",
              fontWeight: 900,
              textAlign: "center",
              mt: 2,
              textShadow: "0 2px 8px rgba(212, 175, 55, 0.7), 0 0 12px rgba(212, 175, 55, 0.4)",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ¡BINGO!
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 2, justifyContent: "center", flexDirection: "column" }}>
        {/* ISSUE-1 & ISSUE-2: Mensaje cuando el botón está deshabilitado */}
        {hasBingo && (hasClaimedBingoInRound || isCurrentCardClaimed) && (
          <Typography
            sx={{
              color: "#ff9800",
              fontSize: "14px",
              fontWeight: 600,
              textAlign: "center",
              backgroundColor: "rgba(255, 152, 0, 0.1)",
              border: "1px solid rgba(255, 152, 0, 0.3)",
              borderRadius: "8px",
              px: 2,
              py: 1,
              width: "100%",
            }}
          >
            {isCurrentCardClaimed 
              ? "Este cartón ya fue usado para cantar bingo en esta ronda"
              : "Ya realizaste tu intento de bingo en esta ronda"}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 2, width: "100%", justifyContent: "center" }}>
        {hasBingo && (
          <Button
            onClick={() => {
              console.log(`[CardPreviewModal] 🎯 Botón BINGO clickeado`);
              console.log(`[CardPreviewModal]    - hasBingo: ${hasBingo}`);
              console.log(`[CardPreviewModal]    - isBingoButtonDisabled: ${isBingoButtonDisabled}`);
              console.log(`[CardPreviewModal]    - onBingo: ${typeof onBingo}`);
              if (isBingoButtonDisabled) {
                console.log(`[CardPreviewModal] ⚠️ Botón deshabilitado, no se ejecuta onBingo`);
                return;
              }
              if (onBingo) {
                onBingo();
              } else {
                console.error(`[CardPreviewModal] ❌ onBingo no está definido!`);
              }
            }}
            disabled={isBingoButtonDisabled}
            className="gold-metallic"
            sx={{
              flex: 1,
              py: 1.75,
              borderRadius: "8px 8px 12px 12px",
              textTransform: "none",
              background: isBingoButtonDisabled
                ? "linear-gradient(135deg, #888 0%, #999 50%, #888 100%)"
                : "linear-gradient(135deg, #d4af37 0%, #f4d03f 15%, #ffd700 30%, #f4d03f 45%, #d4af37 60%, #b8941f 75%, #d4af37 90%, #f4d03f 100%)",
              backgroundSize: "200% 200%",
              animation: isBingoButtonDisabled ? "none" : "goldShimmer 4s ease-in-out infinite",
              color: isBingoButtonDisabled ? "#555" : "#1a1008",
              fontWeight: 900,
              fontSize: "20px",
              letterSpacing: "1px",
              boxShadow: isBingoButtonDisabled
                ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                : `
                  0 8px 24px rgba(0, 0, 0, 0.6),
                  0 4px 12px rgba(212, 175, 55, 0.5),
                  inset 0 2px 4px rgba(255, 255, 255, 0.3),
                  inset 0 -4px 8px rgba(0, 0, 0, 0.4),
                  inset 0 0 20px rgba(255, 215, 0, 0.2)
                `,
              border: "none",
              borderTop: isBingoButtonDisabled ? "none" : "2px solid rgba(255, 255, 255, 0.4)",
              borderBottom: isBingoButtonDisabled ? "none" : "3px solid rgba(0, 0, 0, 0.3)",
              transform: isBingoButtonDisabled ? "none" : "perspective(200px) rotateX(2deg)",
              opacity: isBingoButtonDisabled ? 0.6 : 1,
              cursor: isBingoButtonDisabled ? "not-allowed" : "pointer",
              "@keyframes goldShimmer": {
                "0%, 100%": { backgroundPosition: "0% 50%" },
                "50%": { backgroundPosition: "100% 50%" },
              },
              "&:hover": isBingoButtonDisabled
                ? {}
                : {
                    transform: "perspective(200px) rotateX(2deg) translateY(-2px)",
                    boxShadow: `
                      0 12px 32px rgba(0, 0, 0, 0.7),
                      0 6px 16px rgba(212, 175, 55, 0.6),
                      inset 0 2px 4px rgba(255, 255, 255, 0.4),
                      inset 0 -4px 8px rgba(0, 0, 0, 0.5)
                    `,
                  },
              "&:disabled": {
                background: "linear-gradient(135deg, #888 0%, #999 50%, #888 100%)",
                color: "#555",
              },
            }}
          >
            {isClaimingBingo ? "Enviando..." : "BINGO"}
          </Button>
        )}
        <Button
          onClick={onClose}
          sx={{
            flex: hasBingo ? 1 : "none",
            py: 1.5,
            px: hasBingo ? 0 : 4,
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
        </Box>
      </DialogActions>
    </Dialog>
  );
}

