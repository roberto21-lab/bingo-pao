import * as React from "react";
import { Box, Card, CardContent, Typography, Stack, Divider } from "@mui/material";
import RoomCountdown from "./RoomCountdown";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import type { Room } from "../Services/rooms.service";

type RoomStatus = "waiting" | "preparing" | "in_progress" | "locked";

type RoomCardProps = {
  title: string;
  price: number;
  estimatedPrize: number;
  currency: string;
  status: RoomStatus;
  rounds?: number;
  jackpot?: number;
  players?: string; // formato "35/50"
  scheduledAt?: Date | null;
  orderIndex?: number | null; // Posición en la cola de juego (1, 2, 3)
  minPlayers?: number; // Mínimo de jugadores requeridos
  enrolledUsersCount?: number; // Número de usuarios únicos inscritos
  onJoin?: () => void;
};

const getStatusLabel = (status: RoomStatus) => {
  switch (status) {
    case "waiting":
      return "Esperando jugadores";
    case "preparing":
      return "Preparando";
    case "in_progress":
      return "En progreso";
    case "locked":
      return "Bloqueada";
    default:
      return "Desconocido";
  }
};

const getStatusColor = (status: RoomStatus) => {
  switch (status) {
    case "waiting":
      return "#4caf50"; // verde
    case "preparing":
      return "#ff9800"; // naranja
    case "in_progress":
      return "#f44336"; // rojo
    case "locked":
      return "#9e9e9e"; // gris
    default:
      return "#ffffff";
  }
};

type RoomInfoRowProps = {
  label: string;
  value: string | number;
  valueBold?: boolean;
};

const RoomInfoRow: React.FC<RoomInfoRowProps> = ({ label, value, valueBold = false }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Typography
      variant="body2"
      sx={{
        color: "#ffffff",
        opacity: 0.8,
        fontSize: "14px",
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: "#ffffff",
        fontWeight: valueBold ? 700 : 600,
        fontSize: valueBold ? "16px" : "14px",
      }}
    >
      {value}
    </Typography>
  </Box>
);

