/**
 * ISSUE-6: Componente para mostrar notificación cuando la sala inicia
 * Muestra un banner/modal llamativo cuando la partida comienza
 */

import { Box, Typography, Stack, keyframes } from "@mui/material";
import * as React from "react";

// Animación de entrada
const slideIn = keyframes`
  0% {
    transform: translateX(-50%) translateY(-100%) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
`;

// Animación de salida
const slideOut = keyframes`
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-100%) scale(0.8);
    opacity: 0;
  }
`;

// Animación de pulso para el borde
const borderPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7), 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(212, 175, 55, 0), 0 12px 40px rgba(0, 0, 0, 0.5);
  }
`;

// Animación del icono
const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

export interface RoomStartedNotificationProps {
  roomName?: string;
  onClose: () => void;
  autoHideDuration?: number;
}

export default function RoomStartedNotification({
  roomName,
  onClose,
  autoHideDuration = 5000,
}: RoomStartedNotificationProps) {
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 400);
    }, autoHideDuration);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [onClose, autoHideDuration]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10002,
        minWidth: "320px",
        width: "calc(100% - 40px)",
        maxWidth: { xs: "calc(100% - 40px)", sm: "500px" },
        backgroundColor: "rgba(26, 29, 46, 0.98)",
        border: "2px solid rgba(212, 175, 55, 0.6)",
        borderRadius: "20px",
        padding: 3,
        backdropFilter: "blur(15px) saturate(180%)",
        WebkitBackdropFilter: "blur(15px) saturate(180%)",
        overflow: "hidden",
        pointerEvents: "auto",
        animation: isExiting 
          ? `${slideOut} 0.4s ease-in forwards`
          : `${slideIn} 0.5s ease-out, ${borderPulse} 2s ease-in-out infinite`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 50%, rgba(26, 29, 46, 0.3) 100%)",
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
        {/* Icono animado */}
        <Box
          sx={{
            animation: `${bounce} 1s ease-in-out infinite`,
            fontSize: "3rem",
            lineHeight: 1,
          }}
        >
          🎮
        </Box>

        {/* Título principal */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#d4af37",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "2px",
            textShadow: "0 2px 10px rgba(212, 175, 55, 0.3)",
          }}
        >
          ¡La partida ha comenzado!
        </Typography>

        {/* Nombre de la sala */}
        {roomName && (
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {roomName}
          </Typography>
        )}

        {/* Mensaje secundario */}
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            textAlign: "center",
          }}
        >
          ¡Prepárate para jugar! Los números comenzarán a llamarse pronto.
        </Typography>

        {/* Indicador visual */}
        <Box
          sx={{
            width: "60%",
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "rgba(212, 175, 55, 0.3)",
            overflow: "hidden",
            mt: 1,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              backgroundColor: "#d4af37",
              animation: `shrink ${autoHideDuration}ms linear`,
              "@keyframes shrink": {
                "0%": { transform: "translateX(0)" },
                "100%": { transform: "translateX(-100%)" },
              },
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
