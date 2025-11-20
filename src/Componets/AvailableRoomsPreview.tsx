import { Box, Card, CardContent, Typography, Stack, Chip } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { Room } from "../Services/rooms.service";

interface AvailableRoomsPreviewProps {
  rooms: Room[];
}

// Componente para el contador regresivo de una sala
function RoomCountdown({ room }: { room: Room }) {
  const [remaining, setRemaining] = React.useState<number>(0);

  React.useEffect(() => {
    if (room.status === "in_progress") {
      return;
    }

    if (!room.players) {
      return;
    }

    // Parsear jugadores (formato: "X/Y" o solo número)
    const playersMatch = room.players.match(/(\d+)\/(\d+)/);
    if (playersMatch) {
      const current = parseInt(playersMatch[1]);
      const needed = parseInt(playersMatch[2]);
      const remainingPlayers = needed - current;

      if (remainingPlayers <= 0) {
        setRemaining(0);
        return;
      }

      // Estimar: cada jugador tarda ~30 segundos en promedio
      const estimatedSeconds = remainingPlayers * 30;
      setRemaining(estimatedSeconds);
    }
  }, [room.players, room.status]);

  React.useEffect(() => {
    if (remaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  if (room.status === "in_progress") {
    return null;
  }

  if (remaining <= 0) {
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.5,
          borderRadius: "8px",
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          border: "1px solid rgba(76, 175, 80, 0.3)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#4caf50",
            fontWeight: 600,
          }}
        >
          Iniciando pronto...
        </Typography>
      </Box>
    );
  }

  const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: "8px",
        backgroundColor: "rgba(255, 152, 0, 0.15)",
        border: "1px solid rgba(255, 152, 0, 0.3)",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#ff9800",
          fontWeight: 600,
        }}
      >
        ⏱️ Inicia en: {timeText}
      </Typography>
    </Box>
  );
}

export default function AvailableRoomsPreview({ rooms }: AvailableRoomsPreviewProps) {
  const navigate = useNavigate();

  const handleRoomClick = (roomId: string) => {
    navigate(`/game/${roomId}`);
  };

  if (rooms.length === 0) {
    return (
      <Card
        sx={{
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          mb: 3,
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body1" sx={{ color: "#ffffff", opacity: 0.7 }}>
            No hay salas disponibles en este momento
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{
          color: "#ffffff",
          fontWeight: 600,
          mb: 2,
          textAlign: "center",
        }}
      >
        Salas Disponibles 🎮
      </Typography>

      <Stack spacing={2}>
        {rooms.map((room) => {
          const isWaiting = room.status === "waiting";

          return (
            <Card
              key={room.id}
              onClick={() => handleRoomClick(room.id)}
              sx={{
                borderRadius: "12px",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                backgroundColor: "rgba(26, 29, 46, 0.6)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  border: "1px solid rgba(212, 175, 55, 0.6)",
                  backgroundColor: "rgba(26, 29, 46, 0.8)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#ffffff",
                        fontWeight: 600,
                        mb: 1,
                        fontSize: "18px",
                      }}
                    >
                      {room.title}
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#ffffff",
                            opacity: 0.7,
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Precio por cartón
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#d4af37",
                            fontWeight: 600,
                          }}
                        >
                          {room.currency} {room.price.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#ffffff",
                            opacity: 0.7,
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Premio estimado
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#4caf50",
                            fontWeight: 600,
                          }}
                        >
                          {room.currency} {room.estimatedPrize.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </Box>
                    </Stack>

                    {isWaiting && <RoomCountdown room={room} />}

                    {room.status === "in_progress" && (
                      <Chip
                        label="En progreso"
                        size="small"
                        sx={{
                          backgroundColor: "rgba(76, 175, 80, 0.2)",
                          color: "#4caf50",
                          border: "1px solid rgba(76, 175, 80, 0.4)",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>

                  {room.players && (
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#ffffff",
                          opacity: 0.7,
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        Jugadores
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#ffffff",
                          fontWeight: 600,
                        }}
                      >
                        {room.players}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
