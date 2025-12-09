// src/Pages/Rooms.tsx
import * as React from "react";
import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BingoLogo from "../Components/BingoLogo";
import RoomCard from "../Components/RoomCard";
import SectionHeader from "../Components/SectionHeader";
import { getRooms, type Room } from "../Services/rooms.service";
import BackgroundStars from "../Components/BackgroundStars";
import { useAuth } from "../hooks/useAuth";
import { onRoomStatusUpdated, onRoomsReordered } from "../Services/socket.service";

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
  
  // Escuchar actualizaciones de status de salas en tiempo real
  React.useEffect(() => {
    const unsubscribeStatusUpdated = onRoomStatusUpdated((data) => {
      console.log(`[Rooms] Status actualizado para sala ${data.room_name}: ${data.status}`);
      // Refrescar salas cuando se actualiza el status
      const fetchRooms = async () => {
        try {
          const data = await getRooms();
          setRooms(data);
        } catch (err: unknown) {
          console.error("Error al refrescar salas:", err);
        }
      };
      fetchRooms();
    });

    const unsubscribeRoomsReordered = onRoomsReordered((data) => {
      console.log(`[Rooms] Salas reordenadas:`, data.rooms);
      // Refrescar salas cuando se reordenen
      const fetchRooms = async () => {
        try {
          const data = await getRooms();
          setRooms(data);
        } catch (err: unknown) {
          console.error("Error al refrescar salas:", err);
        }
      };
      fetchRooms();
    });

    return () => {
      unsubscribeStatusUpdated();
      unsubscribeRoomsReordered();
    };
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

  // Determinar la etiqueta de cola para la sala actual
  const getQueueLabel = (index: number, total: number): { label: string; color: string; icon: string } => {
    if (total === 1) {
      return { label: "Única sala disponible", color: "#d4af37", icon: "🎯" };
    }
    if (index === 0) {
      return { label: "Inmediata", color: "#4caf50", icon: "🚀" };
    }
    if (index === 1) {
      return { label: "Próxima", color: "#ff9800", icon: "⏳" };
    }
    if (index === total - 1) {
      return { label: "Última", color: "#9e9e9e", icon: "🏁" };
    }
    return { label: `Sala ${index + 1} de ${total}`, color: "#2196f3", icon: "📋" };
  };

  const queueInfo = rooms.length > 0 ? getQueueLabel(currentRoomIndex, rooms.length) : null;

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

      <Container maxWidth="sm" sx={{ pt: "80px", pb: 4, position: "relative", zIndex: 1 }}>
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
                {/* Indicador de posición en la cola - Sutil pero claro */}
                {queueInfo && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      mb: 1,
                      mt: -2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 2,
                        py: 0.8,
                        borderRadius: "20px",
                        backgroundColor: `${queueInfo.color}15`,
                        border: `1.5px solid ${queueInfo.color}50`,
                        boxShadow: `0 2px 8px ${queueInfo.color}20`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "14px",
                          lineHeight: 1,
                        }}
                      >
                        {queueInfo.icon}
                      </Typography>
                      <Typography
                        sx={{
                          color: queueInfo.color,
                          fontSize: "12px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                        }}
                      >
                        {queueInfo.label}
                      </Typography>
                    </Box>
                  </Box>
                )}

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
                    orderIndex={currentRoom.orderIndex}
                    minPlayers={currentRoom.minPlayers}
                    enrolledUsersCount={currentRoom.enrolledUsersCount}
                    onJoin={() => handleJoin(currentRoom.id)}
                    queuePosition={
                      rooms.length === 1 
                        ? "immediate" 
                        : currentRoomIndex === 0 
                        ? "immediate" 
                        : currentRoomIndex === 1 
                        ? "next" 
                        : currentRoomIndex === rooms.length - 1 
                        ? "last" 
                        : "middle"
                    }
                    totalRooms={rooms.length}
                />
                )}
                
                {/* Indicador de posición con etiquetas */}
                {rooms.length > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1.5,
                      mt: 2,
                    }}
                  >
                    {/* Puntos indicadores */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {rooms.map((_, index) => {
                        const isFirst = index === 0;
                        const isLast = index === rooms.length - 1;
                        const isCurrent = index === currentRoomIndex;
                        
                        // Color según posición
                        const dotColor = isFirst 
                          ? "#4caf50" 
                          : isLast 
                          ? "#9e9e9e" 
                          : "#ff9800";
                        
                        return (
                      <Box
                        key={index}
                            onClick={() => setCurrentRoomIndex(index)}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            <Box
                        sx={{
                                width: isCurrent ? "28px" : "10px",
                                height: "10px",
                                borderRadius: isCurrent ? "5px" : "50%",
                                backgroundColor: isCurrent 
                                  ? dotColor 
                                  : `${dotColor}50`,
                                border: `2px solid ${dotColor}`,
                                boxShadow: isCurrent 
                                  ? `0 0 8px ${dotColor}80` 
                                  : "none",
                          transition: "all 0.3s ease",
                        }}
                      />
                          </Box>
                        );
                      })}
                    </Box>
                    
                    {/* Leyenda de colores */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box
                          sx={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#4caf50",
                          }}
                        />
                        <Typography
                          sx={{
                            color: "#4caf50",
                            fontSize: "10px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Inmediata
                        </Typography>
                      </Box>
                      {rooms.length > 2 && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Box
                            sx={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#ff9800",
                            }}
                          />
                          <Typography
                            sx={{
                              color: "#ff9800",
                              fontSize: "10px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Próximas
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box
                          sx={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#9e9e9e",
                          }}
                        />
                        <Typography
                          sx={{
                            color: "#9e9e9e",
                            fontSize: "10px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Última
                        </Typography>
                      </Box>
                    </Box>
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