const RoomCard: React.FC<RoomCardProps> = ({
  title,
  price,
  estimatedPrize,
  currency,
  status,
  rounds,
  jackpot,
  players,
  scheduledAt,
  orderIndex,
  minPlayers = 2,
  enrolledUsersCount = 0,
  onJoin,
}) => {
  // Debug: Log de los datos recibidos
  React.useEffect(() => {
    console.log(`[RoomCard] 🔍 ${title}:`, {
      orderIndex,
      minPlayers,
      enrolledUsersCount,
      status,
      needsMorePlayers: orderIndex === 1 && enrolledUsersCount < minPlayers,
    });
  }, [title, orderIndex, minPlayers, enrolledUsersCount, status]);

  // Crear objeto Room para el componente RoomCountdown
  const roomForCountdown: Room = {
    id: "",
    title,
    price,
    estimatedPrize,
    currency,
    status,
    rounds,
    jackpot,
    players,
    scheduledAt,
  };
  return (
    <Box sx={{ marginBottom: "16px", marginTop: "-40px" }}>
      <Card
        onClick={status !== "locked" ? onJoin : undefined}
        sx={{
          background: "rgba(26, 26, 46, 0.4)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: 0,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset
          `,
          cursor: status === "locked" ? "not-allowed" : "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
            transition: "opacity 0.3s",
          },
          "&:hover": status !== "locked" ? {
            borderColor: "rgba(227, 191, 112, 0.5)",
            transform: "translateY(-4px)",
            boxShadow: `
              0 12px 40px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(227, 191, 112, 0.2) inset,
              0 4px 16px rgba(227, 191, 112, 0.2)
            `,
            background: "rgba(31, 34, 51, 0.7)",
            "&::before": {
              background: "linear-gradient(90deg, transparent, rgba(227, 191, 112, 0.3), transparent)",
            },
          } : {},
        }}
      >
        <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
          {/* Header: Título y Status */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: 700,
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              <Box
                sx={{
                  display: "inline-block",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  backgroundColor: getStatusColor(status) + "25",
                  border: `1px solid ${getStatusColor(status)}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: getStatusColor(status),
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {getStatusLabel(status)}
                </Typography>
              </Box>
            </Box>
            {/* Badge de posición en la cola */}
            {orderIndex !== null && orderIndex !== undefined && (
              <Box
                sx={{
                  px: 1.8,
                  py: 0.8,
                  borderRadius: "10px",
                  backgroundColor: orderIndex === 1 ? "#4caf5035" : orderIndex === 2 ? "#ff980035" : "#2196f335",
                  border: `2px solid ${orderIndex === 1 ? "#4caf50" : orderIndex === 2 ? "#ff9800" : "#2196f3"}`,
                  boxShadow: `0 4px 12px ${orderIndex === 1 ? "rgba(76, 175, 80, 0.5)" : orderIndex === 2 ? "rgba(255, 152, 0, 0.5)" : "rgba(33, 150, 243, 0.5)"}`,
                  ml: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: orderIndex === 1 ? "#4caf50" : orderIndex === 2 ? "#ff9800" : "#2196f3",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  {orderIndex === 1 ? "1️⃣" : orderIndex === 2 ? "2️⃣" : "3️⃣"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: orderIndex === 1 ? "#4caf50" : orderIndex === 2 ? "#ff9800" : "#2196f3",
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    display: "block",
                    textAlign: "center",
                    mt: 0.2,
                  }}
                >
                  {orderIndex === 1 ? "PRIMERA" : orderIndex === 2 ? "SEGUNDA" : "TERCERA"}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Sección de posición en la cola - Destacada */}
          {orderIndex !== null && orderIndex !== undefined && (
            <Box 
              sx={{ 
                mb: 2,
                p: 2,
                borderRadius: "10px",
                background: orderIndex === 1 
                  ? "linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(76, 175, 80, 0.25) 100%)"
                  : orderIndex === 2 
                  ? "linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 152, 0, 0.25) 100%)"
                  : "linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.25) 100%)",
                border: `2px solid ${orderIndex === 1 ? "#4caf50" : orderIndex === 2 ? "#ff9800" : "#2196f3"}`,
                boxShadow: `0 4px 16px ${orderIndex === 1 ? "rgba(76, 175, 80, 0.3)" : orderIndex === 2 ? "rgba(255, 152, 0, 0.3)" : "rgba(33, 150, 243, 0.3)"}`,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: orderIndex === 1 ? "#4caf50" : orderIndex === 2 ? "#ff9800" : "#2196f3",
                  fontSize: "16px",
                  fontWeight: 700,
                  textAlign: "center",
                  mb: orderIndex === 1 && enrolledUsersCount < minPlayers ? 1.5 : 0,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {orderIndex === 1 && "🎮 PRIMERA EN JUGAR"}
                {orderIndex === 2 && "⏳ SEGUNDA EN JUGAR"}
                {orderIndex === 3 && "📋 TERCERA EN JUGAR"}
              </Typography>
              {orderIndex === 1 && enrolledUsersCount < minPlayers && (
                <Box
                  sx={{
                    mt: 1.5,
                    px: 2,
                    py: 1.5,
                    borderRadius: "8px",
                    backgroundColor: "#ff980050",
                    border: "2px solid #ff9800",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#ff9800",
                      fontSize: "14px",
                      fontWeight: 700,
                      display: "block",
                      mb: 0.8,
                    }}
                  >
                    ⚠️ FALTAN JUGADORES PARA INICIAR
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#ff9800",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    Actualmente: <strong>{enrolledUsersCount}</strong> jugador{enrolledUsersCount !== 1 ? "es" : ""} | Mínimo requerido: <strong>{minPlayers}</strong>
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2, borderColor: "rgba(255, 255, 255, 0.1)" }} />

          {/* Información de la sala */}
          <Stack spacing={1.8} sx={{ mb: 2 }}>
            <RoomInfoRow
              label="Precio por cartón:"
              value={`${price.toFixed(2)} ${currency}`}
              valueBold
            />
            <RoomInfoRow
              label="Premio estimado:"
              value={`${estimatedPrize.toFixed(2)} ${currency}`}
              valueBold
            />
            {players && (
              <RoomInfoRow 
                label="Jugadores inscritos:" 
                value={players} 
              />
            )}
            {rounds !== undefined && rounds !== null && rounds > 0 && (
              <RoomInfoRow 
                label="Rondas:" 
                value={rounds} 
              />
            )}
          </Stack>

          {/* Contador regresivo */}
          {status === "waiting" && scheduledAt && (
            <Box sx={{ mb: 2 }}>
              <RoomCountdown room={roomForCountdown} />
            </Box>
          )}

          {/* Indicador de acción - Click para entrar */}
          {status !== "locked" && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid rgba(212, 175, 55, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <TouchAppIcon 
                sx={{ 
                  color: "#d4af37", 
                  fontSize: "20px",
                  animation: "pulse 2s ease-in-out infinite",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1, transform: "scale(1)" },
                    "50%": { opacity: 0.7, transform: "scale(1.1)" },
                  },
                }} 
              />
              <Typography
                variant="body2"
                sx={{
                  color: "#d4af37",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                Toca la tarjeta para entrar y seleccionar cartones
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoomCard;

