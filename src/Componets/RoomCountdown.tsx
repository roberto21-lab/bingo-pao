import { Box, Typography } from "@mui/material";
import * as React from "react";
import type { Room } from "../Services/rooms.service";

interface RoomCountdownProps {
  room: Room;
}

/**
 * Componente que muestra el tiempo restante hasta que inicie una sala
 * Basado en scheduledAt
 */
export default function RoomCountdown({ room }: RoomCountdownProps) {
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Si la sala ya está en progreso o no tiene scheduled_at, no mostrar countdown
    if (room.status === "in_progress" || !room.scheduledAt) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const scheduledAt = room.scheduledAt instanceof Date 
        ? room.scheduledAt 
        : new Date(room.scheduledAt);
      
      const diff = scheduledAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Ya pasó la hora programada
        setTimeRemaining(0);
        return;
      }
      
      // Convertir a segundos
      setTimeRemaining(Math.floor(diff / 1000));
    };

    // Calcular inmediatamente
    calculateTimeRemaining();

    // Actualizar cada segundo
    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [room.scheduledAt, room.status]);

  // No mostrar si no hay tiempo restante o la sala ya inició
  if (timeRemaining === null || room.status === "in_progress") {
    return null;
  }

  // Si el tiempo ya pasó, mostrar "Iniciando pronto..."
  if (timeRemaining <= 0) {
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
          mt: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#4caf50",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          Iniciando pronto...
        </Typography>
      </Box>
    );
  }

  // Calcular horas, minutos y segundos
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  // Formatear el tiempo
  let timeText = "";
  if (hours > 0) {
    timeText = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    timeText = `${minutes}m ${seconds}s`;
  } else {
    timeText = `${seconds}s`;
  }

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
        mt: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "#ff9800",
          fontWeight: 600,
          fontSize: "12px",
        }}
      >
        ⏱️ Inicia en: {timeText}
      </Typography>
    </Box>
  );
}

