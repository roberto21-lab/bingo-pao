import { Box, Typography, Dialog, DialogContent, DialogActions, Button, Chip } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import CardMiniature from "./CardMiniature";
import CardBadge from "./CardBadge";
import type { BingoGrid } from "../utils/bingo";
import type { RoomWinner } from "../Services/bingo.service";
import { getBingoTypeName } from "../utils/bingoUtils";
import { getUserId } from "../Services/auth.service";

type CardListProps = {
  cards: BingoGrid[];
  cardsData?: Array<{ _id: string; code: string }>;
  calledNumbers: Set<string>;
  markedNumbers: Map<number, Set<string>>;
  hasBingo: (index: number) => boolean;
  onCardClick: (index: number) => void;
  bingoPatternNumbersMap?: Map<number, Set<string>>;
  roomId?: string;
  isGameFinished?: boolean;
  // ISSUE-8: Cambiado a Map<string, Set<string>> usando card_id como clave
  // para que miniaturas y modal usen exactamente la misma fuente de datos
  winningNumbersMap?: Map<string, Set<string>>;
  showWinners?: boolean; // Si se están mostrando cartones ganadores
  winners?: RoomWinner[]; // Datos de los ganadores (ronda, patrón, etc.)
  showLoserAnimation?: boolean; // Si se debe mostrar animación de "mala suerte"
  currentUserId?: string; // ID del usuario en sesión para identificar sus cartones ganadores
  hasClaimedBingoInRound?: boolean; // ISSUE-4: Si el usuario ya cantó bingo en esta ronda
};

function mapPatternToBingoType(patternName: string): "horizontal" | "vertical" | "smallCross" | "fullCard" {
  switch (patternName) {
    case "horizontal":
      return "horizontal";
    case "vertical":
      return "vertical";
    case "cross_small":
      return "smallCross";
    case "full":
      return "fullCard";
    default:
      return "fullCard";
  }
}

