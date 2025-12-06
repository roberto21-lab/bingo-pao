/**
 * ISSUE-5: Componente para mostrar notificaciones de bingo en tiempo real
 * Muestra un toast cuando alguien canta bingo (pendiente, confirmado o rechazado)
 */

import { Box, Typography, Stack, Chip, keyframes } from "@mui/material";
import * as React from "react";

// Animación de pulso para notificaciones importantes
const pulseAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
  }
`;

export type BingoNotificationType = "pending" | "confirmed" | "rejected";

export interface BingoNotificationToastProps {
  type: BingoNotificationType;
  playerName: string;
  cardCode?: string;
  message?: string;
  prizeAmount?: string;
  pattern?: string;
  onClose: () => void;
  autoHideDuration?: number;
}

const notificationConfig = {
  pending: {
    color: "#ffa726", // Naranja
    backgroundColor: "rgba(255, 167, 38, 0.1)",
    borderColor: "rgba(255, 167, 38, 0.4)",
    label: "Verificando...",
    icon: "⏳",
  },
  confirmed: {
    color: "#66bb6a", // Verde
    backgroundColor: "rgba(102, 187, 106, 0.1)",
    borderColor: "rgba(102, 187, 106, 0.4)",
    label: "¡BINGO!",
    icon: "🎉",
  },
  rejected: {
    color: "#ef5350", // Rojo
    backgroundColor: "rgba(239, 83, 80, 0.1)",
    borderColor: "rgba(239, 83, 80, 0.4)",
    label: "Inválido",
    icon: "❌",
  },
};

export default function BingoNotificationToast({
  type,
  playerName,
  cardCode,
  message,
  prizeAmount,
  pattern,
  onClose,
  autoHideDuration = 5000,
}: BingoNotificationToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isExiting, setIsExiting] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(true);

  const config = notificationConfig[type];

  React.useEffect(() => {
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 50);

    // Auto-hide después del tiempo especificado
    const duration = type === "confirmed" ? autoHideDuration * 1.5 : autoHideDuration;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 400);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [onClose, autoHideDuration, type]);

  if (!isVisible) return null;

  const defaultMessages = {
    pending: `${playerName} está cantando bingo...`,
    confirmed: `¡${playerName} ha ganado!`,
    rejected: `Bingo inválido de ${playerName}`,
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 70,
        left: "50%",
        transform: isEntering
          ? "translateX(-50%) translateY(-20px) scale(0.9)"
          : isExiting
          ? "translateX(-50%) translateY(-20px) scale(0.95)"
          : "translateX(-50%) translateY(0) scale(1)",
        zIndex: 10001,
        minWidth: "320px",
        width: "calc(100% - 40px)",
        maxWidth: { xs: "calc(100% - 40px)", sm: "450px" },
        backgroundColor: "rgba(26, 29, 46, 0.95)",
        border: `2px solid ${config.borderColor}`,
        borderRadius: "16px",
        padding: 2.5,
        boxShadow: `0 12px 40px rgba(0, 0, 0, 0.7), 0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isEntering ? 0 : isExiting ? 0 : 1,
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        overflow: "hidden",
        pointerEvents: "auto",
        animation: type === "confirmed" ? `${pulseAnimation} 1.5s infinite` : "none",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${config.backgroundColor} 0%, rgba(0, 0, 0, 0.1) 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        },
      }}
    >
      <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
        {/* Header con icono y tipo */}
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: "1.5rem" }}>{config.icon}</Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: config.color,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {type === "pending" ? "Verificando Bingo" : type === "confirmed" ? "¡BINGO!" : "Bingo Rechazado"}
            </Typography>
          </Stack>
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.backgroundColor,
              color: config.color,
              border: `1px solid ${config.borderColor}`,
              fontWeight: 600,
            }}
          />
        </Stack>

        {/* Nombre del jugador */}
        <Typography
          variant="body1"
          sx={{
            color: "rgba(255, 255, 255, 0.95)",
            fontWeight: 500,
          }}
        >
          {message || defaultMessages[type]}
        </Typography>

        {/* Detalles adicionales */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {cardCode && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              Cartón: {cardCode}
            </Typography>
          )}
          {pattern && type === "confirmed" && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "4px 8px",
                borderRadius: "6px",
                textTransform: "capitalize",
              }}
            >
              Patrón: {pattern}
            </Typography>
          )}
          {prizeAmount && type === "confirmed" && (
            <Typography
              variant="caption"
              sx={{
                color: config.color,
                backgroundColor: config.backgroundColor,
                padding: "4px 8px",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              Premio: ${prizeAmount}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
