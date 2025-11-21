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
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import SelectableCard from "../Componets/SelectableCard";
import { generateCards } from "../utils/bingo";
import { type BackendRoom } from "../Services/rooms.service";
import { api } from "../Services/api";
import BackgroundStars from "../Componets/BackgroundStars";

type RoomDetailData = {
  id: string;
  title: string;
  prizeAmount: number;
  currency: string;
  ticketsToStart: number;
  ticketPrice: number;
  status: string;
};

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = React.useState<RoomDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchRoom = async () => {
      if (!roomId) {
        setError("ID de sala no proporcionado");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos completos del backend
        // El backend devuelve un objeto directo, no envuelto en { success, data }
        const response = await api.get<BackendRoom>(`/rooms/${roomId}`);
        
        if (!response.data) {
          throw new Error("Sala no encontrada");
        }
        
        const backendRoom = response.data;
        
        // Función para parsear Decimal128
        const parseDecimal = (decimal: unknown): number => {
          if (!decimal) return 0;
          if (typeof decimal === "string") return parseFloat(decimal) || 0;
          if (typeof decimal === "object" && decimal !== null && "$numberDecimal" in decimal) {
            return parseFloat(String(decimal.$numberDecimal)) || 0;
          }
          return typeof decimal === "number" ? decimal : 0;
        };
        
        const currency = typeof backendRoom.currency_id === "object" && backendRoom.currency_id
          ? backendRoom.currency_id
          : null;
        
        // Obtener el status
        const status = typeof backendRoom.status_id === "object" && backendRoom.status_id
          ? backendRoom.status_id.name || "waiting"
          : typeof backendRoom.status_id === "string"
          ? backendRoom.status_id
          : "waiting";
        
        // Mapear el status del backend al formato del frontend
        const mapStatus = (statusName: string): string => {
          switch (statusName) {
            case "waiting_players":
              return "waiting";
            case "preparing":
              return "preparing";
            case "in_progress":
              return "in_progress";
            case "finished":
            case "closed":
              return "locked";
            default:
              return statusName || "waiting";
          }
        };
        
        // Mapear BackendRoom a RoomDetailData
        const mappedStatus = mapStatus(status);
        
        const roomData: RoomDetailData = {
          id: backendRoom._id || backendRoom.id || "",
          title: backendRoom.name,
          prizeAmount: parseDecimal(backendRoom.total_pot),
          currency: currency?.code || "USD",
          ticketsToStart: backendRoom.min_players || 10,
          ticketPrice: parseDecimal(backendRoom.price_per_card),
          status: mappedStatus || "waiting", // Siempre tener un status por defecto
        };
        
        console.log("Room data loaded:", roomData);
        setRoom(roomData);
      } catch (err: any) {
        console.error("Error al cargar la sala:", err);
        setError(err?.response?.data?.message || err?.message || "Error al cargar la sala. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);
  
  const allCards = React.useMemo(() => generateCards(45), []);
  
  const [selectedCards, setSelectedCards] = React.useState<Set<number>>(new Set());
  const [availableBalance] = React.useState(1250.75);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [previewCardIndex, setPreviewCardIndex] = React.useState<number | null>(null);
  const [confirmDeselectModalOpen, setConfirmDeselectModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const handleCardClick = (index: number) => {
    // Siempre abrir el modal para ver el cartón, sin importar si está seleccionado o no
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

  const handleDeselectClick = () => {
    // Cerrar el modal de vista y abrir el modal de confirmación
    setModalOpen(false);
    setConfirmDeselectModalOpen(true);
  };

  const handleConfirmDeselect = () => {
    if (previewCardIndex !== null) {
      setSelectedCards((prev) => {
        const next = new Set(prev);
        next.delete(previewCardIndex);
        return next;
      });
    }
    setConfirmDeselectModalOpen(false);
    handleCloseModal();
  };

  const handleCancelDeselect = () => {
    setConfirmDeselectModalOpen(false);
    // Volver a abrir el modal de vista del cartón
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewCardIndex(null);
  };

  // Calcular índices filtrados para navegación
  const filteredIndices = React.useMemo(() => {
    return searchTerm
      ? allCards
          .map((_, index) => index)
          .filter((index) => {
            const cardId = index + 1;
            return cardId.toString().includes(searchTerm.trim());
          })
      : allCards.map((_, index) => index);
  }, [searchTerm, allCards]);

  const handlePreviousCard = () => {
    if (previewCardIndex !== null) {
      const currentPosition = filteredIndices.indexOf(previewCardIndex);
      if (currentPosition > 0) {
        setPreviewCardIndex(filteredIndices[currentPosition - 1]);
      }
    }
  };

  const handleNextCard = () => {
    if (previewCardIndex !== null) {
      const currentPosition = filteredIndices.indexOf(previewCardIndex);
      if (currentPosition < filteredIndices.length - 1) {
        setPreviewCardIndex(filteredIndices[currentPosition + 1]);
      }
    }
  };


  const handleEnroll = () => {
    if (selectedCards.size === 0 || !roomId) return;
    navigate(`/game/${roomId}`);
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          color: "#f5e6d3",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <BackgroundStars />
        <CircularProgress sx={{ color: "#d4af37", position: "relative", zIndex: 1 }} />
      </Box>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#1a1008",
          color: "#f5e6d3",
          paddingBottom: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <BackgroundStars />
        <Container maxWidth="sm" sx={{ py: 4, position: "relative", zIndex: 1 }}>
          <Alert 
            severity="error" 
            sx={{ 
              backgroundColor: "rgba(201, 168, 90, 0.2)", 
              color: "#c9a85a", 
              border: "1px solid rgba(201, 168, 90, 0.4)",
            }}
          >
            {error || "Sala no encontrada"}
          </Alert>
        </Container>
      </Box>
    );
  }

  const totalPrice = selectedCards.size * room.ticketPrice;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1008", // Fondo de madera oscura
        color: "#f5e6d3", // Texto crema
        paddingBottom: "80px",
        position: "relative",
        overflow: "hidden",
        // Textura de madera de fondo (más sutil)
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            #1a1008 0px,
            #1f1309 1px,
            #2a1a0f 2px,
            #1f1309 3px,
            #1a1008 4px,
            #1a1008 8px,
            #1f1309 9px,
            #2a1a0f 10px,
            #1f1309 11px,
            #1a1008 12px
          ),
          linear-gradient(
            90deg,
            #1a1008 0%,
            #1f1309 15%,
            #2a1a0f 30%,
            #1f1309 45%,
            #1a1008 60%,
            #1f1309 75%,
            #2a1a0f 90%,
            #1a1008 100%
          ),
          radial-gradient(ellipse 200px 50px at 25% 30%, rgba(42, 26, 15, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse 150px 40px at 75% 60%, rgba(31, 19, 9, 0.25) 0%, transparent 50%)
        `,
        backgroundSize: `
          100% 16px,
          200% 100%,
          100% 100%,
          100% 100%
        `,
        // Capa de difuminado/vaho sobre el fondo
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(0, 0, 0, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 500px 350px at 80% 60%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 400px 300px at 50% 20%, rgba(0, 0, 0, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 350px 250px at 15% 70%, rgba(0, 0, 0, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 450px 320px at 70% 15%, rgba(0, 0, 0, 0.1) 0%, transparent 60%)
          `,
          backdropFilter: "blur(8px) saturate(120%)",
          WebkitBackdropFilter: "blur(8px) saturate(120%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <BackgroundStars />

      <Container maxWidth="sm" sx={{ py: 4, position: "relative", zIndex: 1 }}>
        {/* Nombre de la sala - Barra que sale del borde izquierdo */}
        {room && (
          <Box 
            sx={{ 
              position: "absolute",
              left: 0,
              top: 32,
              display: "inline-flex",
              alignItems: "center",
              px: 2,
              py: 1,
              borderTopRightRadius: "8px",
              borderBottomRightRadius: "8px",
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
              border: "1.5px solid rgba(212, 175, 55, 1)",
              borderLeft: "none",
              boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
              zIndex: 2,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: "22px", sm: "26px" },
                fontWeight: 700,
                color: "#1a1008",
                fontFamily: "'Montserrat', sans-serif",
                letterSpacing: "0.5px",
              }}
            >
              {room.title}
            </Typography>
          </Box>
        )}

        <Stack spacing={3.5} marginTop={"5rem"}>

          {/* Título principal con badge de status */}
          <Box
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                lineHeight: 1.2,
              }}
            >
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Montserrat', sans-serif",
                  textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                }}
              >
                Selecciona
              </Typography>
              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #d4af37, #f4d03f, #d4af37)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Montserrat', sans-serif",
                  textShadow: "0 2px 4px rgba(212, 175, 55, 0.3)",
                  letterSpacing: "0.5px",
                  lineHeight: 1.2,
                }}
              >
                Tus Cartones
              </Typography>
            </Box>
            
            {/* Badge de status - Esquina superior derecha */}
            {room && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  display: "inline-flex",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "10px",
                  backgroundColor: (() => {
                    const statusColors: Record<string, string> = {
                      waiting: "#4caf50",
                      preparing: "#ff9800",
                      in_progress: "#f44336",
                      locked: "#9e9e9e",
                      finished: "#9e9e9e",
                    };
                    return (statusColors[room.status || "waiting"] || "#ffffff") + "25";
                  })(),
                  border: `2px solid ${(() => {
                    const statusColors: Record<string, string> = {
                      waiting: "#4caf50",
                      preparing: "#ff9800",
                      in_progress: "#f44336",
                      locked: "#9e9e9e",
                      finished: "#9e9e9e",
                    };
                    return statusColors[room.status || "waiting"] || "#ffffff";
                  })()}`,
                  boxShadow: `0 3px 10px ${(() => {
                    const statusColors: Record<string, string> = {
                      waiting: "rgba(76, 175, 80, 0.3)",
                      preparing: "rgba(255, 152, 0, 0.3)",
                      in_progress: "rgba(244, 67, 54, 0.3)",
                      locked: "rgba(158, 158, 158, 0.3)",
                      finished: "rgba(158, 158, 158, 0.3)",
                    };
                    return statusColors[room.status || "waiting"] || "rgba(255, 255, 255, 0.3)";
                  })()}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: (() => {
                      const statusColors: Record<string, string> = {
                        waiting: "#4caf50",
                        preparing: "#ff9800",
                        in_progress: "#f44336",
                        locked: "#9e9e9e",
                        finished: "#9e9e9e",
                      };
                      return statusColors[room.status || "waiting"] || "#ffffff";
                    })(),
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                    whiteSpace: "nowrap",
                    lineHeight: 1.2,
                  }}
                >
                  {(() => {
                    const statusLabels: Record<string, string> = {
                      waiting: "Esperando jugadores",
                      preparing: "Preparando",
                      in_progress: "En progreso",
                      locked: "Bloqueada",
                      finished: "Finalizada",
                    };
                    return statusLabels[room.status || "waiting"] || room.status || "Esperando jugadores";
                  })()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Barra de búsqueda por número serial */}
          <Box>
            <TextField
              fullWidth
              placeholder="Buscar por número de cartón..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#1a1008", fontSize: "22px" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  background: "linear-gradient(135deg, rgba(212, 175, 55, 0.9) 0%, rgba(244, 208, 63, 1) 50%, rgba(212, 175, 55, 0.9) 100%)",
                  borderRadius: "12px",
                  border: "1.5px solid rgba(212, 175, 55, 1)",
                  boxShadow: "0 2px 8px rgba(212, 175, 55, 0.5)",
                  transition: "all 0.3s ease",
                  "& fieldset": {
                    borderColor: "transparent",
                  },
                  "&:hover": {
                    boxShadow: "0 4px 16px rgba(212, 175, 55, 0.7)",
                    transform: "translateY(-1px)",
                  },
                  "&:hover fieldset": {
                    borderColor: "transparent",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 6px 20px rgba(212, 175, 55, 0.8)",
                    transform: "translateY(-1px)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "transparent",
                  },
                  "& input": {
                    color: "#1a1008",
                    fontSize: "15px",
                    fontWeight: 700,
                    padding: "14px 12px",
                    "&::placeholder": {
                      color: "rgba(26, 16, 8, 0.6)",
                      opacity: 1,
                      fontWeight: 500,
                    },
                  },
                },
              }}
            />
          </Box>

          {/* Indicador Libre / Ocupado */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "#f5e6d3",
                opacity: 0.85,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Precio por cartón: ${room?.ticketPrice}
            </Typography>
          </Box>

          {/* Filtrar cartones basado en la búsqueda */}
          {(() => {

            const filteredFirstRow = filteredIndices.filter((idx) => idx < 15);
            const filteredSecondRow = filteredIndices.filter((idx) => idx >= 15 && idx < 30);
            const filteredThirdRow = filteredIndices.filter((idx) => idx >= 30);

            return (
              <>
                {filteredIndices.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      px: 2,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#f5e6d3",
                        opacity: 0.7,
                      }}
                    >
                      No se encontraron cartones con el número "{searchTerm}"
                    </Typography>
                  </Box>
                ) : (
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
            {filteredFirstRow.length > 0 && (
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
                {filteredFirstRow.map((index) => (
                  <SelectableCard
                    key={index}
                    grid={allCards[index]}
                    cardId={index + 1}
                    selected={selectedCards.has(index)}
                    onClick={() => handleCardClick(index)}
                    status="free"
                  />
                ))}
              </Box>
            )}

            {filteredSecondRow.length > 0 && (
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
                {filteredSecondRow.map((globalIndex) => (
                  <SelectableCard
                    key={globalIndex}
                    grid={allCards[globalIndex]}
                    cardId={globalIndex + 1}
                    selected={selectedCards.has(globalIndex)}
                    onClick={() => handleCardClick(globalIndex)}
                    status="free"
                  />
                ))}
              </Box>
            )}

            {filteredThirdRow.length > 0 && (
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
                {filteredThirdRow.map((globalIndex) => (
                  <SelectableCard
                    key={globalIndex}
                    grid={allCards[globalIndex]}
                    cardId={globalIndex + 1}
                    selected={selectedCards.has(globalIndex)}
                    onClick={() => handleCardClick(globalIndex)}
                    status="free"
                  />
                ))}
              </Box>
            )}
          </Stack>
        </Box>
              )}
            </>
          );
        })()}
        </Stack>

        {/* Contenedor de información y botón de inscribirse */}
        <Box
          sx={{
            background: "rgba(31, 34, 51, 0.5)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            p: 2.5,
            mt: 4,
            mb: 3,
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
                Cartones Seleccionados:
              </Typography>
              <Typography variant="body2" sx={{ color: "#f5e6d3", fontWeight: 600 }}>
                {selectedCards.size}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
                Precio Total:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#f5e6d3", fontWeight: 700, fontSize: "16px" }}
                >
                  ${totalPrice.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
                  USD
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
                Saldo Disponible:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "#f5e6d3", fontWeight: 700, fontSize: "16px" }}
                >
                  ${availableBalance.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: "#f5e6d3", opacity: 0.8 }}>
                  USD
                </Typography>
              </Box>
            </Box>
            
            {/* Botón de Inscribirse dentro del contenedor */}
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <Button
                fullWidth
                onClick={handleEnroll}
                disabled={selectedCards.size === 0}
                sx={{
                  backfaceVisibility: "hidden",
                  position: "relative",
                  cursor: selectedCards.size > 0 ? "pointer" : "not-allowed",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "14px",
                  py: 1.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  textShadow: selectedCards.size > 0 ? "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)" : "0px -1px 0px rgba(0,0,0,0.3)",
                  border: selectedCards.size > 0 ? "1px solid #d4af37" : "1px solid rgba(212, 175, 55, 0.3)",
                  backgroundImage: selectedCards.size > 0 ? `
                    repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .12) 3.75%),
                    repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .04) 2.25%),
                    repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .18) 1.2%),
                    linear-gradient(180deg, #d4af37 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #f4d03f 53%, #ffd700 75%, #d4af37 100%)
                  ` : "none",
                  backgroundColor: selectedCards.size === 0 ? "rgba(212, 175, 55, 0.2)" : "transparent",
                  boxShadow: selectedCards.size > 0 ? `
                    inset 0px 1px 0px rgba(255,255,255,0.9),
                    inset 0px -1px 0px rgba(0,0,0,0.2),
                    0px 1px 3px rgba(0,0,0,0.4),
                    0px 4px 12px rgba(212, 175, 55, 0.4),
                    0px 0px 20px rgba(255, 215, 0, 0.2)
                  ` : "none",
                  transition: "all 0.2s ease",
                  "&:hover": selectedCards.size > 0 ? {
                    backgroundImage: `
                      repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .15) 3.75%),
                      repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .05) 2.25%),
                      repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .2) 1.2%),
                      linear-gradient(180deg, #f4d03f 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #ffed4e 53%, #ffd700 75%, #f4d03f 100%)
                    `,
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,1),
                      inset 0px -1px 0px rgba(0,0,0,0.2),
                      0px 2px 6px rgba(0,0,0,0.5),
                      0px 6px 20px rgba(212, 175, 55, 0.5),
                      0px 0px 30px rgba(255, 215, 0, 0.3)
                    `,
                    transform: "translateY(-1px)",
                  } : {},
                  "&:active": selectedCards.size > 0 ? {
                    transform: "translateY(2px)",
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,0.7),
                      inset 0px -1px 0px rgba(0,0,0,0.3),
                      0px 1px 2px rgba(0,0,0,0.4),
                      0px 2px 8px rgba(212, 175, 55, 0.3),
                      0px 0px 15px rgba(255, 215, 0, 0.15)
                    `,
                  } : {},
                  "&:disabled": {
                    opacity: 0.5,
                  },
                }}
              >
                Inscribirse
              </Button>
            </Box>
          </Stack>
        </Box>

        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
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
            {previewCardIndex !== null && (() => {
              const currentPosition = filteredIndices.indexOf(previewCardIndex);
              const hasPrevious = currentPosition > 0;
              return (
                <IconButton
                  onClick={handlePreviousCard}
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
              );
            })()}

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
                Cartón #{previewCardIndex !== null ? previewCardIndex + 1 : ""}
              </Typography>
            </Box>

            {/* Flecha derecha (siguiente) */}
            {previewCardIndex !== null && (() => {
              const currentPosition = filteredIndices.indexOf(previewCardIndex);
              const hasNext = currentPosition < filteredIndices.length - 1;
              return (
                <IconButton
                  onClick={handleNextCard}
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
              );
            })()}
          </Box>
          
          {previewCardIndex !== null && (() => {
            const isSelected = selectedCards.has(previewCardIndex);
            return (
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
                    backgroundColor: isSelected ? "#f5e6d3" : "#f5e6d3",
                    borderRadius: "16px",
                    p: 3,
                    border: isSelected 
                      ? "3px solid rgba(212, 175, 55, 0.8)" 
                      : "2px solid rgba(212, 175, 55, 0.2)",
                    position: "relative",
                    zIndex: 1,
                    // Textura de cartón viejo sutil
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
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: "16px",
                      background: isSelected
                        ? `
                          radial-gradient(ellipse 100px 80px at 20% 25%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
                          radial-gradient(ellipse 80px 60px at 80% 75%, rgba(212, 175, 55, 0.12) 0%, transparent 50%)
                        `
                        : `
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
                    position: "relative",
                    zIndex: 2,
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
                
                {/* Badge de seleccionado - Esquina superior izquierda */}
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
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0, gap: 2, justifyContent: "center", position: "relative", zIndex: 1 }}>
          {previewCardIndex !== null && selectedCards.has(previewCardIndex) ? (
            <>
              <Button
                onClick={handleRejectCard}
                sx={{
                  backfaceVisibility: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  flex: 1,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "14px",
                  py: 1.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
                  borderColor: "#7c7c7c",
                  borderWidth: "1px",
                  backgroundImage: `
                    repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 6%, hsla(0,0%,100%, .1) 7.5%),
                    repeating-linear-gradient(left, hsla(0,0%, 0%,0) 0%, hsla(0,0%, 0%,0) 4%, hsla(0,0%, 0%,.03) 4.5%),
                    repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 1.2%, hsla(0,0%,100%,.15) 2.2%),
                    linear-gradient(180deg, hsl(0,0%,78%) 0%, hsl(0,0%,90%) 47%, hsl(0,0%,78%) 53%, hsl(0,0%,70%) 100%)
                  `,
                  boxShadow: `
                    inset 0px 1px 0px rgba(255,255,255,1),
                    0px 1px 3px rgba(0,0,0,0.3),
                    0px 4px 12px rgba(0, 0, 0, 0.2)
                  `,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,1),
                      0px 2px 6px rgba(0,0,0,0.4),
                      0px 6px 16px rgba(0, 0, 0, 0.3)
                    `,
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(2px)",
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,0.8),
                      0px 1px 2px rgba(0,0,0,0.3),
                      0px 2px 8px rgba(0, 0, 0, 0.15)
                    `,
                  },
                }}
              >
                Cerrar
              </Button>
              <Button
                onClick={handleDeselectClick}
                sx={{
                  backfaceVisibility: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  flex: 1,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "14px",
                  py: 1.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  textShadow: "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 87, 34, 0.3)",
                  border: "1px solid #d32f2f",
                  backgroundImage: `
                    repeating-linear-gradient(left, rgba(255, 87, 34, 0) 0%, rgba(255, 87, 34, 0) 3%, rgba(255, 87, 34, .12) 3.75%),
                    repeating-linear-gradient(left, rgba(211, 47, 47, 0) 0%, rgba(211, 47, 47, 0) 2%, rgba(211, 47, 47, .04) 2.25%),
                    repeating-linear-gradient(left, rgba(255, 112, 67, 0) 0%, rgba(255, 112, 67, 0) .6%, rgba(255, 112, 67, .18) 1.2%),
                    linear-gradient(180deg, #d32f2f 0%, #f44336 25%, #ff5722 38%, #f44336 47%, #e53935 53%, #f44336 75%, #d32f2f 100%)
                  `,
                  boxShadow: `
                    inset 0px 1px 0px rgba(255,255,255,0.9),
                    inset 0px -1px 0px rgba(0,0,0,0.2),
                    0px 1px 3px rgba(0,0,0,0.4),
                    0px 4px 12px rgba(211, 47, 47, 0.4),
                    0px 0px 20px rgba(255, 87, 34, 0.2)
                  `,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundImage: `
                      repeating-linear-gradient(left, rgba(255, 87, 34, 0) 0%, rgba(255, 87, 34, 0) 3%, rgba(255, 87, 34, .15) 3.75%),
                      repeating-linear-gradient(left, rgba(211, 47, 47, 0) 0%, rgba(211, 47, 47, 0) 2%, rgba(211, 47, 47, .05) 2.25%),
                      repeating-linear-gradient(left, rgba(255, 112, 67, 0) 0%, rgba(255, 112, 67, 0) .6%, rgba(255, 112, 67, .2) 1.2%),
                      linear-gradient(180deg, #e53935 0%, #f44336 25%, #ff5722 38%, #f44336 47%, #ff7043 53%, #f44336 75%, #e53935 100%)
                    `,
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,1),
                      inset 0px -1px 0px rgba(0,0,0,0.2),
                      0px 2px 6px rgba(0,0,0,0.5),
                      0px 6px 20px rgba(211, 47, 47, 0.5),
                      0px 0px 30px rgba(255, 87, 34, 0.3)
                    `,
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(2px)",
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,0.7),
                      inset 0px -1px 0px rgba(0,0,0,0.3),
                      0px 1px 2px rgba(0,0,0,0.4),
                      0px 2px 8px rgba(211, 47, 47, 0.3),
                      0px 0px 15px rgba(255, 87, 34, 0.15)
                    `,
                  },
                }}
              >
                Deseleccionar
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleRejectCard}
                sx={{
                  backfaceVisibility: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  flex: 1,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "14px",
                  py: 1.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
                  borderColor: "#7c7c7c",
                  borderWidth: "1px",
                  backgroundImage: `
                    repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 6%, hsla(0,0%,100%, .1) 7.5%),
                    repeating-linear-gradient(left, hsla(0,0%, 0%,0) 0%, hsla(0,0%, 0%,0) 4%, hsla(0,0%, 0%,.03) 4.5%),
                    repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 1.2%, hsla(0,0%,100%,.15) 2.2%),
                    linear-gradient(180deg, hsl(0,0%,78%) 0%, hsl(0,0%,90%) 47%, hsl(0,0%,78%) 53%, hsl(0,0%,70%) 100%)
                  `,
                  boxShadow: `
                    inset 0px 1px 0px rgba(255,255,255,1),
                    0px 1px 3px rgba(0,0,0,0.3),
                    0px 4px 12px rgba(0, 0, 0, 0.2)
                  `,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,1),
                      0px 2px 6px rgba(0,0,0,0.4),
                      0px 6px 16px rgba(0, 0, 0, 0.3)
                    `,
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(2px)",
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,0.8),
                      0px 1px 2px rgba(0,0,0,0.3),
                      0px 2px 8px rgba(0, 0, 0, 0.15)
                    `,
                  },
                }}
              >
                Rechazar
              </Button>
              <Button
                onClick={handleAcceptCard}
                sx={{
                  backfaceVisibility: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  flex: 1,
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "14px",
                  py: 1.5,
                  borderRadius: "8px",
                  textTransform: "none",
                  textShadow: "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 215, 0, 0.3)",
                  border: "1px solid #d4af37",
                  backgroundImage: `
                    repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .12) 3.75%),
                    repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .04) 2.25%),
                    repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .18) 1.2%),
                    linear-gradient(180deg, #d4af37 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #f4d03f 53%, #ffd700 75%, #d4af37 100%)
                  `,
                  boxShadow: `
                    inset 0px 1px 0px rgba(255,255,255,0.9),
                    inset 0px -1px 0px rgba(0,0,0,0.2),
                    0px 1px 3px rgba(0,0,0,0.4),
                    0px 4px 12px rgba(212, 175, 55, 0.4),
                    0px 0px 20px rgba(255, 215, 0, 0.2)
                  `,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundImage: `
                      repeating-linear-gradient(left, rgba(255, 215, 0, 0) 0%, rgba(255, 215, 0, 0) 3%, rgba(255, 215, 0, .15) 3.75%),
                      repeating-linear-gradient(left, rgba(212, 175, 55, 0) 0%, rgba(212, 175, 55, 0) 2%, rgba(212, 175, 55, .05) 2.25%),
                      repeating-linear-gradient(left, rgba(255, 223, 0, 0) 0%, rgba(255, 223, 0, 0) .6%, rgba(255, 223, 0, .2) 1.2%),
                      linear-gradient(180deg, #f4d03f 0%, #ffd700 25%, #ffed4e 38%, #ffd700 47%, #ffed4e 53%, #ffd700 75%, #f4d03f 100%)
                    `,
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,1),
                      inset 0px -1px 0px rgba(0,0,0,0.2),
                      0px 2px 6px rgba(0,0,0,0.5),
                      0px 6px 20px rgba(212, 175, 55, 0.5),
                      0px 0px 30px rgba(255, 215, 0, 0.3)
                    `,
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(2px)",
                    boxShadow: `
                      inset 0px 1px 0px rgba(255,255,255,0.7),
                      inset 0px -1px 0px rgba(0,0,0,0.3),
                      0px 1px 2px rgba(0,0,0,0.4),
                      0px 2px 8px rgba(212, 175, 55, 0.3),
                      0px 0px 15px rgba(255, 215, 0, 0.15)
                    `,
                  },
                }}
              >
                Aceptar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación para deseleccionar */}
      <Dialog
        open={confirmDeselectModalOpen}
        onClose={handleCancelDeselect}
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
          <Typography
            variant="h5"
            sx={{
              textAlign: "center",
              color: "#f5e6d3",
              fontWeight: 700,
              mb: 2,
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            ¿Deseas deseleccionar este cartón?
          </Typography>
          
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: "12px",
              backgroundColor: "rgba(255, 152, 0, 0.15)",
              border: "1px solid rgba(255, 152, 0, 0.3)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#f5e6d3",
                textAlign: "center",
                opacity: 0.9,
                lineHeight: 1.6,
                fontSize: "14px",
              }}
            >
              Si otra persona lo selecciona, ya no podrás elegirlo nuevamente.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0, gap: 2, justifyContent: "center", position: "relative", zIndex: 1 }}>
          <Button
            onClick={handleCancelDeselect}
            sx={{
              backfaceVisibility: "hidden",
              position: "relative",
              cursor: "pointer",
              display: "inline-block",
              whiteSpace: "nowrap",
              flex: 1,
              color: "#fff",
              fontWeight: 900,
              fontSize: "14px",
              py: 1.5,
              borderRadius: "8px",
              textTransform: "none",
              textShadow: "0px -1px 0px rgba(0,0,0,0.4)",
              borderColor: "#7c7c7c",
              borderWidth: "1px",
              backgroundImage: `
                repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 6%, hsla(0,0%,100%, .1) 7.5%),
                repeating-linear-gradient(left, hsla(0,0%, 0%,0) 0%, hsla(0,0%, 0%,0) 4%, hsla(0,0%, 0%,.03) 4.5%),
                repeating-linear-gradient(left, hsla(0,0%,100%,0) 0%, hsla(0,0%,100%,0) 1.2%, hsla(0,0%,100%,.15) 2.2%),
                linear-gradient(180deg, hsl(0,0%,78%) 0%, hsl(0,0%,90%) 47%, hsl(0,0%,78%) 53%, hsl(0,0%,70%) 100%)
              `,
              boxShadow: `
                inset 0px 1px 0px rgba(255,255,255,1),
                0px 1px 3px rgba(0,0,0,0.3),
                0px 4px 12px rgba(0, 0, 0, 0.2)
              `,
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,1),
                  0px 2px 6px rgba(0,0,0,0.4),
                  0px 6px 16px rgba(0, 0, 0, 0.3)
                `,
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(2px)",
                boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,0.8),
                  0px 1px 2px rgba(0,0,0,0.3),
                  0px 2px 8px rgba(0, 0, 0, 0.15)
                `,
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDeselect}
            sx={{
              backfaceVisibility: "hidden",
              position: "relative",
              cursor: "pointer",
              display: "inline-block",
              whiteSpace: "nowrap",
              flex: 1,
              color: "#fff",
              fontWeight: 900,
              fontSize: "14px",
              py: 1.5,
              borderRadius: "8px",
              textTransform: "none",
              textShadow: "0px -1px 0px rgba(0,0,0,0.5), 0px 1px 2px rgba(255, 87, 34, 0.3)",
              border: "1px solid #d32f2f",
              backgroundImage: `
                repeating-linear-gradient(left, rgba(255, 87, 34, 0) 0%, rgba(255, 87, 34, 0) 3%, rgba(255, 87, 34, .12) 3.75%),
                repeating-linear-gradient(left, rgba(211, 47, 47, 0) 0%, rgba(211, 47, 47, 0) 2%, rgba(211, 47, 47, .04) 2.25%),
                repeating-linear-gradient(left, rgba(255, 112, 67, 0) 0%, rgba(255, 112, 67, 0) .6%, rgba(255, 112, 67, .18) 1.2%),
                linear-gradient(180deg, #d32f2f 0%, #f44336 25%, #ff5722 38%, #f44336 47%, #e53935 53%, #f44336 75%, #d32f2f 100%)
              `,
              boxShadow: `
                inset 0px 1px 0px rgba(255,255,255,0.9),
                inset 0px -1px 0px rgba(0,0,0,0.2),
                0px 1px 3px rgba(0,0,0,0.4),
                0px 4px 12px rgba(211, 47, 47, 0.4),
                0px 0px 20px rgba(255, 87, 34, 0.2)
              `,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundImage: `
                  repeating-linear-gradient(left, rgba(255, 87, 34, 0) 0%, rgba(255, 87, 34, 0) 3%, rgba(255, 87, 34, .15) 3.75%),
                  repeating-linear-gradient(left, rgba(211, 47, 47, 0) 0%, rgba(211, 47, 47, 0) 2%, rgba(211, 47, 47, .05) 2.25%),
                  repeating-linear-gradient(left, rgba(255, 112, 67, 0) 0%, rgba(255, 112, 67, 0) .6%, rgba(255, 112, 67, .2) 1.2%),
                  linear-gradient(180deg, #e53935 0%, #f44336 25%, #ff5722 38%, #f44336 47%, #ff7043 53%, #f44336 75%, #e53935 100%)
                `,
                boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,1),
                  inset 0px -1px 0px rgba(0,0,0,0.2),
                  0px 2px 6px rgba(0,0,0,0.5),
                  0px 6px 20px rgba(211, 47, 47, 0.5),
                  0px 0px 30px rgba(255, 87, 34, 0.3)
                `,
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(2px)",
                boxShadow: `
                  inset 0px 1px 0px rgba(255,255,255,0.7),
                  inset 0px -1px 0px rgba(0,0,0,0.3),
                  0px 1px 2px rgba(0,0,0,0.4),
                  0px 2px 8px rgba(211, 47, 47, 0.3),
                  0px 0px 15px rgba(255, 87, 34, 0.15)
                `,
              },
            }}
          >
            Deseleccionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
