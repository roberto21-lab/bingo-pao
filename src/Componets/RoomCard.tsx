// src/Componets/RoomCard.tsx
import * as React from "react";
import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import LockIcon from "@mui/icons-material/Lock";

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

const RoomCard: React.FC<RoomCardProps> = ({
  title,
  price,
  estimatedPrize,
  status,
  rounds,
  jackpot,
  players,
  onJoin,
}) => {
  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
      {/* Card izquierda - Dorada */}
      <Card
        sx={{
          flex: 1,
          minWidth: "140px",
          background: `
            linear-gradient(135deg, 
              rgba(201, 168, 90, 0.6) 0%, 
              rgba(227, 191, 112, 0.75) 30%, 
              rgba(240, 208, 138, 0.7) 60%, 
              rgba(227, 191, 112, 0.8) 100%
            )
          `,
          backdropFilter: "blur(25px) saturate(200%)",
          WebkitBackdropFilter: "blur(25px) saturate(200%)",
          borderRadius: "16px",
          border: "1px solid rgba(227, 191, 112, 0.5)",
          boxShadow: `
            0 8px 32px rgba(227, 191, 112, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.2) inset,
            0 2px 12px rgba(227, 191, 112, 0.3)
          `,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 2, position: "relative", zIndex: 1 }}>
          {/* Icono pequeño en la esquina superior derecha */}
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <StarIcon sx={{ fontSize: "14px", color: "#ffffff" }} />
          </Box>

          <Typography
            variant="h6"
            sx={{
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              mb: 1.5,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
              pr: 3,
            }}
          >
            {title}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.5 }}>
            <Typography
              component="span"
              sx={{
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              }}
            >
              Precio:
            </Typography>
            <Typography
              component="span"
              sx={{
                color: "#ffffff",
                fontSize: "20px",
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              }}
            >
              ${price.toFixed(2)}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: "#ffffff",
              fontSize: "11px",
              opacity: 0.95,
              mb: 0.5,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
            }}
          >
            Estimado: ${estimatedPrize.toFixed(2)}
          </Typography>

          {players && (
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: "11px",
                opacity: 0.95,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
              }}
            >
              Jugadores: {players}
            </Typography>
          )}

          {!players && status === "waiting" && (
            <Typography
              variant="body2"
              sx={{
                color: "#ffffff",
                fontSize: "11px",
                opacity: 0.95,
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
              }}
            >
              Disponible
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Card derecha - Gris oscuro */}
      <Card
        sx={{
          flex: 1,
          minWidth: "140px",
          background: "rgba(31, 34, 51, 0.5)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset
          `,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 2, position: "relative", zIndex: 1 }}>
          <Stack spacing={1}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                Precio ${price.toFixed(2)}
              </Typography>
              {status === "locked" && (
                <LockIcon sx={{ fontSize: "14px", color: "#9e9e9e" }} />
              )}
            </Box>

            {rounds && (
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                Rondas: {rounds}
              </Typography>
            )}

            {jackpot ? (
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                Jackpot: ${jackpot.toFixed(2)}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: "#ffffff",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                Estimado: ${estimatedPrize.toFixed(2)}
              </Typography>
            )}

            <Button
              fullWidth
              onClick={onJoin}
              disabled={status === "locked"}
              sx={{
                mt: 1,
                py: 0.75,
                borderRadius: "8px",
                textTransform: "none",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: getStatusColor(status),
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: getStatusColor(status),
                  opacity: 0.9,
                },
                "&:disabled": {
                  backgroundColor: "#9e9e9e",
                  color: "#ffffff",
                },
              }}
            >
              {getStatusLabel(status)}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoomCard;

