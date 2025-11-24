import { Box, Card, CardContent, Typography, Stack, Chip } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Room } from "../Services/rooms.service";

interface AvailableRoomsPreviewProps {
  rooms: Room[];
}

import RoomCountdown from "./RoomCountdown";

export default function AvailableRoomsPreview({ rooms }: AvailableRoomsPreviewProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleRoomClick = (roomId: string) => {
    // Si no está autenticado, redirigir al login con la sala de destino
    if (!isAuthenticated) {
      navigate(`/login?redirect=/room/${roomId}`);
      return;
    }
    
    // Si está autenticado, ir directamente a la selección de cartones
    navigate(`/room/${roomId}`);
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

                    {isWaiting && room.scheduledAt && <RoomCountdown room={room} />}

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
