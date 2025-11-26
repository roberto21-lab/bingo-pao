import * as React from "react";
import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import RoomCountdown from "./RoomCountdown";
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
  onJoin?: () => void;
  // Nuevos props para listas de inscripciones
  queueNumber?: number;
  showPrizeInsteadOfPlayers?: boolean; // Mostrar premio acumulado en lugar de jugadores
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
  onJoin,
  queueNumber,
  showPrizeInsteadOfPlayers = false,
}) => {
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
        <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: "8px",
                backgroundColor: getStatusColor(status) + "20",
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
                }}
              >
                {getStatusLabel(status)}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {queueNumber && (
              <RoomInfoRow
                label="Lista de inscripciones:"
                value={`#${queueNumber}`}
                valueBold
              />
            )}
            <RoomInfoRow
              label="Precio por cartón:"
              value={`${price.toFixed(2)} ${currency}`}
              valueBold
            />
            {showPrizeInsteadOfPlayers ? (
              <RoomInfoRow
                label="Premio acumulado:"
                value={`${estimatedPrize.toFixed(2)} ${currency}`}
                valueBold
              />
            ) : (
              <>
            <RoomInfoRow
              label="Premio estimado:"
              value={`${estimatedPrize.toFixed(2)} ${currency}`}
              valueBold
            />
            {players && <RoomInfoRow label="Jugadores:" value={players} />}
              </>
            )}
            {rounds && <RoomInfoRow label="Rondas:" value={rounds} />}
            {jackpot && (
              <RoomInfoRow
                label="Jackpot:"
                value={`${jackpot.toFixed(2)} ${currency}`}
                valueBold
              />
            )}
          </Stack>

          {/* Contador regresivo */}
          {status === "waiting" && scheduledAt && (
            <Box sx={{ mt: 1.5 }}>
              <RoomCountdown room={roomForCountdown} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoomCard;

