// src/Pages/Rooms.tsx
import * as React from "react";
import { Box, Container, Typography, CircularProgress, Alert, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BingoLogo from "../Componets/BingoLogo";
import RoomCard from "../Componets/RoomCard";
import { getRooms, type Room } from "../Services/rooms.service";
import BackgroundStars from "../Componets/BackgroundStars";

export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentRoomIndex, setCurrentRoomIndex] = React.useState(0);

  React.useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRooms();
        setRooms(data);
        setCurrentRoomIndex(0); // Resetear al índice inicial cuando se cargan las salas
      } catch (err) {
        setError("Error al cargar las salas. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoin = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handlePreviousRoom = () => {
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex(currentRoomIndex - 1);
    }
  };

  const handleNextRoom = () => {
    if (currentRoomIndex < rooms.length - 1) {
      setCurrentRoomIndex(currentRoomIndex + 1);
    }
  };

  const hasPrevious = currentRoomIndex > 0;
  const hasNext = currentRoomIndex < rooms.length - 1;
  const currentRoom = rooms[currentRoomIndex];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
        color: "#f5e6d3",
        paddingBottom: "80px", // Space for tabbar
        position: "relative",
      }}
    >
      <BackgroundStars />

      <Container maxWidth="sm" sx={{ py: 4, position: "relative", zIndex: 1 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 4, position: "relative" }}>
          {/* Logo */}
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <BingoLogo size={150} />
          </Box>

          {/* Título con flechas de navegación */}
          {!loading && !error && rooms.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                mb: 2,
              }}
            >
              {/* Flecha izquierda (anterior) */}
              <IconButton
                onClick={handlePreviousRoom}
                disabled={!hasPrevious}
                sx={{
                  color: hasPrevious ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                  backgroundColor: hasPrevious
                    ? "rgba(212, 175, 55, 0.1)"
                    : "transparent",
                  border: hasPrevious
                    ? "2px solid rgba(212, 175, 55, 0.4)"
                    : "2px solid rgba(212, 175, 55, 0.1)",
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

              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "24px", sm: "28px" },
                  fontWeight: 700,
                  color: "#f5e6d3",
                  fontFamily: "'Montserrat', sans-serif",
                  minWidth: "200px",
                }}
              >
                Salas Disponibles
              </Typography>

              {/* Flecha derecha (siguiente) */}
              <IconButton
                onClick={handleNextRoom}
                disabled={!hasNext}
                sx={{
                  color: hasNext ? "#d4af37" : "rgba(212, 175, 55, 0.3)",
                  backgroundColor: hasNext
                    ? "rgba(212, 175, 55, 0.1)"
                    : "transparent",
                  border: hasNext
                    ? "2px solid rgba(212, 175, 55, 0.4)"
                    : "2px solid rgba(212, 175, 55, 0.1)",
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
            </Box>
          )}

          {/* Título sin flechas cuando no hay salas o está cargando */}
          {(loading || error || rooms.length === 0) && (
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: "24px", sm: "28px" },
                fontWeight: 700,
                color: "#f5e6d3",
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              Salas Disponibles
            </Typography>
          )}
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#d4af37" }} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ px: 1, mb: 2 }}>
            <Alert 
              severity="error" 
              sx={{ 
                backgroundColor: "rgba(201, 168, 90, 0.2)", 
                color: "#c9a85a", 
                border: "1px solid rgba(201, 168, 90, 0.4)",
                "& .MuiAlert-message": {
                  whiteSpace: "pre-line"
                }
              }}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Rooms List */}
        {!loading && !error && (
          <Box>
            {rooms.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: "#f5e6d3", opacity: 0.7 }}>
                  No hay salas disponibles en este momento
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Sala actual */}
                {currentRoom && (
                  <RoomCard
                    key={currentRoom.id}
                    title={currentRoom.title}
                    price={currentRoom.price}
                    estimatedPrize={currentRoom.estimatedPrize}
                    currency={currentRoom.currency}
                    status={currentRoom.status}
                    rounds={currentRoom.rounds}
                    jackpot={currentRoom.jackpot}
                    players={currentRoom.players}
                    onJoin={() => handleJoin(currentRoom.id)}
                  />
                )}
                
                {/* Indicador de posición */}
                {rooms.length > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    {rooms.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: index === currentRoomIndex ? "24px" : "8px",
                          height: "8px",
                          borderRadius: index === currentRoomIndex ? "4px" : "50%",
                          backgroundColor:
                            index === currentRoomIndex
                              ? "#d4af37"
                              : "rgba(212, 175, 55, 0.3)",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