export default function CardList({
  cards,
  cardsData = [],
  calledNumbers,
  markedNumbers,
  hasBingo,
  onCardClick,
  bingoPatternNumbersMap = new Map(),
  roomId,
  isGameFinished = false,
  winningNumbersMap = new Map(),
  showWinners = false,
  winners = [],
  showLoserAnimation = false,
  currentUserId,
  hasClaimedBingoInRound = false, // ISSUE-4: Si el usuario ya cantó bingo
}: CardListProps) {
  const navigate = useNavigate();
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  
  // Obtener el ID del usuario en sesión si no se proporciona
  const userId = currentUserId || getUserId() || "";
  
  const getMarkedForCard = (cardIndex: number): Set<string> => {
    return markedNumbers.get(cardIndex) || new Set();
  };

  const handleAddCards = () => {
    setConfirmModalOpen(true);
  };

  const handleConfirmAddCards = () => {
    setConfirmModalOpen(false);
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleCancelAddCards = () => {
    setConfirmModalOpen(false);
  };

  return (
    <>
      <Typography
        variant="h6"
        sx={{
          fontSize: { xs: "18px", sm: "20px" },
          fontWeight: 700,
          background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Montserrat', sans-serif",
          textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
        }}
      >
        {showWinners ? "Cartones Ganadores" : "Mis Cartones"}
      </Typography>

      <Box
        sx={{
          mb: 4,
          px: { xs: 1, sm: 2 },
          py: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: "grid",
            // Responsive: 2 columnas en móvil, 3 en tablet/desktop
            gridTemplateColumns: { 
              xs: "repeat(2, 1fr)", // 2 cartones en pantallas pequeñas (375px)
              sm: "repeat(3, 1fr)", // 3 cartones en pantallas medianas
              md: "repeat(3, 1fr)", // 3 cartones en desktop
            },
            gap: { xs: 1.5, sm: 2 },
            py: { xs: 1, sm: 2 },
          }}
        >
          {cards.map((card, index) => {
            const cardMarked = getMarkedForCard(index);
            const cardHasBingo = hasBingo(index);
            const cardBingoPatternNumbers = bingoPatternNumbersMap.get(index) || new Set<string>();
            
            // Cuando se muestran ganadores, buscar el ganador por índice del array (que corresponde a la ronda)
            // Los ganadores ya vienen ordenados por round_number del backend
            const winner = showWinners && winners.length > index ? winners[index] : null;
            const cardCode = showWinners && winner 
              ? winner.card_code 
              : (cardsData[index]?.code || String(index + 1));
            
            // Verificar si este cartón pertenece al usuario en sesión
            const isUserCard = showWinners && winner && userId && winner.user_id === userId;
            
            // FIX-WINNING-MAP: Usar clave compuesta card_id + round_number
            // Esto es necesario cuando el mismo cartón gana múltiples rondas
            const mapKey = winner ? `${winner.card_id}_round_${winner.round_number}` : null;
            const winningNumbersForCard = mapKey 
              ? winningNumbersMap.get(mapKey) 
              : (cardsData[index]?._id ? winningNumbersMap.get(cardsData[index]._id) : undefined);
            
            // DEBUG: Log para diagnosticar el problema de las miniaturas
            if (showWinners && winner) {
              console.log(`[CardList] 🔍 DEBUG Miniatura Ronda ${winner.round_number}:`, {
                cardCode: winner.card_code,
                card_id: winner.card_id,
                mapKey: mapKey,
                winningNumbersMapKeys: Array.from(winningNumbersMap.keys()),
                winningNumbersForCard: winningNumbersForCard ? Array.from(winningNumbersForCard) : 'undefined',
                bingo_numbers_from_winner: winner.bingo_numbers,
              });
            }

            return (
              <Box key={index} sx={{ position: "relative", display: "flex", flexDirection: "column", gap: { xs: 0.5, sm: 1 } }}>
                {showWinners && winner && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.75,
                      alignItems: "center",
                      mb: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: "12px",
                      background: isUserCard
                        ? "linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(56, 142, 60, 0.25) 100%)"
                        : "linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 208, 63, 0.15) 100%)",
                      border: isUserCard
                        ? "1.5px solid rgba(76, 175, 80, 0.6)"
                        : "1.5px solid rgba(212, 175, 55, 0.4)",
                      boxShadow: isUserCard
                        ? "0 2px 8px rgba(76, 175, 80, 0.3), 0 0 12px rgba(76, 175, 80, 0.2)"
                        : "0 2px 8px rgba(212, 175, 55, 0.2)",
                      position: "relative",
                    }}
                  >
                    {/* Badge indicando que es tu cartón */}
                    {isUserCard && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          px: 1,
                          py: 0.5,
                          borderRadius: "8px",
                          background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                          border: "2px solid rgba(255, 255, 255, 0.9)",
                          boxShadow: "0 2px 8px rgba(76, 175, 80, 0.5)",
                          zIndex: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "9px",
                            fontWeight: 900,
                            color: "#ffffff",
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                            fontFamily: "'Montserrat', sans-serif",
                            letterSpacing: "0.5px",
                          }}
                        >
                          TU CARTÓN
                        </Typography>
                      </Box>
                    )}
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#d4af37",
                        textShadow: "0 1px 3px rgba(212, 175, 55, 0.5)",
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      Ronda {winner.round_number}
                    </Typography>
                    <Chip
                      label={getBingoTypeName(mapPatternToBingoType(winner.pattern))}
                      sx={{
                        backgroundColor: "rgba(212, 175, 55, 0.3)",
                        color: "#d4af37",
                        border: "1px solid rgba(212, 175, 55, 0.5)",
                        fontWeight: 700,
                        fontSize: "11px",
                        height: "24px",
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: "11px",
                        color: "#f5e6d3",
                        opacity: 0.95,
                        mt: 0.25,
                        fontWeight: 600,
                      }}
                    >
                      Premio: Bs. {parseFloat(winner.prize_amount).toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ position: "relative" }}>
                  <CardMiniature
                    grid={card}
                    cardCode={cardCode}
                    selected={false}
                    onClick={() => onCardClick(index)}
                    status="free"
                    calledNumbers={calledNumbers}
                    markedNumbers={cardMarked}
                    hasBingo={cardHasBingo}
                    bingoPatternNumbers={cardBingoPatternNumbers}
                    // FIX-WINNING: Usar winningNumbersForCard que ya calculamos arriba
                    // Si no hay datos del map, crear Set directamente de winner.bingo_numbers
                    // Solo si bingo_numbers tiene elementos (no vacío)
                    winningNumbers={winningNumbersForCard || (winner && winner.bingo_numbers && winner.bingo_numbers.length > 0 ? new Set(winner.bingo_numbers) : undefined)}
                    // ISSUE-4: NO mostrar "Mala Suerte" si el usuario ya cantó bingo en esta ronda
                    showLoserAnimation={showLoserAnimation && !cardHasBingo && !hasClaimedBingoInRound}
                    // ISSUE-2: Pasar si la sala está finalizada para no mostrar números en rojo
                    isFinishedRoom={isGameFinished && showWinners}
                  />
                  {!showWinners && <CardBadge hasBingo={cardHasBingo} markedCount={cardMarked.size} />}
                </Box>
              </Box>
            );
          })}
          
          {/* Botón para añadir más cartones - Solo se muestra si el juego no está finalizado */}
          {!isGameFinished && roomId && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
                position: "relative",
              }}
            >
              <Box
                component="button"
                onClick={handleAddCards}
                sx={{
                  width: "100%",
                  borderRadius: "12px",
                  border: "2px dashed rgba(212, 175, 55, 0.5)",
                  backgroundColor: "rgba(212, 175, 55, 0.1)",
                  color: "#d4af37",
                  fontWeight: 600,
                  textTransform: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 1,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    border: "2px dashed rgba(212, 175, 55, 0.8)",
                    backgroundColor: "rgba(212, 175, 55, 0.2)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 2px 8px rgba(212, 175, 55, 0.3)",
                  },
                  "&:last-child": {
                    pb: 1,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.5,
                    px: 0.5,
                    width: "100%",
                  }}
                >
                  <Box sx={{ flex: 1 }} />
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#d4af37",
                    }}
                  >
                    +
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    width: "100%",
                    flex: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "20px",
                      lineHeight: 1,
                      fontWeight: 700,
                      color: "#d4af37",
                    }}
                  >
                    +
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "8px",
                      textAlign: "center",
                      lineHeight: 1.2,
                      fontWeight: 600,
                      color: "#d4af37",
                    }}
                  >
                    Añadir más
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal de confirmación para añadir más cartones */}
      <Dialog
        open={confirmModalOpen}
        onClose={handleCancelAddCards}
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
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                color: "#d4af37",
                fontWeight: 700,
                mb: 2,
                fontFamily: "'Montserrat', sans-serif",
                textShadow: "0 2px 6px rgba(212, 175, 55, 0.7), 0 0 12px rgba(212, 175, 55, 0.4)",
              }}
            >
              ¿Añadir más cartones?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#ffffff",
                opacity: 0.9,
                lineHeight: 1.6,
              }}
            >
              Serás redirigido a la página de compra de cartones. Podrás seleccionar los cartones que deseas comprar.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            p: 4,
            pt: 0,
            gap: 2,
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Button
            onClick={handleCancelAddCards}
            variant="outlined"
            sx={{
              color: "#d4af37",
              borderColor: "rgba(212, 175, 55, 0.4)",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              backgroundColor: "rgba(212, 175, 55, 0.1)",
              "&:hover": {
                borderColor: "rgba(212, 175, 55, 0.6)",
                backgroundColor: "rgba(212, 175, 55, 0.2)",
                transform: "scale(1.05)",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAddCards}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.8) 0%, rgba(244, 208, 63, 0.9) 50%, rgba(212, 175, 55, 0.8) 100%)",
              color: "#1a1d2e",
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
                boxShadow: "0 6px 16px rgba(212, 175, 55, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                transform: "scale(1.05)",
              },
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

