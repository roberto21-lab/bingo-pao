import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Link,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import SelectableCard from "../Componets/SelectableCard";
import { generateCards } from "../utils/bingo";

type Room = {
  id: string;
  title: string;
  prizeAmount: number;
  currency: string;
  ticketsToStart: number;
  ticketPrice: number;
};

const MOCK_ROOMS: Room[] = [
  { id: "cosmo-cash", title: "Cosmo Cash", prizeAmount: 500, currency: "USD", ticketsToStart: 112, ticketPrice: 5.0 },
  { id: "golden-galaxy", title: "Golden Galaxy", prizeAmount: 200, currency: "USD", ticketsToStart: 400, ticketPrice: 10.0 },
  { id: "lucky-star", title: "Lucky Star Bingo", prizeAmount: 200, currency: "USD", ticketsToStart: 400, ticketPrice: 10.0 },
  { id: "sala-1", title: "Sala Principal", prizeAmount: 10000, currency: "Bs", ticketsToStart: 112, ticketPrice: 100 },
  { id: "sala-2", title: "Sala Nocturna", prizeAmount: 5400, currency: "USD", ticketsToStart: 400, ticketPrice: 10 },
];


export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const room = React.useMemo(() => MOCK_ROOMS.find((r) => r.id === roomId), [roomId]);
  
  const allCards = React.useMemo(() => generateCards(45), []);
  
  const firstRowCards = allCards.slice(0, 15);
  const secondRowCards = allCards.slice(15, 30);
  const thirdRowCards = allCards.slice(30, 45);
  
  const [selectedCards, setSelectedCards] = React.useState<Set<number>>(new Set());
  const [availableBalance] = React.useState(1250.75);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [previewCardIndex, setPreviewCardIndex] = React.useState<number | null>(null);

  const handleCardClick = (index: number) => {
    if (selectedCards.has(index)) {
      setSelectedCards((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      return;
    }
    setPreviewCardIndex(index);
    setModalOpen(true);
  };

  const handleAcceptCard = () => {
    if (previewCardIndex !== null) {
      setSelectedCards((prev) => {
        const next = new Set(prev);
        next.add(previewCardIndex);
        return next;
      });
    }
    handleCloseModal();
  };

  const handleRejectCard = () => {
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewCardIndex(null);
  };

  const handleRandom = () => {
    const randomIndices = Array.from({ length: allCards.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setSelectedCards(new Set(randomIndices));
  };

  const handleFavoriteNumbers = () => {
    console.log("Mis números favoritos");
  };

  const handleEnroll = () => {
    if (selectedCards.size === 0 || !roomId) return;
    const totalPrice = selectedCards.size * (room?.ticketPrice || 0);
    console.log("Inscribirse con cartones:", Array.from(selectedCards), "Total:", totalPrice);
    navigate(`/game/${roomId}`);
  };

  if (!room) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h6" sx={{ color: "#ffffff" }}>
          Sala no encontrada
        </Typography>
      </Container>
    );
  }

  const totalPrice = selectedCards.size * room.ticketPrice;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1d2e",
        color: "#ffffff",
        paddingBottom: "80px",
      }}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            fontSize: { xs: "24px", sm: "28px" },
            fontWeight: 700,
            color: "#ffffff",
            mb: 3,
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          Selecciona Tus Cartones
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ mb: 2, justifyContent: "center" }}>
          <Button
            onClick={handleRandom}
            sx={{
              background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#0f0f1e",
              fontWeight: 600,
              fontSize: "14px",
              py: 1,
              px: 2,
              borderRadius: "12px",
              textTransform: "none",
              border: "1px solid rgba(227, 191, 112, 0.3)",
              boxShadow: "0 4px 12px rgba(227, 191, 112, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
                boxShadow: "0 6px 16px rgba(227, 191, 112, 0.4)",
              },
            }}
          >
            Aleatorio
          </Button>
          <Button
            onClick={handleFavoriteNumbers}
            sx={{
              background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#0f0f1e",
              fontWeight: 600,
              fontSize: "14px",
              py: 1,
              px: 2,
              borderRadius: "12px",
              textTransform: "none",
              border: "1px solid rgba(227, 191, 112, 0.3)",
              boxShadow: "0 4px 12px rgba(227, 191, 112, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
                boxShadow: "0 6px 16px rgba(227, 191, 112, 0.4)",
              },
            }}
          >
            Mis Números Favoritos
          </Button>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: "#ffffff",
            opacity: 0.7,
            fontSize: "12px",
            mb: 2,
          }}
        >
          Libre / Ocupado
        </Typography>

        <Box
          sx={{
            overflowX: "auto",
            overflowY: "hidden",
            mb: 4,
            scrollSnapType: "x proximity",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(227, 191, 112, 0.3) transparent",
            "&::-webkit-scrollbar": {
              height: "8px",
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
          }}
        >
          <Stack spacing={3} sx={{ display: "inline-block", minWidth: "100%" }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: "max-content",
                "& > *": {
                  minWidth: "calc((100vw - 96px) / 3.5)", 
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
              {firstRowCards.map((card, index) => (
                <SelectableCard
                  key={index}
                  grid={card}
                  cardId={index + 1}
                  selected={selectedCards.has(index)}
                  onClick={() => handleCardClick(index)}
                  status="free"
                />
              ))}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: "max-content",
                "& > *": {
                  minWidth: "calc((100vw - 96px) / 3.5)", 
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
              {secondRowCards.map((card, index) => {
                const globalIndex = index + 15;
                return (
                  <SelectableCard
                    key={globalIndex}
                    grid={card}
                    cardId={globalIndex + 1}
                    selected={selectedCards.has(globalIndex)}
                    onClick={() => handleCardClick(globalIndex)}
                    status="free"
                  />
                );
              })}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: "max-content",
                "& > *": {
                  minWidth: "calc((100vw - 96px) / 3.5)", 
                  flexShrink: 0,
                  scrollSnapAlign: "start",
                },
              }}
            >
              {thirdRowCards.map((card, index) => {
                const globalIndex = index + 30;
                return (
                  <SelectableCard
                    key={globalIndex}
                    grid={card}
                    cardId={globalIndex + 1}
                    selected={selectedCards.has(globalIndex)}
                    onClick={() => handleCardClick(globalIndex)}
                    status="free"
                  />
                );
              })}
            </Box>
          </Stack>
        </Box>

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
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#ffffff", opacity: 0.8 }}>
                Cartones Seleccionados:
              </Typography>
              <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 600 }}>
                {selectedCards.size}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#ffffff", opacity: 0.8 }}>
                Precio Total:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#ffffff", fontWeight: 700, fontSize: "16px" }}
                >
                  ${totalPrice.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#ffffff", opacity: 0.8 }}>
                  USD
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#ffffff", opacity: 0.8 }}>
                Saldo Disponible:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#ffffff", fontWeight: 700, fontSize: "16px" }}
                >
                  ${availableBalance.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#ffffff", opacity: 0.8 }}>
                  USD
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        <Button
          fullWidth
          onClick={handleEnroll}
          disabled={selectedCards.size === 0}
          sx={{
            background: selectedCards.size > 0
              ? "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)"
              : "rgba(227, 191, 112, 0.3)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: selectedCards.size > 0 ? "#0f0f1e" : "#ffffff",
            fontWeight: 700,
            fontSize: "16px",
            py: 1.5,
            borderRadius: "16px",
            textTransform: "none",
            border: "1px solid rgba(227, 191, 112, 0.3)",
            boxShadow: selectedCards.size > 0
              ? "0 8px 24px rgba(227, 191, 112, 0.4)"
              : "none",
            mb: 2,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": selectedCards.size > 0 ? {
              background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
              boxShadow: "0 12px 32px rgba(227, 191, 112, 0.5)",
              transform: "translateY(-2px)",
            } : {},
            "&:disabled": {
              backgroundColor: "rgba(227, 191, 112, 0.2)",
              color: "rgba(255, 255, 255, 0.5)",
            },
          }}
        >
          Inscribirse
        </Button>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            console.log("Términos y Condiciones");
          }}
          sx={{
            display: "block",
            textAlign: "center",
            color: "#e3bf70",
            fontSize: "12px",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          Términos y Condiciones
        </Link>
      </Container>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1a1d2e",
            borderRadius: "20px",
            border: "1px solid rgba(227, 191, 112, 0.3)",
          },
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            sx={{
              textAlign: "center",
              color: "#ffffff",
              fontWeight: 700,
              mb: 3,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            Cartón #{previewCardIndex !== null ? previewCardIndex + 1 : ""}
          </Typography>
          
          {previewCardIndex !== null && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "400px",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  p: 3,
                  border: "2px solid #e3bf70",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  {["B", "I", "N", "G", "O"].map((letter) => (
                    <Typography
                      key={letter}
                      sx={{
                        fontSize: "24px",
                        fontWeight: 900,
                        color: "#1a1d2e",
                        letterSpacing: "1px",
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
                  {allCards[previewCardIndex].map((row, rowIndex) =>
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
                            borderRadius: "4px",
                            border: "2px solid #e0e0e0",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#1a1d2e",
                            position: "relative",
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
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, gap: 2 }}>
          <Button
            onClick={handleRejectCard}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            Rechazar
          </Button>
          <Button
            onClick={handleAcceptCard}
            sx={{
              flex: 1,
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
              background: "linear-gradient(135deg, rgba(201, 168, 90, 0.8) 0%, rgba(227, 191, 112, 0.9) 50%, rgba(240, 208, 138, 0.8) 100%)",
              color: "#0f0f1e",
              border: "1px solid rgba(227, 191, 112, 0.3)",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(227, 191, 112, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, rgba(212, 179, 102, 0.9) 0%, rgba(236, 200, 130, 1) 50%, rgba(245, 217, 154, 0.9) 100%)",
                boxShadow: "0 6px 16px rgba(227, 191, 112, 0.4)",
              },
            }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
