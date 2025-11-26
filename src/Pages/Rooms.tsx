// src/Pages/Rooms.tsx
import * as React from "react";
import { Box, Container, Typography, CircularProgress, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BingoLogo from "../Componets/BingoLogo";
import RoomCard from "../Componets/RoomCard";
import SectionHeader from "../Componets/SectionHeader";
import { getRooms, type EnrollmentQueue } from "../Services/rooms.service";
import BackgroundStars from "../Componets/BackgroundStars";
import { useAuth } from "../hooks/useAuth";
import { onRoomStatusUpdated } from "../Services/socket.service";

export default function Rooms() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [enrollmentQueues, setEnrollmentQueues] = React.useState<EnrollmentQueue[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentRoomIndex, setCurrentRoomIndex] = React.useState(0);

  React.useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRooms();
        console.log("Listas de inscripciones obtenidas:", data);
        setEnrollmentQueues(data);
        setCurrentRoomIndex(0); // Resetear al índice inicial cuando se cargan las listas
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
          setEnrollmentQueues(data);
        } catch (err: unknown) {
          console.error("Error al refrescar salas:", err);
        }
      };
      fetchRooms();
    });

    return () => {
      unsubscribeStatusUpdated();
    };
  }, []);

  const handleJoin = (enrollmentQueueId: string, roomId?: string | null) => {
    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      if (roomId) {
      navigate(`/login?redirect=/room/${roomId}`);
      } else {
        navigate(`/login?redirect=/enroll/${enrollmentQueueId}`);
      }
      return;
    }
    
    // Si la lista tiene una partida en progreso, ir a la partida
    if (roomId) {
    navigate(`/room/${roomId}`);
    } else {
      // Si no tiene partida, ir a la selección de cartones para inscribirse en la lista
      // Usar query param para pasar el enrollmentQueueId
      navigate(`/room/enroll?queueId=${enrollmentQueueId}`);
    }
  };

  const handlePreviousRoom = () => {
    if (currentRoomIndex > 0) {
      setCurrentRoomIndex(currentRoomIndex - 1);
    }
  };

  const handleNextRoom = () => {
    if (currentRoomIndex < enrollmentQueues.length - 1) {
      setCurrentRoomIndex(currentRoomIndex + 1);
    }
  };

  const hasPrevious = currentRoomIndex > 0;
  const hasNext = currentRoomIndex < enrollmentQueues.length - 1;
  const currentQueue = enrollmentQueues[currentRoomIndex];

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
            title="Listas de Inscripciones"
            onPrevious={handlePreviousRoom}
            onNext={handleNextRoom}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            showNavigation={!loading && !error && enrollmentQueues.length > 0}
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

        {/* Enrollment Queues List */}
        {!loading && !error && (
          <Box sx={{ marginTop: 0 }}>
            {enrollmentQueues.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: "#f5e6d3", opacity: 0.7 }}>
                  No hay listas de inscripciones disponibles en este momento
                </Typography>
              </Box>
            ) : (
              <Box>
                {/* Lista actual */}
                {currentQueue && (
                <RoomCard
                    key={currentQueue.id}
                    title={
                      currentQueue.room
                        ? currentQueue.room.title
                        : `Inscripciones #${currentQueue.queueNumber}`
                    }
                    price={currentQueue.room?.price || 50}
                    estimatedPrize={currentQueue.totalPrize}
                    currency={currentQueue.room?.currency || "Bs"}
                    status={
                      currentQueue.isPlaying
                        ? "in_progress"
                        : currentQueue.isActive
                        ? "preparing"
                        : "waiting"
                    }
                    rounds={currentQueue.room?.rounds || 3}
                    jackpot={currentQueue.totalPrize}
                    players={currentQueue.room?.players}
                    scheduledAt={currentQueue.scheduledStartTime}
                    queueNumber={currentQueue.queueNumber}
                    showPrizeInsteadOfPlayers={true}
                    onJoin={() =>
                      handleJoin(currentQueue.id, currentQueue.room?.id)
                    }
                />
                )}
                
                {/* Indicador de posición */}
                {enrollmentQueues.length > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    {enrollmentQueues.map((_, index) => (
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

