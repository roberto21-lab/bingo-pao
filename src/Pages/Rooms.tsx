// src/Pages/Rooms.tsx
import * as React from "react";
import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BingoLogo from "../Componets/BingoLogo";
import RoomCard from "../Componets/RoomCard";
import SectionHeader from "../Componets/SectionHeader";
import { getRooms, type Room } from "../Services/rooms.service";
import BackgroundStars from "../Componets/BackgroundStars";
import { useAuth } from "../hooks/useAuth";

export default function Rooms() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
        console.log("Salas obtenidas:", data);
        setRooms(data);
        setCurrentRoomIndex(0); // Resetear al índice inicial cuando se cargan las salas
      } catch (err: unknown) {
        console.error("Error al obtener salas:", err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message 
          || "Error al cargar las salas. Por favor, intenta nuevamente.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoin = (roomId: string) => {
    // Si no está autenticado, redirigir al login con la sala de destino
    if (!isAuthenticated) {
      navigate(`/login?redirect=/room/${roomId}`);
      return;
    }
    
    // Si está autenticado, ir directamente a la selección de cartones
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
          <SectionHeader
            title="Salas Disponibles"
            onPrevious={handlePreviousRoom}
            onNext={handleNextRoom}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            showNavigation={!loading && !error && rooms.length > 0}
          />
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
          <Box sx={{ marginTop: 0 }}>
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
                    scheduledAt={currentRoom.scheduledAt}
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

